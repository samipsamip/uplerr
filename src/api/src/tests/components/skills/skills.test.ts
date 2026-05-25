import type { Context, Next } from 'hono';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { userSkillSchema } from '../../../schemas/user_skills.schema';
import {
	createTestDb,
	seedProfile,
	type TestDb,
} from '../../../tests/helpers/db';

const dbContainer = vi.hoisted(() => ({ db: null as TestDb | null }));

vi.mock('../../../utils/db', () => ({
	get default() {
		return dbContainer.db;
	},
}));

let db: TestDb;
let profileId: string;
let otherProfileId: string;

beforeAll(async () => {
	db = await createTestDb();
	dbContainer.db = db;
	({ profileId } = await seedProfile(db));
	({ profileId: otherProfileId } = await seedProfile(db));
});

beforeEach(async () => {
	await db.delete(userSkillSchema);
});

const { default: skillsRoute } =
	await import('../../../components/skills/skills.route');

vi.mock('../../../lib/middleware', () => ({
	get authMiddleWare() {
		return async (c: Context, next: Next) => {
			c.set('user', { id: 'user-1' });
			c.set('profileId', profileId);
			await next();
		};
	},
}));

const json = (body: unknown) => JSON.stringify(body);
const headers = { 'Content-Type': 'application/json' };

describe('GET /api/skills', () => {
	it('returns empty array when no skills exist', async () => {
		const res = await skillsRoute.request('/');
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});

	it('returns only skills belonging to the authenticated profile', async () => {
		await db.insert(userSkillSchema).values([
			{
				profile_id: profileId,
				name: 'TypeScript',
				category: 'Frontend',
				level: 'expert',
			},
			{
				profile_id: otherProfileId,
				name: 'Python',
				category: 'Backend',
				level: 'beginner',
			},
		]);

		const res = await skillsRoute.request('/');
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toHaveLength(1);
		expect(body[0].name).toBe('TypeScript');
	});

	it('excludes soft-deleted skills', async () => {
		await db.insert(userSkillSchema).values({
			profile_id: profileId,
			name: 'Go',
			category: 'Backend',
			level: 'beginner',
			deleted_at: new Date(),
		});

		const res = await skillsRoute.request('/');
		expect(res.status).toBe(200);
		expect(await res.json()).toHaveLength(0);
	});

	it('returns 500 when an unexpected error occurs', async () => {
		const savedDb = dbContainer.db;
		dbContainer.db = null;
		try {
			const res = await skillsRoute.request('/');
			expect(res.status).toBe(500);
		} finally {
			dbContainer.db = savedDb;
		}
	});
});

describe('POST /api/skills/add-skills', () => {
	it('inserts and returns the new skill', async () => {
		const res = await skillsRoute.request('/add-skills', {
			method: 'POST',
			headers,
			body: json({ name: 'TypeScript', category: 'Frontend', level: 'expert' }),
		});

		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.name).toBe('TypeScript');
		expect(body.profile_id).toBe(profileId);
		expect(body.source).toBe('manual');
	});

	it('returns 400 with fieldErrors on invalid payload', async () => {
		const res = await skillsRoute.request('/add-skills', {
			method: 'POST',
			headers,
			body: json({ name: 'TypeScript' }),
		});

		expect(res.status).toBe(400);
		expect((await res.json()).errors).toBeDefined();
	});

	it('returns 500 when an unexpected error occurs', async () => {
		const savedDb = dbContainer.db;
		dbContainer.db = null;
		try {
			const res = await skillsRoute.request('/add-skills', {
				method: 'POST',
				headers,
				body: json({ name: 'Rust', category: 'Backend', level: 'beginner' }),
			});
			expect(res.status).toBe(500);
		} finally {
			dbContainer.db = savedDb;
		}
	});
});

describe('PUT /api/skills/update-skills/:skillId', () => {
	it('updates the skill and returns the updated row', async () => {
		const [skill] = await db
			.insert(userSkillSchema)
			.values({
				profile_id: profileId,
				name: 'Vue',
				category: 'Frontend',
				level: 'beginner',
			})
			.returning();

		const res = await skillsRoute.request(`/update-skills/${skill.id}`, {
			method: 'PUT',
			headers,
			body: json({ level: 'advanced' }),
		});

		expect(res.status).toBe(200);
		expect((await res.json()).level).toBe('advanced');
	});

	it('returns 404 when skill does not belong to the profile', async () => {
		const [skill] = await db
			.insert(userSkillSchema)
			.values({
				profile_id: otherProfileId,
				name: 'Vue',
				category: 'Frontend',
				level: 'beginner',
			})
			.returning();

		const res = await skillsRoute.request(`/update-skills/${skill.id}`, {
			method: 'PUT',
			headers,
			body: json({ level: 'advanced' }),
		});

		expect(res.status).toBe(404);
	});

	it('returns 400 on invalid payload', async () => {
		const res = await skillsRoute.request('/update-skills/some-id', {
			method: 'PUT',
			headers,
			body: json({ level: 'god-tier' }),
		});

		expect(res.status).toBe(400);
		expect((await res.json()).errors).toBeDefined();
	});

	it('returns 500 when an unexpected error occurs', async () => {
		const savedDb = dbContainer.db;
		dbContainer.db = null;
		try {
			const res = await skillsRoute.request('/update-skills/some-id', {
				method: 'PUT',
				headers,
				body: json({ level: 'advanced' }),
			});
			expect(res.status).toBe(500);
		} finally {
			dbContainer.db = savedDb;
		}
	});
});

describe('DELETE /api/skills/delete-skills/:skillId', () => {
	it('soft deletes the skill and returns 200', async () => {
		const [skill] = await db
			.insert(userSkillSchema)
			.values({
				profile_id: profileId,
				name: 'Svelte',
				category: 'Frontend',
				level: 'beginner',
			})
			.returning();

		const res = await skillsRoute.request(`/delete-skills/${skill.id}`, {
			method: 'DELETE',
		});

		expect(res.status).toBe(200);

		// Verify it is soft-deleted, not hard-deleted
		const remaining = await skillsRoute.request('/');
		expect(await remaining.json()).toHaveLength(0);
	});

	it('returns 404 when skill does not belong to the profile', async () => {
		const [skill] = await db
			.insert(userSkillSchema)
			.values({
				profile_id: otherProfileId,
				name: 'Svelte',
				category: 'Frontend',
				level: 'beginner',
			})
			.returning();

		const res = await skillsRoute.request(`/delete-skills/${skill.id}`, {
			method: 'DELETE',
		});

		expect(res.status).toBe(404);
	});

	it('returns 500 when an unexpected error occurs', async () => {
		const savedDb = dbContainer.db;
		dbContainer.db = null;
		try {
			const res = await skillsRoute.request('/delete-skills/some-id', {
				method: 'DELETE',
			});
			expect(res.status).toBe(500);
		} finally {
			dbContainer.db = savedDb;
		}
	});
});
