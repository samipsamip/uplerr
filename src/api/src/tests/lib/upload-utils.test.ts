import { beforeEach, describe, expect, it, vi } from 'vitest';

const s3Mocks = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@aws-sdk/client-s3', () => ({
	S3Client: class {
		send = s3Mocks.send;
	},
	PutObjectCommand: class {
		constructor(public input: Record<string, unknown>) {}
	},
	DeleteObjectCommand: class {
		constructor(public input: Record<string, unknown>) {}
	},
}));

const { uploadResumeToBucket, deleteResumeFromBucket } =
	await import('../../lib/upload-utils');

const fakeFile = new File(['pdf content'], 'resume.pdf', {
	type: 'application/pdf',
});

beforeEach(() => {
	vi.clearAllMocks();
	s3Mocks.send.mockResolvedValue({});
});

describe('uploadResumeToBucket', () => {
	it('returns a key containing the uniqueIdentifier and .pdf extension', async () => {
		const key = await uploadResumeToBucket(fakeFile, 'user-abc');
		expect(key).toMatch(/^user-abc-resume-\d+\.pdf$/);
	});

	it('sends a PutObjectCommand with the correct bucket, content type, and key', async () => {
		const key = await uploadResumeToBucket(fakeFile, 'user-abc');

		const [command] = s3Mocks.send.mock.calls[0];
		expect(command.input).toMatchObject({
			Key: key,
			ContentType: 'application/pdf',
		});
	});

	it('propagates S3 errors', async () => {
		s3Mocks.send.mockRejectedValue(new Error('S3 unavailable'));
		await expect(uploadResumeToBucket(fakeFile, 'user-abc')).rejects.toThrow(
			'S3 unavailable',
		);
	});
});

describe('deleteResumeFromBucket', () => {
	it('sends a DeleteObjectCommand with the provided key', async () => {
		await deleteResumeFromBucket('uploads/some-resume.pdf');

		const [command] = s3Mocks.send.mock.calls[0];
		expect(command.input).toMatchObject({ Key: 'uploads/some-resume.pdf' });
	});

	it('propagates S3 errors', async () => {
		s3Mocks.send.mockRejectedValue(new Error('S3 unavailable'));
		await expect(
			deleteResumeFromBucket('uploads/some-resume.pdf'),
		).rejects.toThrow('S3 unavailable');
	});
});
