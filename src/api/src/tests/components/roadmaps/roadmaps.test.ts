import type { Context, Next } from 'hono';
import { describe, expect, it, vi } from 'vitest';

vi.mock('resend', () => ({
	Resend: class {
		emails = { send: vi.fn().mockResolvedValue({ error: null }) };
	},
}));

vi.mock('../../../lib/middleware', () => ({
	get authMiddleWare() {
		return async (c: Context, next: Next) => {
			c.set('user', { id: 'user-1' });
			c.set('profileId', 'profile-1');
			await next();
		};
	},
}));

vi.mock('../../../components/roadmaps/roadmaps.service', () => ({
	listRoadmaps: vi.fn(async () => []),
	getRoadmap: vi.fn(async () => null),
	updateRoadmapStatus: vi.fn(async () => true),
	deleteRoadmap: vi.fn(async () => true),
	addSubtopicResource: vi.fn(async () => true),
}));

const { default: roadmapsRoute } =
	await import('../../../components/roadmaps/roadmaps.route');

describe('GET /api/roadmaps', () => {
	it('returns 200 with an empty array when no roadmaps exist', async () => {
		const res = await roadmapsRoute.request('/', { method: 'GET' });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});
});

describe('PATCH /api/roadmaps/:planId/status', () => {
	it('returns 400 for an invalid status value', async () => {
		const res = await roadmapsRoute.request('/plan-1/status', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'invalid' }),
		});
		expect(res.status).toBe(400);
	});

	it('returns 200 for a valid status update', async () => {
		const res = await roadmapsRoute.request('/plan-1/status', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'completed' }),
		});
		expect(res.status).toBe(200);
	});
});

describe('DELETE /api/roadmaps/:planId', () => {
	it('returns 200 on successful delete', async () => {
		const res = await roadmapsRoute.request('/plan-1', { method: 'DELETE' });
		expect(res.status).toBe(200);
	});
});
