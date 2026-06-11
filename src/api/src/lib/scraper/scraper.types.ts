export type ScraperErrorCode =
	| 'INVALID_URL'
	| 'DISALLOWED_SCHEME'
	| 'PRIVATE_IP'
	| 'UNRESOLVABLE'
	| 'RATE_LIMITED'
	| 'ROBOTS_DISALLOWED'
	| 'NOT_HTML'
	| 'TOO_LARGE'
	| 'TIMEOUT'
	| 'PARSE_FAILED'
	| 'FETCH_FAILED';

export class ScraperError extends Error {
	constructor(
		public readonly code: ScraperErrorCode,
		message: string,
	) {
		super(message);
		this.name = 'ScraperError';
	}
}

export type ScrapeSource = 'json-ld' | 'readability' | 'playwright';

export type ScrapeResult =
	| { success: true; content: string; source: ScrapeSource; cached: boolean }
	| { success: false; error: string; code: ScraperErrorCode };
