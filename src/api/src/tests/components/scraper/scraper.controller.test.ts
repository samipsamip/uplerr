import type { Context, Next } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const workerMock = vi.hoisted(() => ({ startScraperWorker: vi.fn() }));

vi.mock('../../../components/scraper/scraper.service', () => workerMock);

vi.mock('../../../lib/middleware', () => ({
	get authMiddleWare() {
		return async (c: Context, next: Next) => {
			c.set('user', { id: 'user-1' });
			c.set('profileId', 'profile-1');
			await next();
		};
	},
}));

const { default: scraperRoute } =
	await import('../../../components/scraper/scraper.route');

const json = (body: unknown) => JSON.stringify(body);
const headers = { 'Content-Type': 'application/json' };

beforeEach(() => {
	vi.clearAllMocks();
	workerMock.startScraperWorker.mockImplementation(() => {});
});

describe('POST /scrape', () => {
	it('starts a URL extraction job and returns a jobId', async () => {
		const res = await scraperRoute.request('/scrape', {
			method: 'POST',
			headers,
			body: json({
				hasUrl: true,
				jobDescriptionURL: 'https://example.com/job',
			}),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty('jobId');
		expect(typeof body.jobId).toBe('string');
		expect(workerMock.startScraperWorker).toHaveBeenCalledOnce();
	});

	it('starts a raw text job and returns a jobId', async () => {
		const res = await scraperRoute.request('/scrape', {
			method: 'POST',
			headers,
			body: json({
				hasUrl: false,
				rawJobDescriptionText: 'We are looking for a developer...',
			}),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty('jobId');
		expect(workerMock.startScraperWorker).toHaveBeenCalledOnce();
	});

	it('returns 400 for an invalid payload', async () => {
		const res = await scraperRoute.request('/scrape', {
			method: 'POST',
			headers,
			body: json({ hasUrl: true }), // missing jobDescriptionURL
		});

		expect(res.status).toBe(400);
		expect(workerMock.startScraperWorker).not.toHaveBeenCalled();
	});

	it('returns 400 for hasUrl:true with an invalid URL', async () => {
		const res = await scraperRoute.request('/scrape', {
			method: 'POST',
			headers,
			body: json({ hasUrl: true, jobDescriptionURL: 'not-a-url' }),
		});

		expect(res.status).toBe(400);
	});
});

describe('GET /:jobId/stream', () => {
	it('returns 404 for an unknown jobId', async () => {
		const res = await scraperRoute.request('/unknown-job-id/stream');
		expect(res.status).toBe(404);
	});

	it('returns the current job state for a known jobId', async () => {
		// Create a job first
		const postRes = await scraperRoute.request('/scrape', {
			method: 'POST',
			headers,
			body: json({ hasUrl: false, rawJobDescriptionText: 'job text' }),
		});
		const { jobId } = await postRes.json();

		const res = await scraperRoute.request(`/${jobId}/stream`);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty('status');
	});

	it('cleans up a done job after it is polled', async () => {
		let capturedOnUpdate: ((state: unknown) => void) | undefined;
		workerMock.startScraperWorker.mockImplementation(
			(_payload: unknown, onUpdate: (state: unknown) => void) => {
				capturedOnUpdate = onUpdate;
			},
		);

		const postRes = await scraperRoute.request('/scrape', {
			method: 'POST',
			headers,
			body: json({ hasUrl: false, rawJobDescriptionText: 'text' }),
		});
		const { jobId } = await postRes.json();

		capturedOnUpdate?.({ status: 'done', content: 'result' });

		const firstPoll = await scraperRoute.request(`/${jobId}/stream`);
		expect(firstPoll.status).toBe(200);
		const firstBody = await firstPoll.json();
		expect(firstBody.status).toBe('done');

		// Second poll should 404 since the entry was deleted
		const secondPoll = await scraperRoute.request(`/${jobId}/stream`);
		expect(secondPoll.status).toBe(404);
	});
});
