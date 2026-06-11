import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DomainRateLimiter } from '../../../lib/scraper/rate-limiter';

describe('DomainRateLimiter', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('allows requests within the limit', () => {
		const limiter = new DomainRateLimiter(3, 60_000);
		expect(limiter.isAllowed('example.com')).toBe(true);
		expect(limiter.isAllowed('example.com')).toBe(true);
		expect(limiter.isAllowed('example.com')).toBe(true);
	});

	it('blocks the request that exceeds the limit', () => {
		const limiter = new DomainRateLimiter(2, 60_000);
		limiter.isAllowed('example.com');
		limiter.isAllowed('example.com');
		expect(limiter.isAllowed('example.com')).toBe(false);
	});

	it('tracks domains independently', () => {
		const limiter = new DomainRateLimiter(1, 60_000);
		expect(limiter.isAllowed('a.com')).toBe(true);
		expect(limiter.isAllowed('b.com')).toBe(true);
		expect(limiter.isAllowed('a.com')).toBe(false);
	});

	it('allows again after the window expires', () => {
		const limiter = new DomainRateLimiter(1, 1_000);
		limiter.isAllowed('example.com');
		expect(limiter.isAllowed('example.com')).toBe(false);

		vi.advanceTimersByTime(1_001);
		expect(limiter.isAllowed('example.com')).toBe(true);
	});

	it('remaining() returns correct count for a new domain', () => {
		const limiter = new DomainRateLimiter(5, 60_000);
		expect(limiter.remaining('new.com')).toBe(5);
	});

	it('remaining() decrements after each allowed request', () => {
		const limiter = new DomainRateLimiter(3, 60_000);
		limiter.isAllowed('example.com');
		expect(limiter.remaining('example.com')).toBe(2);
		limiter.isAllowed('example.com');
		expect(limiter.remaining('example.com')).toBe(1);
	});

	it('remaining() returns 0 when exhausted', () => {
		const limiter = new DomainRateLimiter(2, 60_000);
		limiter.isAllowed('example.com');
		limiter.isAllowed('example.com');
		expect(limiter.remaining('example.com')).toBe(0);
	});

	it('remaining() recovers as timestamps slide out', () => {
		const limiter = new DomainRateLimiter(2, 1_000);
		limiter.isAllowed('example.com');
		limiter.isAllowed('example.com');

		vi.advanceTimersByTime(1_001);
		expect(limiter.remaining('example.com')).toBe(2);
	});
});
