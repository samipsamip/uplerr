import { beforeEach, describe, expect, it, vi } from 'vitest';

const scraperMock = vi.hoisted(() => ({
	scrapeJobListing: vi.fn(),
}));

vi.mock('../../../lib/scraper/JobAdvertisementScraper', () => ({
	// Arrow functions can't be constructors — use a regular function so `new` works
	JobAdvertisementScraper: vi.fn(function () {
		return scraperMock;
	}),
}));

vi.mock('../../../lib/scraper/utils', () => ({
	normalizeText: vi.fn((t: string) => t.trim()),
}));

const { startScraperWorker } =
	await import('../../../components/scraper/scraper.service');

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
	vi.clearAllMocks();
});

describe('startScraperWorker — URL_EXTRACTION', () => {
	it('calls onUpdate with done when scrape succeeds', async () => {
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
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'done',
			content: 'extracted job text',
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

	it('calls onUpdate with error when scrape returns failure', async () => {
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
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'error',
			code: 'RATE_LIMITED',
			message: 'Rate limited',
		});
	});

	it('calls onUpdate with FETCH_FAILED when scraper throws', async () => {
		scraperMock.scrapeJobListing.mockRejectedValue(new Error('Network error'));

		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j1',
				kind: 'URL_EXTRACTION',
				jobDescriptionURL: 'https://example.com/job',
			},
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'error',
			code: 'FETCH_FAILED',
			message: 'Network error',
		});
	});

	it('uses "Unknown error" message when a non-Error is thrown', async () => {
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		scraperMock.scrapeJobListing.mockRejectedValue('plain string error');

		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j1',
				kind: 'URL_EXTRACTION',
				jobDescriptionURL: 'https://example.com/job',
			},
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
	it('calls onUpdate with processing then done for raw text', async () => {
		const onUpdate = vi.fn();
		startScraperWorker(
			{
				jobId: 'j2',
				kind: 'RAW_JOB_ADVERTISEMENT',
				rawJobDescriptionText: '  Senior Engineer role  ',
			},
			onUpdate,
		);

		await wait();
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'processing',
			stage: 'extracting',
		});
		expect(onUpdate).toHaveBeenCalledWith({
			status: 'done',
			content: 'Senior Engineer role',
		});
	});
});
