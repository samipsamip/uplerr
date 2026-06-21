import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();
const loggerMock = { flush: vi.fn() };

vi.mock('braintrust', () => ({
	initLogger: vi.fn(() => loggerMock),
	invoke: invokeMock,
}));

const { braintrust } = await import('../../../lib/lllm/braintrust');

const PROFILE_ID = 'profile-123';
const RAW_TEXT = 'John Doe — Software Engineer\nTypeScript, React';

beforeEach(() => {
	vi.clearAllMocks();
});

describe('braintrust.checkForModeration', () => {
	it('calls invoke with the moderation slug and resume text', async () => {
		invokeMock.mockResolvedValue({ is_malicious: false, reason: '' });

		await braintrust.checkForModeration(RAW_TEXT, PROFILE_ID);

		expect(invokeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				input: { RESUME_TEXT: RAW_TEXT },
				metadata: { profileId: PROFILE_ID },
			}),
		);
	});

	it('flushes the logger after the call', async () => {
		invokeMock.mockResolvedValue({ is_malicious: false, reason: '' });
		await braintrust.checkForModeration(RAW_TEXT, PROFILE_ID);
		expect(loggerMock.flush).toHaveBeenCalled();
	});

	it('flushes the logger even when invoke throws', async () => {
		invokeMock.mockRejectedValue(new Error('timeout'));
		await expect(
			braintrust.checkForModeration(RAW_TEXT, PROFILE_ID),
		).rejects.toThrow('timeout');
		expect(loggerMock.flush).toHaveBeenCalled();
	});

	it('returns the invoke result', async () => {
		const result = { is_malicious: true, reason: 'Contains PII exploit' };
		invokeMock.mockResolvedValue(result);
		const out = await braintrust.checkForModeration(RAW_TEXT, PROFILE_ID);
		expect(out).toEqual(result);
	});
});

describe('braintrust.performValidationCheckOnResume', () => {
	it('calls invoke with the validation slug and resume text', async () => {
		invokeMock.mockResolvedValue({ isValid: true });

		await braintrust.performValidationCheckOnResume(RAW_TEXT, PROFILE_ID);

		expect(invokeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				input: { RESUME_TEXT: RAW_TEXT },
				metadata: { profileId: PROFILE_ID },
			}),
		);
	});

	it('returns the invoke result', async () => {
		invokeMock.mockResolvedValue({ isValid: false });
		const out = await braintrust.performValidationCheckOnResume(
			RAW_TEXT,
			PROFILE_ID,
		);
		expect(out).toEqual({ isValid: false });
	});
});

describe('braintrust.performResumeExtraction', () => {
	it('calls invoke with the extraction slug, raw text, and links', async () => {
		invokeMock.mockResolvedValue({ full_name: 'John Doe' });
		const links = ['https://github.com/john'];

		await braintrust.performResumeExtraction(RAW_TEXT, links, PROFILE_ID);

		expect(invokeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				input: { RESUME_TEXT: RAW_TEXT, RESUME_LINKS: links },
				metadata: { profileId: PROFILE_ID },
			}),
		);
	});
});

describe('braintrust.performProjectsExtraction', () => {
	it('calls invoke with the projects slug, raw text, and links', async () => {
		invokeMock.mockResolvedValue({ projects: [] });
		const links = ['https://github.com/john/project'];

		await braintrust.performProjectsExtraction(RAW_TEXT, links, PROFILE_ID);

		expect(invokeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				input: { RESUME_TEXT: RAW_TEXT, RESUME_LINKS: links },
				metadata: { profileId: PROFILE_ID },
			}),
		);
	});

	it('flushes the logger after the call', async () => {
		invokeMock.mockResolvedValue({ projects: [] });
		await braintrust.performProjectsExtraction(RAW_TEXT, [], PROFILE_ID);
		expect(loggerMock.flush).toHaveBeenCalled();
	});

	it('returns the invoke result', async () => {
		const result = {
			projects: [
				{
					name: 'My App',
					description: 'A cool app',
					technologies: ['React'],
					links: [],
					type: 'solo',
					source: 'projects_section',
				},
			],
		};
		invokeMock.mockResolvedValue(result);
		const out = await braintrust.performProjectsExtraction(
			RAW_TEXT,
			[],
			PROFILE_ID,
		);
		expect(out).toEqual(result);
	});
});

describe('braintrust.performSkillsExtraction', () => {
	it('calls invoke with the skills slug and raw text', async () => {
		invokeMock.mockResolvedValue({ technical_skills: [] });

		await braintrust.performSkillsExtraction(RAW_TEXT, PROFILE_ID);

		expect(invokeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				input: { RESUME_TEXT: RAW_TEXT },
				metadata: { profileId: PROFILE_ID },
			}),
		);
	});
});
