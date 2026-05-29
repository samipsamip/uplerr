import { z } from 'zod';

export const resumeStructuredDataSchema = z.object({
	name: z.string(),
	email: z.string().optional(),
	phone: z.string().optional(),
	location: z.string().optional(),
	links: z
		.object({
			linkedin: z.string().optional(),
			github: z.string().optional(),
			portfolio: z.string().optional(),
		})
		.optional(),
	skills: z.array(z.string()),
	experience: z.array(
		z.object({
			company: z.string(),
			role: z.string(),
			duration: z.string().optional(),
			description: z.string().optional(),
		}),
	),
	education: z.array(
		z.object({
			institution: z.string(),
			degree: z.string(),
			year: z.string().optional(),
		}),
	),
	projects: z
		.array(
			z.object({
				name: z.string(),
				description: z.string().optional(),
				url: z.string().optional(),
				technologies: z.array(z.string()).optional(),
			}),
		)
		.optional(),
});

export type ResumeStructuredData = z.infer<typeof resumeStructuredDataSchema>;
