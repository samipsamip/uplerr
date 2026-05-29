import { and, eq, inArray, or, sql } from 'drizzle-orm';

import { cvProfileSchema } from '../../schemas/cv_profiles.schema';
import {
	profileSchema,
	userProfilePublicFields,
} from '../../schemas/profiles.schema';
import { skillAliasSchema } from '../../schemas/skill_aliases.schema';
import type {
	SkillCategory,
	SkillLevel,
} from '../../schemas/skill-enums.schema';
import { skillsSchema } from '../../schemas/skills.schema';
import { userSkillSchema } from '../../schemas/user_skills.schema';
import db from '../../utils/db';
import { notDeleted } from '../../utils/helpers';

export const getUserProfileById = async (userId: string) => {
	return db
		.select(userProfilePublicFields)
		.from(profileSchema)
		.where(and(eq(profileSchema.user_id, userId), notDeleted(profileSchema)))
		.limit(1);
};

export const getActiveCvProfile = async (profileId: string) => {
	return db
		.select()
		.from(cvProfileSchema)
		.where(
			and(
				eq(cvProfileSchema.profile_id, profileId),
				eq(cvProfileSchema.is_active, true),
				notDeleted(cvProfileSchema),
			),
		)
		.limit(1);
};

export type NormalizedSkill = {
	rawName: string;
	canonicalName: string;
	canonicalId: string | null;
	category: SkillCategory;
};

export const normalizeExtractedSkills = async (
	rawSkills: string[],
): Promise<NormalizedSkill[]> => {
	if (rawSkills.length === 0) return [];

	const lowerToRaw = new Map(rawSkills.map((s) => [s.toLowerCase().trim(), s]));
	const lowerNames = [...lowerToRaw.keys()];

	const [aliasRows, directRows] = await Promise.all([
		db
			.select({
				alias: skillAliasSchema.alias,
				skill_id: skillAliasSchema.skill_id,
				display_name: skillsSchema.display_name,
				category: skillsSchema.category,
			})
			.from(skillAliasSchema)
			.innerJoin(skillsSchema, eq(skillAliasSchema.skill_id, skillsSchema.id))
			.where(
				and(
					inArray(sql`lower(${skillAliasSchema.alias})`, lowerNames),
					notDeleted(skillsSchema),
				),
			),
		db
			.select({
				id: skillsSchema.id,
				display_name: skillsSchema.display_name,
				category: skillsSchema.category,
				slug: skillsSchema.slug,
			})
			.from(skillsSchema)
			.where(
				and(
					notDeleted(skillsSchema),
					or(
						inArray(sql`lower(${skillsSchema.slug})`, lowerNames),
						inArray(sql`lower(${skillsSchema.display_name})`, lowerNames),
					),
				),
			),
	]);

	const aliasMap = new Map(aliasRows.map((r) => [r.alias.toLowerCase(), r]));
	const directBySlug = new Map(
		directRows.map((r) => [r.slug.toLowerCase(), r]),
	);
	const directByName = new Map(
		directRows.map((r) => [r.display_name.toLowerCase(), r]),
	);

	return rawSkills.map((raw) => {
		const lower = raw.toLowerCase().trim();
		const alias = aliasMap.get(lower);
		if (alias) {
			return {
				rawName: raw,
				canonicalName: alias.display_name,
				canonicalId: alias.skill_id,
				category: alias.category as SkillCategory,
			};
		}
		const direct = directBySlug.get(lower) ?? directByName.get(lower);
		if (direct) {
			return {
				rawName: raw,
				canonicalName: direct.display_name,
				canonicalId: direct.id,
				category: direct.category as SkillCategory,
			};
		}
		return {
			rawName: raw,
			canonicalName: raw,
			canonicalId: null,
			category: 'Other' as SkillCategory,
		};
	});
};

export const upsertCvExtractionSkills = async (
	profileId: string,
	skills: Array<{
		canonicalName: string;
		canonicalId: string | null;
		category: SkillCategory;
		level: SkillLevel;
	}>,
): Promise<void> => {
	await db
		.update(userSkillSchema)
		.set({ deleted_at: new Date() })
		.where(
			and(
				eq(userSkillSchema.profile_id, profileId),
				eq(userSkillSchema.source, 'cv_extraction'),
				notDeleted(userSkillSchema),
			),
		);

	if (skills.length === 0) return;

	await db.insert(userSkillSchema).values(
		skills.map((s) => ({
			profile_id: profileId,
			...(s.canonicalId ? { canonical_skill_id: s.canonicalId } : {}),
			name: s.canonicalName,
			category: s.category,
			level: s.level,
			source: 'cv_extraction',
		})),
	);
};
