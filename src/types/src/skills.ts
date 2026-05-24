import { z } from 'zod';

export const SKILL_CATEGORIES = [
	'Frontend',
	'Backend',
	'Mobile',
	'DevOps',
	'Cloud',
	'Data',
	'Design',
	'Testing',
	'Security',
	'Other',
] as const;

export const SKILL_LEVELS = [
	'beginner',
	'intermediate',
	'advanced',
	'expert',
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const skillCategorySchema = z.enum(SKILL_CATEGORIES);
export const skillLevelSchema = z.enum(SKILL_LEVELS);

export const addSkillSchema = z.object({
	name: z.string().min(1, 'Skill name is required').max(100),
	category: skillCategorySchema,
	level: skillLevelSchema,
	source: z.string().optional(),
});

export const updateSkillSchema = addSkillSchema.partial();

export type AddSkillPayload = z.infer<typeof addSkillSchema>;
export type UpdateSkillPayload = z.infer<typeof updateSkillSchema>;

export type UserSkill = {
	id: string;
	name: string;
	category: SkillCategory;
	level: SkillLevel;
	source: string;
};
