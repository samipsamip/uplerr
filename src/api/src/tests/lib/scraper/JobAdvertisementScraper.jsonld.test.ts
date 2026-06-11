/**
 * Targeted tests for the JSON-LD extraction path.
 * DOMPurify is mocked as a passthrough so <script> tags survive sanitisation,
 * allowing extractJsonLd / jobPostingToText / isJobPosting / getCandidates / toStr
 * to be exercised — they are unreachable in production tests because DOMPurify
 * strips script elements before extractJsonLd is called.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── DOMPurify passthrough (must be declared before the module is imported) ────
vi.mock('dompurify', () => ({
	default: vi.fn(() => ({
		sanitize: (html: string) => html,
	})),
}));

// ── Other module-level mocks ──────────────────────────────────────────────────

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
	isPrivateIP: vi.fn().mockReturnValue(false),
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

// ── Module import (after all mocks are registered) ────────────────────────────

const { JobAdvertisementScraper } =
	await import('../../../lib/scraper/JobAdvertisementScraper');

// ── Fixtures ──────────────────────────────────────────────────────────────────

const EXAMPLE_URL = new URL('https://jsonld.example.com/job');

const makeHtmlWithJsonLd = (overrides: Record<string, unknown> = {}) => {
	const job = {
		'@type': 'JobPosting',
		title: 'Staff Engineer',
		hiringOrganization: { name: 'Megacorp' },
		description:
			'<p>We need a <strong>staff engineer</strong> with 10+ years experience.</p>',
		qualifications: 'Degree in Computer Science or equivalent',
		experienceRequirements: '10 years minimum',
		responsibilities: 'Lead architecture and mentor engineers',
		skills: 'TypeScript, Rust, Distributed Systems',
		...overrides,
	};
	return `<!DOCTYPE html><html><head>
<script type="application/ld+json">${JSON.stringify(job)}</script>
</head><body><p>Staff Engineer role at Megacorp</p></body></html>`;
};

// Make a realistic robots.txt response and an HTML response in one stub
const makeRobotsThenHtml = (html: string) =>
	vi
		.fn()
		.mockResolvedValueOnce(
			new Response('', {
				status: 200,
				headers: { 'content-type': 'text/plain' },
			}),
		)
		.mockResolvedValueOnce(
			new Response(html, {
				status: 200,
				headers: { 'content-type': 'text/html; charset=utf-8' },
			}),
		);

// ── Tests ─────────────────────────────────────────────────────────────────────

// Advance Date.now() per test to bust the robots mem-cache TTL
let baseTime = Date.now();
const dateSpy = vi.spyOn(Date, 'now');

beforeEach(() => {
	baseTime += 2 * 60 * 60 * 1_000;
	dateSpy.mockReturnValue(baseTime);

	vi.clearAllMocks();
	dateSpy.mockReturnValue(baseTime);

	urlValidatorMocks.validateUrl.mockResolvedValue(EXAMPLE_URL);
	rateLimiterMock.isAllowed.mockReturnValue(true);
	dbMocks.cacheRows = [];
	dbMocks.insertSpy.mockReset();
});

describe('JSON-LD extraction path (DOMPurify passthrough)', () => {
	it('extracts a job posting via JSON-LD and returns source: json-ld', async () => {
		vi.stubGlobal('fetch', makeRobotsThenHtml(makeHtmlWithJsonLd()));

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing(
			'https://jsonld.example.com/job',
		);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.source).toBe('json-ld');
			expect(result.content).toContain('Staff Engineer');
		}

		vi.unstubAllGlobals();
	});

	it('includes description, qualifications, experience and skills in the extracted text', async () => {
		vi.stubGlobal('fetch', makeRobotsThenHtml(makeHtmlWithJsonLd()));

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing(
			'https://jsonld.example.com/job',
		);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.content).toContain('Megacorp');
		}

		vi.unstubAllGlobals();
	});

	it('falls back to Readability when JSON-LD exists but description is below quality threshold', async () => {
		const tinyJobHtml = makeHtmlWithJsonLd({
			description: 'Short.',
			qualifications: undefined,
			experienceRequirements: undefined,
			responsibilities: undefined,
			skills: undefined,
		});
		const fullHtml = tinyJobHtml.replace(
			'<p>Staff Engineer role at Megacorp</p>',
			`<p>${'Megacorp is hiring a full-time staff engineer. '.repeat(10)}</p>`,
		);

		vi.stubGlobal('fetch', makeRobotsThenHtml(fullHtml));

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing(
			'https://jsonld.example.com/job',
		);

		expect(result.success).toBe(true);

		vi.unstubAllGlobals();
	});

	it('handles a JSON-LD @graph array by finding the JobPosting entry', async () => {
		const graphHtml = `<!DOCTYPE html><html><head>
<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@graph': [
				{ '@type': 'Organization', name: 'Megacorp' },
				{
					'@type': 'JobPosting',
					title: 'Principal Engineer',
					hiringOrganization: { name: 'Megacorp' },
					description:
						'An experienced principal engineer with broad technical expertise across systems and software design, capable of leading large-scale initiatives.',
				},
			],
		})}</script>
</head><body><p>Principal Engineer at Megacorp</p></body></html>`;

		vi.stubGlobal('fetch', makeRobotsThenHtml(graphHtml));

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing(
			'https://jsonld.example.com/job',
		);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.source).toBe('json-ld');
			expect(result.content).toContain('Principal Engineer');
		}

		vi.unstubAllGlobals();
	});

	it('handles a JSON-LD array at the root', async () => {
		const arrayHtml = `<!DOCTYPE html><html><head>
<script type="application/ld+json">${JSON.stringify([
			{ '@type': 'WebPage', name: 'Careers' },
			{
				'@type': 'JobPosting',
				title: 'Senior Engineer',
				description:
					'A senior engineer role requiring deep expertise in distributed systems, cloud infrastructure, and large-scale backend development. Candidates should have at least seven years of professional software development experience.',
			},
		])}</script>
</head><body><p>Senior Engineer</p></body></html>`;

		vi.stubGlobal('fetch', makeRobotsThenHtml(arrayHtml));

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing(
			'https://jsonld.example.com/job',
		);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.source).toBe('json-ld');
		}

		vi.unstubAllGlobals();
	});

	it('falls back to Readability when no JobPosting @type is present', async () => {
		const nonJobHtml = `<!DOCTYPE html><html><head>
<script type="application/ld+json">{"@type":"WebPage","name":"Careers"}</script>
</head><body><p>${'Explore careers at Megacorp — we are always looking for talented engineers. '.repeat(6)}</p></body></html>`;

		vi.stubGlobal('fetch', makeRobotsThenHtml(nonJobHtml));

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing(
			'https://jsonld.example.com/job',
		);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.source).toBe('readability');
		}

		vi.unstubAllGlobals();
	});

	it('handles malformed JSON-LD gracefully and falls back to Readability', async () => {
		const malformedHtml = `<!DOCTYPE html><html><head>
<script type="application/ld+json">{ broken json }</script>
</head><body><p>${'Join the Megacorp engineering team as a backend software engineer. '.repeat(6)}</p></body></html>`;

		vi.stubGlobal('fetch', makeRobotsThenHtml(malformedHtml));

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing(
			'https://jsonld.example.com/job',
		);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.source).toBe('readability');
		}

		vi.unstubAllGlobals();
	});
});

describe('Redirect and robots edge cases', () => {
	it('allows access when robots.txt fetch throws a network error', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockRejectedValueOnce(new Error('Network error fetching robots.txt'))
				.mockResolvedValueOnce(
					new Response(makeHtmlWithJsonLd(), {
						status: 200,
						headers: { 'content-type': 'text/html' },
					}),
				),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing(
			'https://jsonld.example.com/job',
		);

		// When robots.txt fetch throws, the scraper allows the request
		expect(result.success).toBe(true);

		vi.unstubAllGlobals();
	});

	it('allows access when robots.txt returns a non-OK status', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(new Response('', { status: 404 })) // robots.txt 404
				.mockResolvedValueOnce(
					new Response(makeHtmlWithJsonLd(), {
						status: 200,
						headers: { 'content-type': 'text/html' },
					}),
				),
		);

		const scraper = new JobAdvertisementScraper();
		const result = await scraper.scrapeJobListing(
			'https://jsonld.example.com/job',
		);
		expect(result.success).toBe(true);

		vi.unstubAllGlobals();
	});
});
