import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	ResumeExtractionError,
	ResumeValidationError,
} from '../../../utils/error-utils';

const pdfParserMock = vi.hoisted(() => ({ parse: vi.fn() }));

vi.mock('../../../lib/pdf-parser', () => ({
	default: pdfParserMock,
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
	selectDistinctReturn: vi.fn(),
}));

const selectChain = {
	from: () => selectChain,
	where: () => selectChain,
	limit: () => dbMocks.selectReturn(),
};

const selectDistinctChain = {
	from: () => selectDistinctChain,
	where: () => Promise.resolve(dbMocks.selectDistinctReturn()),
};

vi.mock('../../../utils/db', () => ({
	default: {
		insert: vi.fn(() => ({ values: dbMocks.values })),
		select: vi.fn(() => selectChain),
		selectDistinct: vi.fn(() => selectDistinctChain),
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
	pdfParserMock.parse.mockResolvedValue({
		text: 'Sample resume text',
		links: [],
	});
	llmMocks.extractDetailsFromResume.mockResolvedValue(validLlmResult);
	uploadMocks.uploadResumeToBucket.mockResolvedValue('uploads/resume.pdf');
	dbMocks.values.mockResolvedValue(undefined);
	dbMocks.selectReturn.mockResolvedValue([]); // no existing CV by default
	dbMocks.selectDistinctReturn.mockReturnValue([]); // no skill matches by default
});

describe('ResumeExtractionFSM — PDF link merging', () => {
	it('fills missing github/linkedin/portfolio from PDF annotation links', async () => {
		pdfParserMock.parse.mockResolvedValue({
			text: 'Sample resume text',
			links: [
				'https://github.com/testuser',
				'https://linkedin.com/in/testuser',
				'https://testuser.dev',
			],
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.DONE);
		expect(machine.structuredData?.links?.github).toBe(
			'https://github.com/testuser',
		);
		expect(machine.structuredData?.links?.linkedin).toBe(
			'https://linkedin.com/in/testuser',
		);
		expect(machine.structuredData?.links?.portfolio).toBe(
			'https://testuser.dev',
		);
	});

	it('does not overwrite links already extracted by the LLM', async () => {
		llmMocks.extractDetailsFromResume.mockResolvedValue({
			...validLlmResult,
			links: { github: 'https://github.com/from-llm' },
		});
		pdfParserMock.parse.mockResolvedValue({
			text: 'Sample resume text',
			links: ['https://github.com/from-pdf'],
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.structuredData?.links?.github).toBe(
			'https://github.com/from-llm',
		);
	});
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
		pdfParserMock.parse.mockRejectedValue(
			new ResumeValidationError('PAGE_LIMIT', 'Too many pages.'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_VALIDATION_ERROR);
		expect(machine.error).toBeInstanceOf(ResumeValidationError);
		expect((machine.error as ResumeValidationError).code).toBe('PAGE_LIMIT');
	});

	it('reaches RESUME_VALIDATION_ERROR on corrupted PDF', async () => {
		pdfParserMock.parse.mockRejectedValue(
			new ResumeValidationError('CORRUPTED', 'Corrupted file.'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_VALIDATION_ERROR);
		expect((machine.error as ResumeValidationError).code).toBe('CORRUPTED');
	});

	it('reaches RESUME_EXTRACTION_ERROR when PDF extraction fails', async () => {
		pdfParserMock.parse.mockRejectedValue(
			new ResumeExtractionError('Failed to extract text.'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_EXTRACTION_ERROR);
		expect(machine.error).toBeInstanceOf(ResumeExtractionError);
	});

	it('reaches ERROR on an unexpected parse failure', async () => {
		pdfParserMock.parse.mockRejectedValue(new Error('Unexpected error'));

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.ERROR);
	});

	it('does not call the LLM when parsing fails', async () => {
		pdfParserMock.parse.mockRejectedValue(
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

describe('ResumeExtractionFSM — SKILL_PREMATCH', () => {
	it('exposes matched skill count when canonical matches are found', async () => {
		llmMocks.extractDetailsFromResume.mockResolvedValue({
			...validLlmResult,
			skills: ['TypeScript', 'React'],
		});
		// first selectDistinct call (aliases) returns 1 match, second (direct) returns 1 match
		dbMocks.selectDistinctReturn
			.mockReturnValueOnce([{ skill_id: 'skill-1' }])
			.mockReturnValueOnce([{ id: 'skill-2' }]);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.DONE);
		expect(machine.skillMatchMeta).toEqual({ matched: 2, total: 2 });
	});

	it('falls back to matched:0 when the DB query fails', async () => {
		llmMocks.extractDetailsFromResume.mockResolvedValue({
			...validLlmResult,
			skills: ['TypeScript'],
		});
		dbMocks.selectDistinctReturn.mockImplementation(() => {
			throw new Error('DB error');
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.DONE);
		expect(machine.skillMatchMeta.matched).toBe(0);
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
