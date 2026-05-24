import { and, eq } from 'drizzle-orm';

import { userSkillSchema } from '../../schemas/user_skills.schema';
import db from '../../utils/db';
import { notDeleted } from '../../utils/helpers';
import type { AddSkillPayload, UpdateSkillPayload } from './skills.types';

export const getSkillsByProfileId = async (profileId: string) => {
	return db
		.select()
		.from(userSkillSchema)
		.where(
			and(
				eq(userSkillSchema.profile_id, profileId),
				notDeleted(userSkillSchema),
			),
		);
};

export const updateSkill = async (
	skillId: string,
	profileId: string,
	payload: UpdateSkillPayload,
) => {
	const [updated] = await db
		.update(userSkillSchema)
		.set({ ...payload, updated_at: new Date() })
		.where(
			and(
				eq(userSkillSchema.id, skillId),
				eq(userSkillSchema.profile_id, profileId),
				notDeleted(userSkillSchema),
			),
		)
		.returning();
	return updated;
};

export const deleteSkill = async (skillId: string, profileId: string) => {
	const [deleted] = await db
		.update(userSkillSchema)
		.set({ deleted_at: new Date() })
		.where(
			and(
				eq(userSkillSchema.id, skillId),
				eq(userSkillSchema.profile_id, profileId),
				notDeleted(userSkillSchema),
			),
		)
		.returning();
	return deleted;
};

export const addSkill = async (profileId: string, skill: AddSkillPayload) => {
	const { name, category, level, source } = skill;
	const [inserted] = await db
		.insert(userSkillSchema)
		.values({
			profile_id: profileId,
			name,
			category,
			level,
			source: source ?? 'manual',
		})
		.returning();
	return inserted;
};
