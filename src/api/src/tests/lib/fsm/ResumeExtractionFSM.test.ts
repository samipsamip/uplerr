import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	ResumeExtractionError,
	ResumeModerationError,
	ResumeValidationError,
} from '../../../utils/error-utils';

const pdfParserMock = vi.hoisted(() => ({ parse: vi.fn() }));

vi.mock('../../../lib/pdf-parser', () => ({
	default: pdfParserMock,
}));

const braintrustMocks = vi.hoisted(() => ({
	checkForModeration: vi.fn(),
	performValidationCheckOnResume: vi.fn(),
	performResumeExtraction: vi.fn(),
	performSkillsExtraction: vi.fn(),
	performProjectsExtraction: vi.fn(),
}));

vi.mock('../../../lib/lllm/braintrust', () => ({
	braintrust: {
		checkForModeration: braintrustMocks.checkForModeration,
		performValidationCheckOnResume:
			braintrustMocks.performValidationCheckOnResume,
		performResumeExtraction: braintrustMocks.performResumeExtraction,
		performSkillsExtraction: braintrustMocks.performSkillsExtraction,
		performProjectsExtraction: braintrustMocks.performProjectsExtraction,
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
	updateSet: vi.fn(),
	// whereReturn: result when .where() is awaited directly (count queries)
	whereReturn: vi.fn(),
	// limitReturn: result when .where().limit() is called (duplicate-check queries)
	limitReturn: vi.fn(),
	selectDistinctReturn: vi.fn(),
}));

// where() returns a Promise (for count queries) that also exposes .limit()
// (for duplicate-check queries). The two paths consume separate mocks so
// mock sequences stay predictable.
const selectChain: Record<string, unknown> = {
	from: () => selectChain,
	where: () => {
		const p = dbMocks.whereReturn() as Promise<unknown> & {
			limit: () => Promise<unknown>;
		};
		p.limit = () => dbMocks.limitReturn();
		return p;
	},
	limit: () => dbMocks.limitReturn(),
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
		update: vi.fn(() => ({
			set: vi.fn(() => ({ where: dbMocks.updateSet })),
		})),
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

const validExtractionResult = {
	full_name: 'Test User',
	contact_details: {
		email: 'test@example.com',
		phone: null,
		location: null,
		linkedin: null,
		vcs_platform: null,
		vcs_url: null,
		portfolio: null,
	},
	professional_summary: null,
	work_history: [],
	education: [],
	certifications: [],
	notable_achievements: [],
};

const validSkillsResult = {
	technical_skills: [{ name: 'TypeScript', source: 'skills_section' as const }],
	tools_platforms: [],
	spoken_languages: [],
	soft_skills: [],
};

const validProjectsResult = {
	projects: [],
};

beforeEach(() => {
	vi.clearAllMocks();

	pdfParserMock.parse.mockResolvedValue({
		text: 'Sample resume text',
		links: [],
	});
	braintrustMocks.checkForModeration.mockResolvedValue({
		is_malicious: false,
		reason: '',
	});
	braintrustMocks.performValidationCheckOnResume.mockResolvedValue({
		isValid: true,
	});
	braintrustMocks.performResumeExtraction.mockResolvedValue(
		validExtractionResult,
	);
	braintrustMocks.performSkillsExtraction.mockResolvedValue(validSkillsResult);
	braintrustMocks.performProjectsExtraction.mockResolvedValue(
		validProjectsResult,
	);
	uploadMocks.uploadResumeToBucket.mockResolvedValue('uploads/resume.pdf');
	dbMocks.values.mockResolvedValue(undefined);
	dbMocks.updateSet.mockResolvedValue(undefined);
	dbMocks.limitReturn.mockResolvedValue([]); // duplicate check → no existing CV
	dbMocks.whereReturn.mockResolvedValue([{ value: 1 }]); // count query → 1 (below threshold)
	dbMocks.selectDistinctReturn.mockReturnValue([]);
});

describe('ResumeExtractionFSM — happy path', () => {
	it('reaches DONE on a valid resume', async () => {
		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();
		expect(machine.value).toBe(ResumeTransitionState.DONE);
		expect(machine.error).toBeNull();
	});

	it('uploads the file to R2 with the correct userId', async () => {
		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();
		expect(uploadMocks.uploadResumeToBucket).toHaveBeenCalledWith(
			validFile,
			'user-123',
		);
	});

	it('writes structured_data as { extraction, skills, projects }', async () => {
		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		const inserted = dbMocks.values.mock.calls[0][0];
		expect(inserted.structured_data).toEqual({
			extraction: validExtractionResult,
			skills: validSkillsResult,
			projects: validProjectsResult,
		});
		expect(inserted.is_verified).toBe(false);
		expect(inserted.is_active).toBe(true);
		expect(inserted.profile_id).toBe('profile-123');
		expect(inserted.original_filename).toBe('resume.pdf');
		expect(inserted.resume_key).toBe('uploads/resume.pdf');
	});

	it('stores raw_text in the DB', async () => {
		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();
		expect(dbMocks.values.mock.calls[0][0].raw_text).toBe('Sample resume text');
	});

	it('exposes structuredData getter with combined result', async () => {
		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();
		expect(machine.structuredData).toEqual({
			extraction: validExtractionResult,
			skills: validSkillsResult,
			projects: validProjectsResult,
		});
	});

	it('passes PDF links as separate array to performResumeExtraction', async () => {
		pdfParserMock.parse.mockResolvedValue({
			text: 'Resume body',
			links: ['https://github.com/user'],
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		const [text, links] = braintrustMocks.performResumeExtraction.mock.calls[0];
		expect(text).toBe('Resume body');
		expect(links).toEqual(['https://github.com/user']);
	});

	it('passes empty links array to performResumeExtraction when none present', async () => {
		pdfParserMock.parse.mockResolvedValue({
			text: 'Resume body',
			links: [],
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		const [text, links] = braintrustMocks.performResumeExtraction.mock.calls[0];
		expect(text).toBe('Resume body');
		expect(links).toEqual([]);
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
		expect((machine.error as ResumeValidationError).code).toBe('PAGE_LIMIT');
	});

	it('reaches RESUME_EXTRACTION_ERROR when PDF extraction fails', async () => {
		pdfParserMock.parse.mockRejectedValue(
			new ResumeExtractionError('Failed to extract text.'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_EXTRACTION_ERROR);
	});

	it('does not call Braintrust when parsing fails', async () => {
		pdfParserMock.parse.mockRejectedValue(
			new ResumeValidationError('CORRUPTED', 'Corrupted.'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(braintrustMocks.checkForModeration).not.toHaveBeenCalled();
	});
});

describe('ResumeExtractionFSM — MODERATION_CHECK', () => {
	it('reaches MALICIOUS_CONTENT_DETECTED when content is flagged', async () => {
		braintrustMocks.checkForModeration.mockResolvedValue({
			is_malicious: true,
			reason: 'Contains prompt injection',
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(
			ResumeTransitionState.MALICIOUS_CONTENT_DETECTED,
		);
		expect(machine.error).toBeInstanceOf(ResumeModerationError);
	});

	it('saves moderation record to DB when content is flagged', async () => {
		braintrustMocks.checkForModeration.mockResolvedValue({
			is_malicious: true,
			reason: 'Prompt injection attempt',
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(dbMocks.values).toHaveBeenCalledWith(
			expect.objectContaining({
				profile_id: 'profile-123',
				raw_text: 'Sample resume text',
				reason: 'Prompt injection attempt',
			}),
		);
	});

	it('bans the profile when moderation count reaches threshold', async () => {
		braintrustMocks.checkForModeration.mockResolvedValue({
			is_malicious: true,
			reason: 'Malicious content',
		});
		// where() is called twice: once in duplicate-check (result ignored by .limit()),
		// once in count query (result matters for ban threshold)
		dbMocks.whereReturn
			.mockResolvedValueOnce([]) // duplicate-check where() — value discarded by .limit()
			.mockResolvedValueOnce([{ value: 3 }]); // count query — triggers ban

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(dbMocks.updateSet).toHaveBeenCalled();
	});

	it('does not proceed to validation when moderation flags content', async () => {
		braintrustMocks.checkForModeration.mockResolvedValue({
			is_malicious: true,
			reason: 'Bad content',
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(
			braintrustMocks.performValidationCheckOnResume,
		).not.toHaveBeenCalled();
		expect(uploadMocks.uploadResumeToBucket).not.toHaveBeenCalled();
	});
});

describe('ResumeExtractionFSM — VALIDATION_CHECK', () => {
	it('reaches RESUME_PARSE_FAILED when document is not a resume', async () => {
		braintrustMocks.performValidationCheckOnResume.mockResolvedValue({
			isValid: false,
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_PARSE_FAILED);
	});

	it('does not upload when document fails validation', async () => {
		braintrustMocks.performValidationCheckOnResume.mockResolvedValue({
			isValid: false,
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(uploadMocks.uploadResumeToBucket).not.toHaveBeenCalled();
		expect(dbMocks.values).not.toHaveBeenCalled();
	});
});

describe('ResumeExtractionFSM — RESUME_EXTRACTION / SKILLS_EXTRACTION / PROJECTS_EXTRACTION', () => {
	it('reaches RESUME_PARSE_FAILED when performResumeExtraction throws', async () => {
		braintrustMocks.performResumeExtraction.mockRejectedValue(
			new Error('LLM timeout'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_PARSE_FAILED);
	});

	it('reaches RESUME_PARSE_FAILED when performSkillsExtraction throws', async () => {
		braintrustMocks.performSkillsExtraction.mockRejectedValue(
			new Error('LLM timeout'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_PARSE_FAILED);
	});

	it('reaches RESUME_PARSE_FAILED when performProjectsExtraction throws', async () => {
		braintrustMocks.performProjectsExtraction.mockRejectedValue(
			new Error('LLM timeout'),
		);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.RESUME_PARSE_FAILED);
	});

	it('passes raw text and pdf links separately to performProjectsExtraction', async () => {
		pdfParserMock.parse.mockResolvedValue({
			text: 'Resume body',
			links: ['https://github.com/user'],
		});

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		const [text, links] =
			braintrustMocks.performProjectsExtraction.mock.calls[0];
		expect(text).toBe('Resume body');
		expect(links).toEqual(['https://github.com/user']);
	});
});

describe('ResumeExtractionFSM — SKILL_PREMATCH', () => {
	it('exposes matched skill count when canonical matches are found', async () => {
		braintrustMocks.performSkillsExtraction.mockResolvedValue({
			technical_skills: [
				{ name: 'TypeScript', source: 'skills_section' },
				{ name: 'React', source: 'skills_section' },
			],
			tools_platforms: [],
			spoken_languages: [],
			soft_skills: [],
		});
		dbMocks.selectDistinctReturn
			.mockReturnValueOnce([{ skill_id: 'skill-1' }])
			.mockReturnValueOnce([{ id: 'skill-2' }]);

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).toBe(ResumeTransitionState.DONE);
		expect(machine.skillMatchMeta).toEqual({ matched: 2, total: 2 });
	});

	it('falls back to matched:0 when DB query fails during prematch', async () => {
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
	it('does not reach DONE when R2 upload fails', async () => {
		uploadMocks.uploadResumeToBucket.mockRejectedValue(new Error('S3 failure'));

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(machine.value).not.toBe(ResumeTransitionState.DONE);
		expect((machine.error as Error).message).toBe('S3 failure');
	});

	it('does not write to DB when R2 upload fails', async () => {
		uploadMocks.uploadResumeToBucket.mockRejectedValue(new Error('S3 failure'));

		const machine = createResumeExtractionFSM(defaultInput);
		await machine.run();

		expect(dbMocks.values).not.toHaveBeenCalled();
	});
});
