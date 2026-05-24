import { z } from 'zod';

export const CATEGORIES = [
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

export const LEVELS = [
	{ value: 'beginner', label: 'Beginner' },
	{ value: 'intermediate', label: 'Intermediate' },
	{ value: 'advanced', label: 'Advanced' },
	{ value: 'expert', label: 'Expert' },
] as const;

export type SkillCategory = (typeof CATEGORIES)[number];
export type SkillLevel = (typeof LEVELS)[number]['value'];

export const skillFormSchema = z.object({
	name: z.string().min(1, 'Skill name is required').max(100),
	category: z.enum(CATEGORIES, { error: 'Please select a category' }),
	level: z.enum(LEVELS.map((l) => l.value) as [SkillLevel, ...SkillLevel[]], {
		error: 'Please select an experience level',
	}),
});

export type SkillFormValues = z.infer<typeof skillFormSchema>;
