import { z } from 'zod';
import { SKILL_CATEGORIES, SKILL_LEVELS } from '@uppler/types';

export const CATEGORIES = SKILL_CATEGORIES;

export const LEVELS = [
	{ value: 'beginner' as const, label: 'Beginner' },
	{ value: 'intermediate' as const, label: 'Intermediate' },
	{ value: 'advanced' as const, label: 'Advanced' },
	{ value: 'expert' as const, label: 'Expert' },
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const skillFormSchema = z.object({
	name: z.string().min(1, 'Skill name is required').max(100),
	category: z.enum(SKILL_CATEGORIES, { message: 'Please select a category' }),
	level: z.enum(SKILL_LEVELS, { message: 'Please select an experience level' }),
});

export type SkillFormValues = z.infer<typeof skillFormSchema>;
