import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { userSkillSchema } from '../../../schemas/user_skills.schema';
import { createTestDb, seedProfile, type TestDb } from '../../helpers/db';

// vi.hoisted runs before vi.mock so the container is available in the factory
const dbContainer = vi.hoisted(() => ({ db: null as TestDb | null }));

vi.mock('../../../utils/db', () => ({
	get default() {
		return dbContainer.db;
	},
}));

const { addSkill, deleteSkill, getSkillsByProfileId, updateSkill } =
	await import('../../../components/skills/skills.service');

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

describe('getSkillsByProfileId', () => {
	it('returns only skills belonging to the given profile', async () => {
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
				level: 'intermediate',
			},
		]);

		const skills = await getSkillsByProfileId(profileId);

		expect(skills).toHaveLength(1);
		expect(skills[0].name).toBe('TypeScript');
	});

	it('excludes soft-deleted skills', async () => {
		await db.insert(userSkillSchema).values({
			profile_id: profileId,
			name: 'Go',
			category: 'Backend',
			level: 'beginner',
			deleted_at: new Date(),
		});

		const skills = await getSkillsByProfileId(profileId);

		expect(skills).toHaveLength(0);
	});
});

describe('addSkill', () => {
	it('inserts and returns the new skill', async () => {
		const skill = await addSkill(profileId, {
			name: 'Rust',
			category: 'Backend',
			level: 'intermediate',
		});

		expect(skill.name).toBe('Rust');
		expect(skill.profile_id).toBe(profileId);
		expect(skill.source).toBe('manual');
	});
});

describe('updateSkill', () => {
	it('updates the skill and returns the updated row', async () => {
		const [inserted] = await db
			.insert(userSkillSchema)
			.values({
				profile_id: profileId,
				name: 'Vue',
				category: 'Frontend',
				level: 'beginner',
			})
			.returning();

		const updated = await updateSkill(inserted.id, profileId, {
			level: 'advanced',
		});

		expect(updated?.level).toBe('advanced');
		expect(updated?.name).toBe('Vue');
	});

	it('returns undefined when the skill belongs to another profile', async () => {
		const [inserted] = await db
			.insert(userSkillSchema)
			.values({
				profile_id: otherProfileId,
				name: 'Vue',
				category: 'Frontend',
				level: 'beginner',
			})
			.returning();

		const result = await updateSkill(inserted.id, profileId, {
			level: 'advanced',
		});

		expect(result).toBeUndefined();
	});
});

describe('deleteSkill', () => {
	it('soft deletes the skill', async () => {
		const [inserted] = await db
			.insert(userSkillSchema)
			.values({
				profile_id: profileId,
				name: 'Svelte',
				category: 'Frontend',
				level: 'beginner',
			})
			.returning();

		await deleteSkill(inserted.id, profileId);

		const remaining = await getSkillsByProfileId(profileId);
		expect(remaining).toHaveLength(0);
	});

	it('does not delete a skill belonging to another profile', async () => {
		const [inserted] = await db
			.insert(userSkillSchema)
			.values({
				profile_id: otherProfileId,
				name: 'Svelte',
				category: 'Frontend',
				level: 'beginner',
			})
			.returning();

		const result = await deleteSkill(inserted.id, profileId);

		expect(result).toBeUndefined();
	});
});
