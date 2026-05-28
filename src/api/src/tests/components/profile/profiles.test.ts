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

// Separate vi.fn() instances so per-test configuration works even though
// PDFParse must be a real constructor (arrow functions can't be called with new).
const pdfMocks = vi.hoisted(() => ({
	getInfo: vi.fn(),
	getText: vi.fn(),
	destroy: vi.fn(),
}));

vi.mock('pdf-parse', () => ({
	PDFParse: class {
		getInfo() {
			return pdfMocks.getInfo();
		}
		getText() {
			return pdfMocks.getText();
		}
		destroy() {
			return pdfMocks.destroy();
		}
	},
}));

const llmMocks = vi.hoisted(() => ({
	extractDetailsFromResume: vi.fn(),
}));

vi.mock('../../../lib/lllm', () => ({
	llmService: {
		extractDetailsFromResume: llmMocks.extractDetailsFromResume,
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
	pdfMocks.getInfo.mockResolvedValue({ total: 1 });
	pdfMocks.getText.mockResolvedValue({ text: 'Sample resume text' });
	pdfMocks.destroy.mockResolvedValue(undefined);
	llmMocks.extractDetailsFromResume.mockResolvedValue({
		isValid: true,
		name: 'Test User',
		skills: [],
		experience: [],
		education: [],
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
		});

		const res = await profileRoute.request('/');

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.cv.filename).toBe('my-cv.pdf');
		expect(body.cv.hasStructuredData).toBe(true);
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
		pdfMocks.getInfo.mockResolvedValue({ total: 6 });

		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(413);
		expect(uploadMocks.uploadResumeToBucket).not.toHaveBeenCalled();
	});

	it('returns 400 when PDF is corrupted', async () => {
		pdfMocks.getInfo.mockRejectedValue(new Error('parse error'));

		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(400);
	});

	it('returns 500 when an unexpected error occurs during upload', async () => {
		uploadMocks.uploadResumeToBucket.mockRejectedValue(new Error('S3 failure'));

		const res = await makeResumeRequest('/upload-resume', validPdf);

		expect(res.status).toBe(500);
	});
});

describe('POST /api/profile/update-resume', () => {
	it('returns 400 when no file is provided', async () => {
		const res = await profileRoute.request('/update-resume', {
			method: 'POST',
			body: new FormData(),
		});
		expect(res.status).toBe(400);
	});

	it('returns 400 when file is empty', async () => {
		const res = await makeResumeRequest('/update-resume', emptyPdf);
		expect(res.status).toBe(400);
	});

	it('returns 413 when file exceeds 2MB', async () => {
		const res = await makeResumeRequest('/update-resume', largePdf);
		expect(res.status).toBe(413);
	});

	it('returns 201 without re-uploading when the same resume is submitted', async () => {
		// Upload once to establish the hash
		await makeResumeRequest('/upload-resume', validPdf);
		vi.clearAllMocks();

		// Submit the exact same content again
		const res = await makeResumeRequest('/update-resume', validPdf);

		expect(res.status).toBe(201);
		expect((await res.json()).message).toBe(
			'This resume has already been uploaded.',
		);
		expect(uploadMocks.uploadResumeToBucket).not.toHaveBeenCalled();
	});

	it('returns 413 when PDF exceeds page limit', async () => {
		pdfMocks.getInfo.mockResolvedValue({ total: 6 });

		const res = await makeResumeRequest('/update-resume', validPdf);

		expect(res.status).toBe(413);
		expect(uploadMocks.uploadResumeToBucket).not.toHaveBeenCalled();
	});

	it('returns 400 when PDF is corrupted', async () => {
		pdfMocks.getInfo.mockRejectedValue(new Error('parse error'));

		const res = await makeResumeRequest('/update-resume', validPdf);

		expect(res.status).toBe(400);
	});

	it('returns 500 when an unexpected error occurs during upload', async () => {
		uploadMocks.uploadResumeToBucket.mockRejectedValue(new Error('S3 failure'));

		const res = await makeResumeRequest('/update-resume', validPdf);

		expect(res.status).toBe(500);
	});

	it('deactivates the old CV and inserts a new one on replacement', async () => {
		// Seed an existing active CV
		await db.insert(cvProfileSchema).values({
			profile_id: profileId,
			original_filename: 'old.pdf',
			resume_key: 'uploads/old-resume.pdf',
			resume_hash: 'old-hash',
			is_active: true,
		});

		const res = await makeResumeRequest('/update-resume', validPdf);

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
			structured_data: { name: 'Old Name' },
			is_active: true,
		});

		const updatedData = {
			name: 'New Name',
			skills: ['TypeScript'],
			experience: [],
			education: [],
		};

		const res = await makeVerifyRequest({ structuredData: updatedData });

		expect(res.status).toBe(200);
		const [cv] = await db.select().from(cvProfileSchema);
		expect(cv.is_verified).toBe(true);
		expect((cv.structured_data as { name: string }).name).toBe('New Name');
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
