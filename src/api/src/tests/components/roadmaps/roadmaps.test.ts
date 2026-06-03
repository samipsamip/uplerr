import type { Context, Next } from 'hono';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/middleware', () => ({
	get authMiddleWare() {
		return async (c: Context, next: Next) => {
			c.set('user', { id: 'user-1' });
			c.set('profileId', 'profile-1');
			await next();
		};
	},
}));

const { default: roadmapsRoute } =
	await import('../../../components/roadmaps/roadmaps.route');

describe('GET /:userId', () => {
	it('returns 200 with ok message', async () => {
		const res = await roadmapsRoute.request('/user-1');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.message).toBe('ok');
	});
});

describe('POST /:userId', () => {
	it('returns 200 with ok message', async () => {
		const res = await roadmapsRoute.request('/user-1', { method: 'POST' });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.message).toBe('ok');
	});
});
