import type { Context, Next } from 'hono';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { cvProfileSchema } from '../../../schemas/cv_profiles.schema';
import {
	createTestDb,
	seedProfile,
	type TestDb,
} from '../../../tests/helpers/db';

const dbContainer = vi.hoisted(() => ({ db: null as TestDb | null }));

vi.mock('../../../utils/db', () => ({
	get default() {
		return dbContainer.db;
	},
}));

const uploadMocks = vi.hoisted(() => ({
	uploadResumeToBucket: vi.fn(),
	deleteResumeFromBucket: vi.fn(),
}));

vi.mock('../../../lib/upload-utils', () => ({
	uploadResumeToBucket: uploadMocks.uploadResumeToBucket,
	deleteResumeFromBucket: uploadMocks.deleteResumeFromBucket,
}));

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

let db: TestDb;
let userId: string;
let profileId: string;

beforeAll(async () => {
	db = await createTestDb();
	dbContainer.db = db;
	({ userId, profileId } = await seedProfile(db));
});

beforeEach(async () => {
	await db.delete(cvProfileSchema);
	vi.clearAllMocks();

	uploadMocks.uploadResumeToBucket.mockResolvedValue('uploads/test-resume.pdf');
	uploadMocks.deleteResumeFromBucket.mockResolvedValue(undefined);
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
	braintrustMocks.performResumeExtraction.mockResolvedValue({
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
	});
	braintrustMocks.performSkillsExtraction.mockResolvedValue({
		technical_skills: [],
		tools_platforms: [],
		spoken_languages: [],
		soft_skills: [],
	});
	braintrustMocks.performProjectsExtraction.mockResolvedValue({
		projects: [],
	});
});

const { default: profileRoute } =
	await import('../../../components/profiles/profiles.route');

vi.mock('../../../lib/middleware', () => ({
	get authMiddleWare() {
		return async (c: Context, next: Next) => {
			c.set('user', { id: userId });
			c.set('profileId', profileId);
			await next();
		};
	},
}));

const makeResumeRequest = (path: string, file: File) => {
	const form = new FormData();
	form.append('resume', file);
	return profileRoute.request(path, { method: 'POST', body: form });
};

const validPdf = new File(['pdf-content'], 'resume.pdf', {
	type: 'application/pdf',
});
const emptyPdf = new File([], 'empty.pdf', { type: 'application/pdf' });
const largePdf = new File([new Uint8Array(3 * 1024 * 1024)], 'large.pdf', {
	type: 'application/pdf',
});

describe('GET /api/profile', () => {
	it('returns profile with cv as null when no active CV exists', async () => {
		const res = await profileRoute.request('/');

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.id).toBe(profileId);
		expect(body.cv).toBeNull();
	});

	it('returns profile with cv data when an active CV exists', async () => {
		await db.insert(cvProfileSchema).values({
			profile_id: profileId,
			original_filename: 'my-cv.pdf',
			structured_data: { name: 'Test' },
			is_active: true,
			is_verified: false,
		});

		const res = await profileRoute.request('/');

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.cv.filename).toBe('my-cv.pdf');
		expect(body.cv.hasStructuredData).toBe(true);
		expect(body.cv.is_verified).toBe(false);
		expect(body.cv.structuredData).toEqual({ name: 'Test' });
	});

	it('returns 500 when an unexpected error occurs', async () => {
		const savedDb = dbContainer.db;
		dbContainer.db = null;
		try {
			const res = await profileRoute.request('/');
			expect(res.status).toBe(500);
		} finally {
			dbContainer.db = savedDb;
		}
	});
});

describe('POST /api/profile/upload-resume', () => {
	it('returns 400 when no file is provided', async () => {
		const res = await profileRoute.request('/upload-resume', {
			method: 'POST',
			body: new FormData(),
		});
		expect(res.status).toBe(400);
	});

	it('returns 400 when file is empty', async () => {
		const res = await makeResumeRequest('/upload-resume', emptyPdf);
		expect(res.status).toBe(400);
	});

	it('returns 413 when file exceeds 2MB', async () => {
		const res = await makeResumeRequest('/upload-resume', largePdf);
		expect(res.status).toBe(413);
	});

	it('uploads the resume and inserts a cv_profile row', async () => {
		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(201);
		expect(uploadMocks.uploadResumeToBucket).toHaveBeenCalledOnce();

		const [cvProfile] = await db.select().from(cvProfileSchema);
		expect(cvProfile.original_filename).toBe('resume.pdf');
		expect(cvProfile.is_active).toBe(true);
		expect(cvProfile.resume_key).toBe('uploads/test-resume.pdf');
	});

	it('returns 413 when PDF exceeds page limit', async () => {
		pdfParserMock.parse.mockRejectedValue(
			new (await import('../../../utils/error-utils')).ResumeValidationError(
				'PAGE_LIMIT',
				'Too many pages.',
			),
		);

		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(413);
		expect(uploadMocks.uploadResumeToBucket).not.toHaveBeenCalled();
	});

	it('returns 400 when PDF is corrupted', async () => {
		pdfParserMock.parse.mockRejectedValue(
			new (await import('../../../utils/error-utils')).ResumeValidationError(
				'CORRUPTED',
				'Corrupted PDF.',
			),
		);

		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(400);
	});

	it('returns 500 when an unexpected error occurs during upload', async () => {
		uploadMocks.uploadResumeToBucket.mockRejectedValue(new Error('S3 failure'));

		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(500);
	});

	it('returns 422 when the document is not a valid resume', async () => {
		braintrustMocks.performValidationCheckOnResume.mockResolvedValue({
			isValid: false,
		});

		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(422);
	});

	it('returns 422 when content is flagged as malicious', async () => {
		braintrustMocks.checkForModeration.mockResolvedValue({
			is_malicious: true,
			reason: 'Prompt injection detected',
		});

		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(422);
	});

	it('returns 200 with duplicate message when the same resume is uploaded again', async () => {
		await makeResumeRequest('/upload-resume', validPdf);
		vi.clearAllMocks();

		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(200);
		expect((await res.json()).message).toBe(
			'This resume has already been uploaded.',
		);
		expect(uploadMocks.uploadResumeToBucket).not.toHaveBeenCalled();
		expect(braintrustMocks.checkForModeration).not.toHaveBeenCalled();
	});

	it('deactivates old CV and inserts new one when a different resume is uploaded', async () => {
		await db.insert(cvProfileSchema).values({
			profile_id: profileId,
			original_filename: 'old.pdf',
			resume_key: 'uploads/old-resume.pdf',
			resume_hash: 'old-hash',
			is_active: true,
		});

		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(201);
		expect(uploadMocks.deleteResumeFromBucket).toHaveBeenCalledWith(
			'uploads/old-resume.pdf',
		);

		const allCvs = await db.select().from(cvProfileSchema);
		expect(allCvs).toHaveLength(2);
		expect(
			allCvs.find((cv) => cv.original_filename === 'old.pdf')?.is_active,
		).toBe(false);
		expect(
			allCvs.find((cv) => cv.original_filename === 'resume.pdf')?.is_active,
		).toBe(true);
	});
});

const makeVerifyRequest = (body: object) =>
	profileRoute.request('/resume', {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});

describe('PATCH /api/profile/resume', () => {
	it('returns 404 when no active CV exists', async () => {
		const res = await makeVerifyRequest({});
		expect(res.status).toBe(404);
	});

	it('sets is_verified to true without changing structured_data when body has no structuredData', async () => {
		await db.insert(cvProfileSchema).values({
			profile_id: profileId,
			original_filename: 'cv.pdf',
			structured_data: { name: 'Original' },
			is_active: true,
		});

		const res = await makeVerifyRequest({});

		expect(res.status).toBe(200);
		const [cv] = await db.select().from(cvProfileSchema);
		expect(cv.is_verified).toBe(true);
		expect((cv.structured_data as { name: string }).name).toBe('Original');
	});

	it('sets is_verified and updates structured_data when structuredData is provided', async () => {
		await db.insert(cvProfileSchema).values({
			profile_id: profileId,
			original_filename: 'cv.pdf',
			structured_data: { extraction: { full_name: 'Old Name' }, skills: {} },
			is_active: true,
		});

		const updatedData = {
			extraction: {
				full_name: 'New Name',
				contact_details: {
					email: null,
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
			},
			skills: {
				technical_skills: [],
				tools_platforms: [],
				spoken_languages: [],
				soft_skills: [],
			},
			projects: {
				projects: [],
			},
		};

		const res = await makeVerifyRequest({ structuredData: updatedData });

		expect(res.status).toBe(200);
		const [cv] = await db.select().from(cvProfileSchema);
		expect(cv.is_verified).toBe(true);
		expect(
			(cv.structured_data as { extraction: { full_name: string } }).extraction
				.full_name,
		).toBe('New Name');
	});

	it('triggers skills upsert when structuredData has non-empty skill arrays', async () => {
		await db.insert(cvProfileSchema).values({
			profile_id: profileId,
			original_filename: 'cv.pdf',
			structured_data: {},
			is_active: true,
		});

		const updatedData = {
			extraction: {
				full_name: 'Test',
				contact_details: {
					email: null,
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
			},
			skills: {
				technical_skills: [
					{ name: 'TypeScript', level: 'expert', years_of_experience: 3 },
				],
				tools_platforms: [],
				spoken_languages: [],
				soft_skills: [],
			},
			projects: { projects: [] },
		};

		const res = await makeVerifyRequest({ structuredData: updatedData });
		expect(res.status).toBe(200);
	});

	it('only verifies the active CV, not inactive ones', async () => {
		await db.insert(cvProfileSchema).values([
			{
				profile_id: profileId,
				original_filename: 'old.pdf',
				is_active: false,
				is_verified: false,
			},
			{
				profile_id: profileId,
				original_filename: 'current.pdf',
				is_active: true,
				is_verified: false,
			},
		]);

		const res = await makeVerifyRequest({});

		expect(res.status).toBe(200);
		const all = await db.select().from(cvProfileSchema);
		expect(
			all.find((cv) => cv.original_filename === 'current.pdf')?.is_verified,
		).toBe(true);
		expect(
			all.find((cv) => cv.original_filename === 'old.pdf')?.is_verified,
		).toBe(false);
	});
});
