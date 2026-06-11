import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiMock = {
	post: vi.fn(),
	get: vi.fn(),
};

vi.mock('@/network/client', () => ({ api: apiMock }));

const { getScrapingJobStatus, postStartScraping } =
	await import('@/network/scraper.service');

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('postStartScraping', () => {
	it('posts to api/scraper/scrape with URL payload', () => {
		const jsonFn = vi.fn().mockResolvedValue({ jobId: 'abc' });
		apiMock.post.mockReturnValue({ json: jsonFn });

		postStartScraping({
			hasUrl: true,
			jobDescriptionURL: 'https://example.com',
		});

		expect(apiMock.post).toHaveBeenCalledWith('api/scraper/scrape', {
			json: { hasUrl: true, jobDescriptionURL: 'https://example.com' },
		});
	});

	it('posts to api/scraper/scrape with raw text payload', () => {
		const jsonFn = vi.fn().mockResolvedValue({ jobId: 'xyz' });
		apiMock.post.mockReturnValue({ json: jsonFn });

		postStartScraping({ hasUrl: false, rawJobDescriptionText: 'some text' });

		expect(apiMock.post).toHaveBeenCalledWith('api/scraper/scrape', {
			json: { hasUrl: false, rawJobDescriptionText: 'some text' },
		});
	});

	it('returns the jobId from the response', async () => {
		const jsonFn = vi.fn().mockResolvedValue({ jobId: 'test-job' });
		apiMock.post.mockReturnValue({ json: jsonFn });

		const result = await postStartScraping({
			hasUrl: false,
			rawJobDescriptionText: 'text',
		});
		expect(result).toEqual({ jobId: 'test-job' });
	});
});

describe('getScrapingJobStatus', () => {
	it('calls the correct endpoint with the jobId', () => {
		const jsonFn = vi.fn().mockResolvedValue({ status: 'pending' });
		apiMock.get.mockReturnValue({ json: jsonFn });

		getScrapingJobStatus('my-job-id');

		expect(apiMock.get).toHaveBeenCalledWith('api/scraper/my-job-id/stream');
	});

	it('returns the job state from the response', async () => {
		const state = { status: 'processing', stage: 'fetching' };
		const jsonFn = vi.fn().mockResolvedValue(state);
		apiMock.get.mockReturnValue({ json: jsonFn });

		const result = await getScrapingJobStatus('my-job-id');
		expect(result).toEqual(state);
	});
});
