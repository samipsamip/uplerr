import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	ResumeExtractionError,
	ResumeValidationError,
} from '../../../utils/error-utils';

const serviceMocks = vi.hoisted(() => ({
	validatePdf: vi.fn(),
	extractTextFromPDF: vi.fn(),
}));

vi.mock('../../../components/profiles/profiles.service', () => ({
	validatePdf: serviceMocks.validatePdf,
	extractTextFromPDF: serviceMocks.extractTextFromPDF,
}));

const llmMocks = vi.hoisted(() => ({
	extractDetailsFromResume: vi.fn(),
}));

vi.mock('../../../lib/lllm', () => ({
	llmService: {
		extractDetailsFromResume: llmMocks.extractDetailsFromResume,
	},
}));

const uploadMocks = vi.hoisted(() => ({
	uploadResumeToBucket: vi.fn(),
}));

vi.mock('../../../lib/upload-utils', () => ({
	uploadResumeToBucket: uploadMocks.uploadResumeToBucket,
}));

const dbMocks = vi.hoisted(() => ({
	values: vi.fn(),
	selectReturn: vi.fn(),
}));

const selectChain = {
	from: () => selectChain,
	where: () => selectChain,
	limit: () => dbMocks.selectReturn(),
};

vi.mock('../../../utils/db', () => ({
	default: {
		insert: vi.fn(() => ({ values: dbMocks.values })),
		select: vi.fn(() => selectChain),
		transaction: vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
			const tx = {
				insert: vi.fn(() => ({ values: dbMocks.values })),
				update: vi.fn(() => ({
					set: vi.fn(() => ({
						where: vi.fn().mockResolvedValue(undefined),
					})),
				})),
			};
			await cb(tx);
		}),
	},
}));

const { createResumeExtractionFSM, ResumeTransitionState } =
	await import('../../../lib/fsm/ResumeExtractionFSM');

const validFile = new File(['pdf-content'], 'resume.pdf', {
	type: 'application/pdf',
});

const defaultInput = {
	file: validFile,
	userId: 'user-123',
	profileId: 'profile-123',
};

const validLlmResult = {
	isValid: true,
	name: 'Test User',
	email: 'test@example.com',
	skills: ['TypeScript'],
	experience: [],
	education: [],
};

beforeEach(() => {
	vi.clearAllMocks();
	serviceMocks.validatePdf.mockResolvedValue(undefined);
	serviceMocks.extractTextFromPDF.mockResolvedValue('Sample resume text');
	llmMocks.extractDetailsFromResume.mockResolvedValue(validLlmResult);
	uploadMocks.uploadResumeToBucket.mockResolvedValue('uploads/resume.pdf');
	dbMocks.values.mockResolvedValue(undefined);
	dbMocks.selectReturn.mockResolvedValue([]); // no existing CV by default
});

describe('ResumeExtractionFSM — happy path', () => {
	it('reaches DONE and writes to DB on a valid resume', async () => {
		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.DONE);
		expect(machine.error).toBeNull();
	});

	it('uploads the file to R2 with the correct userId', async () => {
		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(uploadMocks.uploadResumeToBucket).toHaveBeenCalledOnce();
		expect(uploadMocks.uploadResumeToBucket).toHaveBeenCalledWith(
			validFile,
			'user-123',
		);
	});

	it('writes to DB with structured_data excluding isValid', async () => {
		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		const insertedValues = dbMocks.values.mock.calls[0][0];
		expect(insertedValues.structured_data).not.toHaveProperty('isValid');
		expect(insertedValues.structured_data).toMatchObject({
			name: 'Test User',
			email: 'test@example.com',
		});
		expect(insertedValues.is_verified).toBe(false);
		expect(insertedValues.is_active).toBe(true);
		expect(insertedValues.profile_id).toBe('profile-123');
		expect(insertedValues.original_filename).toBe('resume.pdf');
		expect(insertedValues.resume_key).toBe('uploads/resume.pdf');
	});

	it('stores the raw text in the DB', async () => {
		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(dbMocks.values.mock.calls[0][0].raw_text).toBe('Sample resume text');
	});
});

describe('ResumeExtractionFSM — PARSE_RESUME errors', () => {
	it('reaches RESUME_VALIDATION_ERROR on page limit exceeded', async () => {
		serviceMocks.validatePdf.mockRejectedValue(
			new ResumeValidationError('PAGE_LIMIT', 'Too many pages.'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_VALIDATION_ERROR);
		expect(machine.error).toBeInstanceOf(ResumeValidationError);
		expect((machine.error as ResumeValidationError).code).toBe('PAGE_LIMIT');
	});

	it('reaches RESUME_VALIDATION_ERROR on corrupted PDF', async () => {
		serviceMocks.validatePdf.mockRejectedValue(
			new ResumeValidationError('CORRUPTED', 'Corrupted file.'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_VALIDATION_ERROR);
		expect((machine.error as ResumeValidationError).code).toBe('CORRUPTED');
	});

	it('reaches RESUME_EXTRACTION_ERROR when text extraction fails', async () => {
		serviceMocks.extractTextFromPDF.mockRejectedValue(
			new ResumeExtractionError('Failed to extract text.'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_EXTRACTION_ERROR);
		expect(machine.error).toBeInstanceOf(ResumeExtractionError);
	});

	it('reaches ERROR on an unexpected parse failure', async () => {
		serviceMocks.validatePdf.mockRejectedValue(new Error('Unexpected error'));

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.ERROR);
	});

	it('does not call the LLM when parsing fails', async () => {
		serviceMocks.validatePdf.mockRejectedValue(
			new ResumeValidationError('CORRUPTED', 'Corrupted.'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(llmMocks.extractDetailsFromResume).not.toHaveBeenCalled();
	});
});

describe('ResumeExtractionFSM — LLM_EXTRACTION errors', () => {
	it('reaches RESUME_PARSE_FAILED when LLM returns isValid: false', async () => {
		llmMocks.extractDetailsFromResume.mockResolvedValue({
			...validLlmResult,
			isValid: false,
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_PARSE_FAILED);
	});

	it('does not upload to R2 when LLM rejects the document', async () => {
		llmMocks.extractDetailsFromResume.mockResolvedValue({
			...validLlmResult,
			isValid: false,
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(uploadMocks.uploadResumeToBucket).not.toHaveBeenCalled();
		expect(dbMocks.values).not.toHaveBeenCalled();
	});

	it('reaches RESUME_PARSE_FAILED when LLM call throws', async () => {
		llmMocks.extractDetailsFromResume.mockRejectedValue(
			new Error('LLM timeout'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_PARSE_FAILED);
	});
});

describe('ResumeExtractionFSM — UPLOAD_TO_CLOUD errors', () => {
	it('sets machine.error and does not reach DONE when R2 upload fails', async () => {
		uploadMocks.uploadResumeToBucket.mockRejectedValue(new Error('S3 failure'));

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).not.toBe(ResumeTransitionState.DONE);
		expect(machine.error).toBeInstanceOf(Error);
		expect((machine.error as Error).message).toBe('S3 failure');
	});

	it('does not write to DB when R2 upload fails', async () => {
		uploadMocks.uploadResumeToBucket.mockRejectedValue(new Error('S3 failure'));

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(dbMocks.values).not.toHaveBeenCalled();
	});
});
