/**
 * In-memory sliding-window rate limiter scoped per domain.
 * Resets on process restart — acceptable for single-container deployments.
 */
export class DomainRateLimiter {
	private readonly windows = new Map<string, number[]>();

	constructor(
		private readonly maxRequests: number = 10,
		private readonly windowMs: number = 60_000,
	) {}

	isAllowed(domain: string): boolean {
		const now = Date.now();
		const cutoff = now - this.windowMs;
		const timestamps = (this.windows.get(domain) ?? []).filter(
			(t) => t > cutoff,
		);

		if (timestamps.length >= this.maxRequests) return false;

		timestamps.push(now);
		this.windows.set(domain, timestamps);
		return true;
	}

	/** Remaining requests allowed for a domain within the current window. */
	remaining(domain: string): number {
		const now = Date.now();
		const cutoff = now - this.windowMs;
		const active = (this.windows.get(domain) ?? []).filter((t) => t > cutoff);
		return Math.max(0, this.maxRequests - active.length);
	}
}
