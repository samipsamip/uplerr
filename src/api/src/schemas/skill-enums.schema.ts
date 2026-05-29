import { pgEnum } from 'drizzle-orm/pg-core';

export const skillCategoryEnum = pgEnum('skill_category', [
	'Frontend',
	'Backend',
	'Mobile',
	'DevOps',
	'Cloud',
	'Data',
	'Design',
	'Testing',
	'Security',
	'Language',
	'Soft',
	'Other',
]);

export const skillLevelEnum = pgEnum('skill_level', [
	'beginner',
	'intermediate',
	'advanced',
	'expert',
]);

export type SkillCategory = (typeof skillCategoryEnum.enumValues)[number];
export type SkillLevel = (typeof skillLevelEnum.enumValues)[number];
