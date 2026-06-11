import { beforeEach, describe, expect, it, vi } from 'vitest';

const scraperMock = vi.hoisted(() => ({
	scrapeJobListing: vi.fn(),
}));

const braintrustMock = vi.hoisted(() => ({
	moderateJobDescription: vi.fn(),
	extractRequiredSkillsFromJobDescription: vi.fn(),
}));

const skillsServiceMock = vi.hoisted(() => ({
	getSkillsByProfileId: vi.fn(),
}));

vi.mock('../../../lib/scraper/JobAdvertisementScraper', () => ({
	JobAdvertisementScraper: vi.fn(function () {
		return scraperMock;
	}),
}));

vi.mock('../../../lib/scraper/utils', () => ({
	normalizeText: vi.fn((t: string) => t.trim()),
}));

vi.mock('../../../lib/lllm/braintrust', () => ({
	braintrust: braintrustMock,
}));

vi.mock('../../../components/skills/skills.service', () => skillsServiceMock);

const { startScraperWorker } =
	await import('../../../components/scraper/scraper.service');

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));

const PROFILE_ID = 'profile-abc';

const defaultExtraction = {
	company: 'Acme Corp',
	job_title: 'Senior Engineer',
	skills_required: [
		{ name: 'typescript', level: 'advanced' as const },
		{ name: 'react', level: 'intermediate' as const },
	],
};

const defaultUserSkills = [{ name: 'React', level: 'beginner' as const }];

beforeEach(() => {
	vi.clearAllMocks();
	braintrustMock.moderateJobDescription.mockResolvedValue({
		is_malicious: false,
		reason: '',
	});
	braintrustMock.extractRequiredSkillsFromJobDescription.mockResolvedValue(
		defaultExtraction,
	);
	skillsServiceMock.getSkillsByProfileId.mockResolvedValue(defaultUserSkills);
});

describe('startScraperWorker — URL_EXTRACTION', () => {
	it('scrapes then analyses and emits done with structured result', async () => {
		scraperMock.scrapeJobListing.mockResolvedValue({
			success: true,
			content: 'extracted job text',
			source: 'readability',
			cached: false,
		});

		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j1',
				kind: 'URL_EXTRACTION',
				jobDescriptionURL: 'https://example.com/job',
			},
			PROFILE_ID,
			onUpdate,
		);

		await wait();

		expect(onUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'processing', stage: 'extracting' }),
		);
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'done',
			result: {
				company: 'Acme Corp',
				job_title: 'Senior Engineer',
				skills: [
					{
						name: 'typescript',
						required_level: 'advanced',
						user_level: 'none',
					},
					{
						name: 'react',
						required_level: 'intermediate',
						user_level: 'beginner',
					},
				],
			},
		});
	});

	it('forwards scraper stage callbacks as processing updates', async () => {
		scraperMock.scrapeJobListing.mockImplementation(
			async (_url: string, onProgress: (stage: string) => void) => {
				onProgress('fetching');
				onProgress('extracting');
				return {
					success: true,
					content: 'text',
					source: 'readability',
					cached: false,
				};
			},
		);

		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j1',
				kind: 'URL_EXTRACTION',
				jobDescriptionURL: 'https://example.com/job',
			},
			PROFILE_ID,
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'processing',
			stage: 'fetching',
		});
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'processing',
			stage: 'extracting',
		});
	});

	it('emits error when scrape returns failure', async () => {
		scraperMock.scrapeJobListing.mockResolvedValue({
			success: false,
			error: 'Rate limited',
			code: 'RATE_LIMITED',
		});

		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j1',
				kind: 'URL_EXTRACTION',
				jobDescriptionURL: 'https://example.com/job',
			},
			PROFILE_ID,
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'error',
			code: 'RATE_LIMITED',
			message: 'Rate limited',
		});
	});

	it('emits FETCH_FAILED when scraper throws', async () => {
		scraperMock.scrapeJobListing.mockRejectedValue(new Error('Network error'));

		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j1',
				kind: 'URL_EXTRACTION',
				jobDescriptionURL: 'https://example.com/job',
			},
			PROFILE_ID,
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'error',
			code: 'FETCH_FAILED',
			message: 'Network error',
		});
	});

	it('uses "Unknown error" when a non-Error is thrown', async () => {
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		scraperMock.scrapeJobListing.mockRejectedValue('plain string error');

		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j1',
				kind: 'URL_EXTRACTION',
				jobDescriptionURL: 'https://example.com/job',
			},
			PROFILE_ID,
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'error',
			code: 'FETCH_FAILED',
			message: 'Unknown error',
		});
	});
});

describe('startScraperWorker — RAW_JOB_ADVERTISEMENT', () => {
	it('emits processing then done with structured result', async () => {
		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j2',
				kind: 'RAW_JOB_ADVERTISEMENT',
				rawJobDescriptionText: '  Senior Engineer role  ',
			},
			PROFILE_ID,
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'processing',
			stage: 'extracting',
		});
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'done',
			result: {
				company: 'Acme Corp',
				job_title: 'Senior Engineer',
				skills: [
					{
						name: 'typescript',
						required_level: 'advanced',
						user_level: 'none',
					},
					{
						name: 'react',
						required_level: 'intermediate',
						user_level: 'beginner',
					},
				],
			},
		});
	});

	it('emits error when moderation flags content as malicious', async () => {
		braintrustMock.moderateJobDescription.mockResolvedValue({
			is_malicious: true,
			reason: 'Phishing attempt',
		});

		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j3',
				kind: 'RAW_JOB_ADVERTISEMENT',
				rawJobDescriptionText: 'suspicious text',
			},
			PROFILE_ID,
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'error' }),
		);
	});

	it('emits error when no skills are extracted', async () => {
		braintrustMock.extractRequiredSkillsFromJobDescription.mockResolvedValue({
			company: null,
			job_title: null,
			skills_required: [],
		});

		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j4',
				kind: 'RAW_JOB_ADVERTISEMENT',
				rawJobDescriptionText: 'vague description',
			},
			PROFILE_ID,
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'error' }),
		);
	});
});
