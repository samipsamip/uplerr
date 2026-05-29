import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock('../../lib/auth', () => ({
	auth: { api: { getSession: authMocks.getSession } },
}));

const dbMocks = vi.hoisted(() => ({
	selectReturn: vi.fn(),
}));

const selectChain = {
	from: () => selectChain,
	where: () => selectChain,
	limit: () => dbMocks.selectReturn(),
};

vi.mock('../../utils/db', () => ({
	default: { select: vi.fn(() => selectChain) },
}));

const { authMiddleWare } = await import('../../lib/middleware');

const fakeUser = { id: 'user-1', name: 'Test User' };
const fakeSession = { token: 'tok-abc', userId: 'user-1' };
const fakeProfile = { id: 'profile-1' };

const app = new Hono<{
	Variables: {
		user: typeof fakeUser;
		session: typeof fakeSession;
		profileId: string;
	};
}>();
app.use('*', authMiddleWare);
app.get('/test', (c) =>
	c.json({
		userId: c.get('user').id,
		profileId: c.get('profileId'),
	}),
);

beforeEach(() => {
	vi.clearAllMocks();
	authMocks.getSession.mockResolvedValue({
		user: fakeUser,
		session: fakeSession,
	});
	dbMocks.selectReturn.mockResolvedValue([fakeProfile]);
});

describe('authMiddleWare — unauthenticated', () => {
	it('returns 401 when getSession returns null', async () => {
		authMocks.getSession.mockResolvedValue(null);
		const res = await app.request('/test');
		expect(res.status).toBe(401);
	});

	it('returns 401 when session has no token', async () => {
		authMocks.getSession.mockResolvedValue({
			user: fakeUser,
			session: { token: null },
		});
		const res = await app.request('/test');
		expect(res.status).toBe(401);
	});
});

describe('authMiddleWare — profile lookup', () => {
	it('returns 404 when no profile is found for the user', async () => {
		dbMocks.selectReturn.mockResolvedValue([]);
		const res = await app.request('/test');
		expect(res.status).toBe(404);
	});
});

describe('authMiddleWare — happy path', () => {
	it('calls next and sets user and profileId on context', async () => {
		const res = await app.request('/test');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.userId).toBe('user-1');
		expect(body.profileId).toBe('profile-1');
	});
});
