import { createHash } from 'crypto';
import type { Config as DOMPurifyConfig } from 'dompurify';
import createDOMPurify from 'dompurify';
import { and, eq, gt } from 'drizzle-orm';
import { JSDOM } from 'jsdom';
import { isIP } from 'net';
import playwright from 'playwright';
import { Readability } from '@mozilla/readability';

import { scraperCache } from '../../schemas/scraper-cache.schema';
import db from '../../utils/db';
import { DomainRateLimiter } from './rate-limiter';
import {
	ScraperError,
	type ScrapeResult,
	type ScrapeSource,
} from './scraper.types';
import {
	isPrivateIP,
	UrlValidationError,
	validateRedirect,
	validateUrl,
} from './url-validator';

// ── Constants ─────────────────────────────────────────────────────────────────

const USER_AGENT = 'Uppler-Bot/1.0';
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 10_000;
const PLAYWRIGHT_TIMEOUT_MS = 20_000;
const PLAYWRIGHT_SETTLE_MS = 2_000;
const ROBOTS_CACHE_TTL_MS = 60 * 60 * 1_000;
const SCRAPE_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const MIN_CONTENT_LENGTH = 200;

// ── Robots.txt (in-memory per process) ───────────────────────────────────────

interface RobotsEntry {
	disallowedPaths: string[];
	expiresAt: number;
}

const robotsMemCache = new Map<string, RobotsEntry>();

function parseRobotsTxt(text: string): string[] {
	const disallowed: string[] = [];
	let applicable = false;

	for (const raw of text.split('\n')) {
		const line = raw.trim();
		if (!line || line.startsWith('#')) continue;

		if (line.toLowerCase().startsWith('user-agent:')) {
			const agent = line.slice(11).trim();
			applicable = agent === '*' || agent.toLowerCase() === 'uppler-bot';
		} else if (applicable && line.toLowerCase().startsWith('disallow:')) {
			const path = line.slice(9).trim();
			if (path) disallowed.push(path);
		}
	}

	return disallowed;
}

async function isAllowedByRobots(url: URL): Promise<boolean> {
	const { origin } = url;
	const now = Date.now();
	const cached = robotsMemCache.get(origin);

	if (cached && cached.expiresAt > now) {
		return !cached.disallowedPaths.some((p) => url.pathname.startsWith(p));
	}

	try {
		const res = await fetch(`${origin}/robots.txt`, {
			signal: AbortSignal.timeout(5_000),
			headers: { 'User-Agent': USER_AGENT },
		});
		const disallowedPaths = res.ok ? parseRobotsTxt(await res.text()) : [];
		robotsMemCache.set(origin, {
			disallowedPaths,
			expiresAt: now + ROBOTS_CACHE_TTL_MS,
		});
		return !disallowedPaths.some((p) => url.pathname.startsWith(p));
	} catch {
		robotsMemCache.set(origin, {
			disallowedPaths: [],
			expiresAt: now + ROBOTS_CACHE_TTL_MS,
		});
		return true;
	}
}

// ── Sanitisation ──────────────────────────────────────────────────────────────

const purify = createDOMPurify(new JSDOM('').window);

// Explicit RETURN_DOM: false ensures TypeScript resolves sanitize() to the string overload
type PurifyStringConfig = DOMPurifyConfig & {
	RETURN_DOM: false;
	RETURN_DOM_FRAGMENT: false;
};

const PURIFY_CONFIG: PurifyStringConfig = {
	ALLOWED_TAGS: [
		'a',
		'abbr',
		'article',
		'b',
		'blockquote',
		'br',
		'caption',
		'cite',
		'code',
		'dd',
		'details',
		'div',
		'dl',
		'dt',
		'em',
		'figcaption',
		'figure',
		'footer',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'header',
		'hr',
		'i',
		'li',
		'main',
		'nav',
		'ol',
		'p',
		'pre',
		'q',
		's',
		'section',
		'small',
		'span',
		'strong',
		'sub',
		'sup',
		'table',
		'tbody',
		'td',
		'th',
		'thead',
		'time',
		'tr',
		'u',
		'ul',
	],
	ALLOWED_ATTR: ['href', 'title', 'datetime', 'cite'],
	FORCE_BODY: true,
	RETURN_DOM: false,
	RETURN_DOM_FRAGMENT: false,
};

function sanitizeHtml(html: string): string {
	return purify.sanitize(html, PURIFY_CONFIG);
}

function stripTags(html: string): string {
	return new JSDOM(html).window.document.body.textContent ?? '';
}

// ── Text normalisation ────────────────────────────────────────────────────────

function normalizeText(raw: string): string {
	return raw
		.replace(/\0/g, '')
		.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
		.replace(/\r\n|\r/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.split('\n')
		.map((l) => l.replace(/[ \t]+/g, ' ').trim())
		.join('\n')
		.trim();
}

function meetsQualityThreshold(text: string): boolean {
	return text.trim().length >= MIN_CONTENT_LENGTH;
}

// ── JSON-LD extraction ────────────────────────────────────────────────────────

interface JsonLdOrganization {
	name?: unknown;
	[key: string]: unknown;
}

interface JsonLdJobPosting {
	'@type': 'JobPosting';
	title?: unknown;
	hiringOrganization?: JsonLdOrganization;
	description?: unknown;
	qualifications?: unknown;
	experienceRequirements?: unknown;
	responsibilities?: unknown;
	skills?: unknown;
	[key: string]: unknown;
}

function isJobPosting(data: unknown): data is JsonLdJobPosting {
	return (
		typeof data === 'object' &&
		data !== null &&
		(data as Record<string, unknown>)['@type'] === 'JobPosting'
	);
}

function getCandidates(data: unknown): unknown[] {
	if (Array.isArray(data)) return data;

	if (typeof data === 'object' && data !== null && '@graph' in data) {
		const graph = (data as Record<string, unknown>)['@graph'];
		return Array.isArray(graph) ? graph : [];
	}

	return [data];
}

function toStr(v: unknown): string | null {
	return typeof v === 'string' && v.trim() ? v.trim() : null;
}

const CONTENT_FIELDS: Array<[keyof JsonLdJobPosting, string]> = [
	['description', 'Description'],
	['qualifications', 'Qualifications'],
	['experienceRequirements', 'Experience Requirements'],
	['responsibilities', 'Responsibilities'],
	['skills', 'Skills'],
];

function jobPostingToText(job: JsonLdJobPosting): string {
	const lines: string[] = [];

	const title = toStr(job.title);
	if (title) lines.push(`Role: ${title}`);

	const orgName = toStr(job.hiringOrganization?.name);
	if (orgName) lines.push(`Company: ${orgName}`);

	for (const [field, label] of CONTENT_FIELDS) {
		const raw = job[field];
		if (!raw) continue;
		const val = typeof raw === 'string' ? stripTags(raw) : toStr(raw);
		if (val) lines.push(`\n${label}:\n${val}`);
	}

	return lines.join('\n');
}

function extractJsonLd(html: string): string | null {
	const { document } = new JSDOM(html).window;

	for (const script of document.querySelectorAll(
		'script[type="application/ld+json"]',
	)) {
		try {
			const data: unknown = JSON.parse(script.textContent ?? '');
			const job = getCandidates(data).find(isJobPosting);
			if (job) return jobPostingToText(job);
		} catch {
			// malformed — try next script tag
		}
	}

	return null;
}

// ── Readability extraction ────────────────────────────────────────────────────

function extractWithReadability(html: string, url: URL): string | null {
	const { document } = new JSDOM(html, { url: url.toString() }).window;
	return new Readability(document).parse()?.textContent ?? null;
}

// ── HTTP fetch with redirect chain validation ─────────────────────────────────

async function fetchHtml(url: URL): Promise<string> {
	let current = url;
	let hops = 0;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		while (true) {
			const res = await fetch(current.toString(), {
				signal: controller.signal,
				redirect: 'manual',
				headers: {
					'User-Agent': USER_AGENT,
					Accept: 'text/html,application/xhtml+xml',
					'Accept-Language': 'en-US,en;q=0.9',
				},
			});

			if (res.status >= 300 && res.status < 400) {
				if (hops >= MAX_REDIRECTS) {
					throw new ScraperError('FETCH_FAILED', 'Too many redirects');
				}
				const location = res.headers.get('location');
				if (!location) {
					throw new ScraperError(
						'FETCH_FAILED',
						'Redirect with no Location header',
					);
				}
				current = await validateRedirect(location, current);
				hops++;
				continue;
			}

			if (!res.ok) throw new ScraperError('FETCH_FAILED', `HTTP ${res.status}`);

			const contentType = res.headers.get('content-type') ?? '';
			if (!contentType.includes('text/html')) {
				throw new ScraperError(
					'NOT_HTML',
					`Unexpected content-type: ${contentType}`,
				);
			}

			return readBodyWithLimit(res);
		}
	} finally {
		clearTimeout(timer);
	}
}

async function readBodyWithLimit(response: Response): Promise<string> {
	const reader = response.body?.getReader();
	if (!reader) throw new ScraperError('FETCH_FAILED', 'No response body');

	const decoder = new TextDecoder('utf-8', { fatal: false });
	const chunks: string[] = [];
	let totalBytes = 0;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalBytes += value.byteLength;
			if (totalBytes > MAX_BODY_BYTES) {
				throw new ScraperError('TOO_LARGE', 'Response body exceeds 5 MB limit');
			}
			chunks.push(decoder.decode(value, { stream: true }));
		}
		chunks.push(decoder.decode());
		return chunks.join('');
	} finally {
		reader.releaseLock();
	}
}

// ── Playwright fallback ───────────────────────────────────────────────────────

async function renderWithPlaywright(url: URL): Promise<string> {
	const browser = await playwright.chromium.launch({ headless: true });
	try {
		const context = await browser.newContext({ userAgent: USER_AGENT });
		const page = await context.newPage();

		await page.route('**/*', (route) => {
			const resourceType = route.request().resourceType();

			// Block assets that don't contribute to content
			if (['image', 'media', 'font'].includes(resourceType)) {
				return route.abort();
			}

			// Block requests to direct private IP addresses to match the HTTP path's
			// SSRF protection — DNS-resolved IPs are harder to check per sub-request,
			// but raw IP targets are the highest-risk vector
			try {
				const reqHostname = new URL(route.request().url()).hostname;
				if (isIP(reqHostname) && isPrivateIP(reqHostname)) {
					return route.abort();
				}
			} catch {
				return route.abort();
			}

			return route.continue();
		});

		await page.goto(url.toString(), {
			waitUntil: 'domcontentloaded',
			timeout: PLAYWRIGHT_TIMEOUT_MS,
		});
		await page.waitForTimeout(PLAYWRIGHT_SETTLE_MS);

		return page.content();
	} finally {
		await browser.close();
	}
}

// ── Postgres cache ────────────────────────────────────────────────────────────

function hashUrl(url: URL): string {
	return createHash('sha256').update(url.toString()).digest('hex');
}

async function getFromCache(hash: string): Promise<string | null> {
	const rows = await db
		.select({ content: scraperCache.content })
		.from(scraperCache)
		.where(
			and(
				eq(scraperCache.urlHash, hash),
				gt(scraperCache.expiresAt, new Date()),
			),
		)
		.limit(1);
	return rows[0]?.content ?? null;
}

async function setCache(
	hash: string,
	url: URL,
	content: string,
): Promise<void> {
	const now = new Date();
	const expiresAt = new Date(Date.now() + SCRAPE_CACHE_TTL_MS);
	await db
		.insert(scraperCache)
		.values({
			urlHash: hash,
			url: url.toString(),
			content,
			scrapedAt: now,
			expiresAt,
		})
		.onConflictDoUpdate({
			target: scraperCache.urlHash,
			set: { content, scrapedAt: now, expiresAt },
		});
}

// ── Timeout helper ────────────────────────────────────────────────────────────

function withTimeout<T>(
	promise: Promise<T>,
	ms: number,
	label: string,
): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(
				() =>
					reject(
						new ScraperError('TIMEOUT', `${label} timed out after ${ms}ms`),
					),
				ms,
			),
		),
	]);
}

// ── Scraper ───────────────────────────────────────────────────────────────────

const rateLimiter = new DomainRateLimiter(10, 60_000);

export class JobAdvertisementScraper {
	async scrapeJobListing(rawUrl: string): Promise<ScrapeResult> {
		// 1. URL validation — scheme allowlist, private IP, DNS rebinding
		let url: URL;
		try {
			url = await validateUrl(rawUrl);
		} catch (err) {
			if (err instanceof UrlValidationError) {
				return { success: false, error: err.message, code: err.code };
			}
			return { success: false, error: 'Invalid URL', code: 'INVALID_URL' };
		}

		// 2. Per-domain rate limiting
		if (!rateLimiter.isAllowed(url.hostname)) {
			return {
				success: false,
				error: `Rate limit exceeded for ${url.hostname}`,
				code: 'RATE_LIMITED',
			};
		}

		// 3. Robots.txt compliance
		if (!(await isAllowedByRobots(url))) {
			return {
				success: false,
				error: 'Disallowed by robots.txt',
				code: 'ROBOTS_DISALLOWED',
			};
		}

		// 4. Cache lookup
		const hash = hashUrl(url);
		const cached = await getFromCache(hash);
		if (cached) {
			return {
				success: true,
				content: cached,
				source: 'readability',
				cached: true,
			};
		}

		// 5. Tier 1 & 2 — plain HTTP fetch
		let content: string | null = null;
		let source: ScrapeSource = 'readability';

		try {
			const html = await withTimeout(
				fetchHtml(url),
				FETCH_TIMEOUT_MS,
				'HTTP fetch',
			);
			const clean = sanitizeHtml(html);

			const jsonLd = extractJsonLd(clean);
			if (jsonLd && meetsQualityThreshold(jsonLd)) {
				content = jsonLd;
				source = 'json-ld';
			} else {
				const readable = extractWithReadability(clean, url);
				if (readable && meetsQualityThreshold(readable)) {
					content = readable;
					source = 'readability';
				}
			}
		} catch (err) {
			if (err instanceof ScraperError && err.code !== 'FETCH_FAILED') {
				return { success: false, error: err.message, code: err.code };
			}
			// FETCH_FAILED falls through to Playwright
		}

		// 6. Tier 3 — Playwright fallback for JS-heavy pages
		if (!content) {
			try {
				const html = await withTimeout(
					renderWithPlaywright(url),
					PLAYWRIGHT_TIMEOUT_MS + PLAYWRIGHT_SETTLE_MS + 2_000,
					'Playwright render',
				);
				const clean = sanitizeHtml(html);
				const readable = extractWithReadability(clean, url);

				if (!readable || !meetsQualityThreshold(readable)) {
					return {
						success: false,
						error: 'Could not extract meaningful content',
						code: 'PARSE_FAILED',
					};
				}

				content = readable;
				source = 'playwright';
			} catch (err) {
				const code = err instanceof ScraperError ? err.code : 'FETCH_FAILED';
				const message = err instanceof Error ? err.message : 'Scrape failed';
				return { success: false, error: message, code };
			}
		}

		if (!content) {
			return {
				success: false,
				error: 'Could not extract meaningful content',
				code: 'PARSE_FAILED',
			};
		}

		// 7. Normalise and persist to cache
		const normalized = normalizeText(content);
		await setCache(hash, url, normalized);

		return { success: true, content: normalized, source, cached: false };
	}
}
