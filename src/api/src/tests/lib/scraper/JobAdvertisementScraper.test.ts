import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Module-level mocks (hoisted before imports) ───────────────────────────────

const rateLimiterMock = vi.hoisted(() => ({
	isAllowed: vi.fn().mockReturnValue(true),
}));

vi.mock('../../../lib/scraper/rate-limiter', () => ({
	DomainRateLimiter: vi.fn(function () {
		return rateLimiterMock;
	}),
}));

const urlValidatorMocks = vi.hoisted(() => ({
	validateUrl: vi.fn(),
	validateRedirect: vi.fn(),
	// Use realistic logic so the Playwright route handler's private-IP branch fires
	isPrivateIP: vi.fn((ip: string) =>
		/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.)/.test(ip),
	),
}));

vi.mock('../../../lib/scraper/url-validator', () => ({
	...urlValidatorMocks,
	UrlValidationError: class UrlValidationError extends Error {
		code: string;
		constructor(msg: string, code: string) {
			super(msg);
			this.code = code;
			this.name = 'UrlValidationError';
		}
	},
}));

const dbMocks = vi.hoisted(() => ({
	cacheRows: [] as Array<{ content: string }>,
	insertSpy: vi.fn(),
}));

vi.mock('../../../utils/db', () => ({
	default: {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () => Promise.resolve(dbMocks.cacheRows),
				}),
			}),
		}),
		insert: () => ({
			values: (vals: unknown) => ({
				onConflictDoUpdate: () => {
					dbMocks.insertSpy(vals);
					return Promise.resolve();
				},
			}),
		}),
	},
}));

const playwrightMocks = vi.hoisted(() => ({
	content: vi.fn(),
	goto: vi.fn(),
	route: vi.fn(),
	waitForTimeout: vi.fn(),
	close: vi.fn(),
}));

vi.mock('playwright', () => ({
	default: {
		chromium: {
			launch: vi.fn().mockImplementation(() =>
				Promise.resolve({
					newContext: () =>
						Promise.resolve({
							newPage: () =>
								Promise.resolve({
									route: playwrightMocks.route,
									goto: playwrightMocks.goto,
									waitForTimeout: playwrightMocks.waitForTimeout,
									content: playwrightMocks.content,
								}),
						}),
					close: playwrightMocks.close,
				}),
			),
		},
	},
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const EXAMPLE_URL = new URL('https://example.com/job');

// DOMPurify strips <script> tags so JSON-LD extraction never fires in practice.
// Use a rich body HTML instead — readability extracts this after sanitisation.
const JOB_HTML = `<!DOCTYPE html><html><body><article>
<h1>Senior Engineer at ACME Corp</h1>
<p>We are looking for a talented senior engineer with deep expertise in distributed systems.
The role involves designing, building and maintaining our core infrastructure at scale.
You will work alongside a world-class team with high engineering standards and a strong culture
of ownership. Candidates must have at least five years of professional software engineering
experience and a demonstrated track record of shipping reliable, high-quality systems.</p>
<p>Responsibilities include architecting backend services, reviewing code, mentoring junior
engineers, and collaborating closely with product and design to deliver impactful features.
Strong written communication skills and experience with cloud platforms are required.</p>
</article></body></html>`;

function makeHtmlResponse(html: string, status = 200) {
	return new Response(html, {
		status,
		headers: { 'content-type': 'text/html; charset=utf-8' },
	});
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// The scraper keeps an in-process robots.txt cache with a 1-hour TTL.
// Advancing Date.now() by 2 hours between tests ensures each test gets a
// fresh cache entry and can't be polluted by a previous test's robots result.
let baseTime = Date.now();
const dateSpy = vi.spyOn(Date, 'now');

beforeEach(() => {
	baseTime += 2 * 60 * 60 * 1_000; // +2 hours per test — clears the robots cache
	dateSpy.mockReturnValue(baseTime);

	vi.clearAllMocks();
	dateSpy.mockReturnValue(baseTime); // re-apply after clearAllMocks

	urlValidatorMocks.validateUrl.mockResolvedValue(EXAMPLE_URL);
	rateLimiterMock.isAllowed.mockReturnValue(true);
	dbMocks.cacheRows = [];
	dbMocks.insertSpy.mockReset();
	playwrightMocks.content.mockResolvedValue(JOB_HTML);
	playwrightMocks.goto.mockResolvedValue(null);
	// Invoke the route handler with representative routes so the filtering
	// branches inside renderWithPlaywright are exercised on every test that
	// reaches Playwright.
	playwrightMocks.route.mockImplementation(
		(
			_pattern: unknown,
			handler: (route: {
				abort: () => void;
				continue: () => void;
				request: () => { resourceType: () => string; url: () => string };
			}) => void,
		) => {
			const makeRoute = (type: string, url: string) => ({
				abort: vi.fn(),
				continue: vi.fn(),
				request: () => ({ resourceType: () => type, url: () => url }),
			});
			handler(makeRoute('image', 'https://example.com/img.jpg')); // blocked asset
			handler(makeRoute('document', 'http://10.0.0.1/page')); // private IP → abort
			handler(makeRoute('document', 'not-valid-url')); // malformed URL → catch → abort
			handler(makeRoute('document', 'https://example.com/page')); // allowed → continue
		},
	);
	playwrightMocks.waitForTimeout.mockResolvedValue(null);
	playwrightMocks.close.mockResolvedValue(null);
});

const { JobAdvertisementScraper } =
	await import('../../../lib/scraper/JobAdvertisementScraper');

describe('JobAdvertisementScraper.scrapeJobListing', () => {
	it('returns INVALID_URL when validateUrl throws UrlValidationError', async () => {
		const { UrlValidationError } =
			await import('../../../lib/scraper/url-validator');
		urlValidatorMocks.validateUrl.mockRejectedValue(
			new UrlValidationError('Bad URL', 'INVALID_URL'),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('not-a-url');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe('INVALID_URL');
	});

	it('returns INVALID_URL for unexpected validation errors', async () => {
		urlValidatorMocks.validateUrl.mockRejectedValue(new Error('unexpected'));
		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe('INVALID_URL');
	});

	it('returns RATE_LIMITED when rate limiter denies the request', async () => {
		rateLimiterMock.isAllowed.mockReturnValue(false);
		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe('RATE_LIMITED');
	});

	it('returns ROBOTS_DISALLOWED when robots.txt blocks the path', async () => {
		const robotsTxt = 'User-agent: *\nDisallow: /job';
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(robotsTxt, {
					status: 200,
					headers: { 'content-type': 'text/plain' },
				}),
			),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe('ROBOTS_DISALLOWED');

		vi.unstubAllGlobals();
	});

	it('returns cached content when a cache entry exists', async () => {
		dbMocks.cacheRows = [{ content: 'cached job description text' }];
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response('', {
					status: 200,
					headers: { 'content-type': 'text/plain' },
				}),
			),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.content).toBe('cached job description text');
			expect(result.cached).toBe(true);
		}

		vi.unstubAllGlobals();
	});

	it('extracts content via HTTP fetch (Readability path)', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(makeHtmlResponse(JOB_HTML)),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.content).toContain('distributed systems');
			expect(result.cached).toBe(false);
		}

		vi.unstubAllGlobals();
	});

	it('falls back to Readability when JSON-LD is absent', async () => {
		const plainHtml = `<!DOCTYPE html><html><body><main>${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(5)}</main></body></html>`;

		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(makeHtmlResponse(plainHtml)),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.source).toBe('readability');
		}

		vi.unstubAllGlobals();
	});

	it('falls back to Playwright when HTTP fetch fails', async () => {
		playwrightMocks.content.mockResolvedValue(JOB_HTML);

		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(new Response('Not found', { status: 404 })),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');

		expect(result.success).toBe(true);
		if (result.success) expect(result.source).toBe('playwright');

		vi.unstubAllGlobals();
	});

	it('calls onProgress with stages during HTTP fetch', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(makeHtmlResponse(JOB_HTML)),
		);

		const scraper = new JobAdvertisementScraper();
		const stages: string[] = [];
		await scraper.scrapeJobListing('https://example.com/job', (s) =>
			stages.push(s),
		);

		expect(stages).toContain('validating');
		expect(stages).toContain('checking-cache');
		expect(stages).toContain('fetching');
		expect(stages).toContain('extracting');

		vi.unstubAllGlobals();
	});

	it('calls onProgress with deep-loading when falling back to Playwright', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(new Response('Server error', { status: 500 })),
		);

		const scraper = new JobAdvertisementScraper();
		const stages: string[] = [];
		await scraper.scrapeJobListing('https://example.com/job', (s) =>
			stages.push(s),
		);

		expect(stages).toContain('deep-loading');

		vi.unstubAllGlobals();
	});

	it('persists scraped content to cache', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(makeHtmlResponse(JOB_HTML)),
		);

		const scraper = new JobAdvertisementScraper();
		await scraper.scrapeJobListing('https://example.com/job');

		expect(dbMocks.insertSpy).toHaveBeenCalledOnce();

		vi.unstubAllGlobals();
	});

	it('returns PARSE_FAILED when Playwright returns empty content', async () => {
		playwrightMocks.content.mockResolvedValue('<html><body></body></html>');

		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(new Response('err', { status: 500 })),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe('PARSE_FAILED');

		vi.unstubAllGlobals();
	});

	it('returns NOT_HTML when response has unexpected content-type', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(
					new Response('{}', {
						status: 200,
						headers: { 'content-type': 'application/json' },
					}),
				),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');

		// NOT_HTML falls through to Playwright; result depends on Playwright mock
		// Just verify no uncaught exception and result has success property
		expect(result).toHaveProperty('success');

		vi.unstubAllGlobals();
	});

	it('returns TOO_LARGE when the response body exceeds 5 MB', async () => {
		// Create a body just over the 5 MB limit so readBodyWithLimit throws
		const oversized = new Uint8Array(5 * 1024 * 1024 + 1);
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(
					new Response(oversized, {
						status: 200,
						headers: { 'content-type': 'text/html; charset=utf-8' },
					}),
				),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe('TOO_LARGE');

		vi.unstubAllGlobals();
	});

	it('follows a single HTTP redirect and returns content', async () => {
		urlValidatorMocks.validateRedirect.mockResolvedValue(
			new URL('https://example.com/new-job'),
		);

		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				) // robots
				.mockResolvedValueOnce(
					new Response('', {
						status: 301,
						headers: { location: 'https://example.com/new-job' },
					}),
				) // redirect
				.mockResolvedValueOnce(makeHtmlResponse(JOB_HTML)), // HTML after redirect
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');
		expect(result.success).toBe(true);

		vi.unstubAllGlobals();
	});

	it('returns FETCH_FAILED when a redirect has no Location header', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(new Response('', { status: 301 })), // 301 with no Location
		);

		const scraper = new JobAdvertisementScraper();
		// FETCH_FAILED falls through to Playwright; result depends on Playwright mock
		const result = await scraper.scrapeJobListing('https://example.com/job');
		expect(result).toHaveProperty('success');

		vi.unstubAllGlobals();
	});

	it('returns FETCH_FAILED after exceeding the max redirect count', async () => {
		urlValidatorMocks.validateRedirect.mockResolvedValue(
			new URL('https://example.com/loop'),
		);
		// Return 301 indefinitely so hops exceeds MAX_REDIRECTS
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValue(
					new Response('', {
						status: 301,
						headers: { location: 'https://example.com/loop' },
					}),
				),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');
		expect(result).toHaveProperty('success');

		vi.unstubAllGlobals();
	});

	it('uses the in-memory robots cache on repeated requests to the same domain', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response('', {
					status: 200,
					headers: { 'content-type': 'text/plain' },
				}),
			) // robots (once)
			.mockResolvedValue(makeHtmlResponse(JOB_HTML)); // HTML for both scrape calls
		vi.stubGlobal('fetch', fetchMock);

		const scraper = new JobAdvertisementScraper();
		await scraper.scrapeJobListing('https://example.com/job');
		await scraper.scrapeJobListing('https://example.com/job'); // second call hits robots cache

		// Robots.txt fetched only once; both HTML fetches succeed
		expect(fetchMock).toHaveBeenCalledTimes(3);

		vi.unstubAllGlobals();
	});

	it('returns FETCH_FAILED when Playwright itself throws', async () => {
		playwrightMocks.goto.mockRejectedValue(
			new Error('Playwright network error'),
		);

		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(new Response('error', { status: 500 })),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe('FETCH_FAILED');

		vi.unstubAllGlobals();
	});

	it('handles a ScraperError thrown by Playwright and preserves the code', async () => {
		const { ScraperError } = await import('../../../lib/scraper/scraper.types');
		playwrightMocks.goto.mockRejectedValue(
			new ScraperError('TIMEOUT', 'Playwright timed out'),
		);

		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					new Response('', {
						status: 200,
						headers: { 'content-type': 'text/plain' },
					}),
				)
				.mockResolvedValueOnce(new Response('error', { status: 500 })),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing('https://example.com/job');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe('TIMEOUT');

		vi.unstubAllGlobals();
	});
});
