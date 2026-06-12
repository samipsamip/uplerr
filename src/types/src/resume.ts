import { z } from 'zod';

/**
 * Strict ISO date (YYYY-MM-DD)
 * Allows null when uncertain
 */
const IsoDateString = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
	.nullable();

/**
 * Date field with raw + normalized
 */
const DateFieldSchema = z
	.object({
		raw: z.string().nullable(),
		normalized: IsoDateString,
	})
	.strict();

/**
 * Contact details (strict, no extra keys)
 */
const ContactDetailsSchema = z
	.object({
		email: z.string().email().nullable(),
		phone: z.string().nullable(),
		location: z.string().nullable(),
		linkedin: z.string().url().nullable(),
		portfolio: z.string().url().nullable(),

		// VCS (new fields)
		vcs_platform: z
			.enum(['GitHub', 'GitLab', 'Bitbucket', 'Azure', 'AWS'])
			.nullable(),

		vcs_url: z.string().url().nullable(),
	})
	.strict();

/**
 * Work history item
 */
const WorkHistorySchema = z
	.object({
		company: z.string().nullable(),
		role: z.string().nullable(),

		start_date: DateFieldSchema,
		end_date: DateFieldSchema,

		is_current: z.boolean().default(false),

		bullet_points: z.array(z.string()).default([]),
	})
	.strict()
	.refine(
		(item) => {
			// If current job, end date should usually be null
			if (item.is_current) {
				return item.end_date.normalized === null;
			}
			return true;
		},
		{
			message: 'Current roles should not have a normalized end_date',
		},
	);

/**
 * Education item
 */
const EducationSchema = z
	.object({
		institution: z.string().nullable(),
		degree: z.string().nullable(),
		field_of_study: z.string().nullable(),

		start_date: DateFieldSchema,
		end_date: DateFieldSchema,
	})
	.strict();

/**
 * Certification item
 */
const CertificationSchema = z
	.object({
		name: z.string().nullable(),
		issuer: z.string().nullable(),
		date: DateFieldSchema,
	})
	.strict();

/**
 * Project item
 */
const ProjectSchema = z
	.object({
		name: z.string(),

		description: z.string(),

		technologies: z.array(z.string()),

		links: z.array(z.string()),

		type: z.enum(['company', 'solo', 'freelance']),

		source: z.enum([
			'projects_section',
			'work_experience',
			'academic',
			'portfolio',
			'other',
		]),
	})
	.strict();

/**
 * Root resume extraction schema (UPDATED)
 */
export const ResumeExtractionSchema = z
	.object({
		full_name: z.string().nullable().default(null),

		contact_details: ContactDetailsSchema.default({
			email: null,
			phone: null,
			location: null,
			linkedin: null,
			portfolio: null,
			vcs_platform: null,
			vcs_url: null,
		}),

		professional_summary: z.string().nullable().default(null),

		work_history: z.array(WorkHistorySchema).default([]),

		education: z.array(EducationSchema).default([]),

		certifications: z.array(CertificationSchema).default([]),

		notable_achievements: z.array(z.string()).default([]),
	})
	.strict();

/**
 * Skill source
 */
const SkillSource = z.enum([
	'skills_section',
	'work_history',
	'project',
	'certification',
	'summary',
]);

/**
 * Skill item
 */
const SkillItem = z
	.object({
		name: z.string().min(1).trim(),
		source: SkillSource,
	})
	.strict();

const SkillLevel = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

const LeveledSkillItem = z
	.object({
		name: z.string().min(1).trim(),
		source: SkillSource,
		level: SkillLevel.default('intermediate'),
	})
	.strict();

/**
 * Skill array with dedupe
 */
const SkillArray = z
	.array(SkillItem)
	.default([])
	.transform((arr) => {
		const seen = new Set<string>();

		return arr.filter((item) => {
			const key = `${item.name.toLowerCase()}::${item.source}`;

			if (seen.has(key)) return false;

			seen.add(key);

			return true;
		});
	});

const LeveledSkillArray = z
	.array(LeveledSkillItem)
	.default([])
	.transform((arr) => {
		const seen = new Set<string>();

		return arr.filter((item) => {
			const key = `${item.name.toLowerCase()}::${item.source}`;

			if (seen.has(key)) return false;

			seen.add(key);

			return true;
		});
	});

/**
 * Skill extraction schema
 */
export const SkillExtractionSchema = z
	.object({
		technical_skills: LeveledSkillArray,
		tools_platforms: LeveledSkillArray,
		spoken_languages: SkillArray,
		soft_skills: SkillArray,
	})
	.strict()
	.transform((data) => {
		const normalize = (skills: z.infer<typeof SkillItem>[]) =>
			skills.map((s) => ({
				...s,
				name: s.name.trim(),
			}));

		return {
			...data,
			technical_skills: normalize(data.technical_skills),
			tools_platforms: normalize(data.tools_platforms),
			spoken_languages: normalize(data.spoken_languages),
			soft_skills: normalize(data.soft_skills),
		};
	});

/**
 * Project extraction schema
 */
export const ProjectExtractionSchema = z
	.object({
		projects: z.array(ProjectSchema),
	})
	.strict();

/**
 * Valid resume check
 */
export const ValidResumeReturnSchema = z
	.object({
		isValid: z.boolean(),
	})
	.strict();

/**
 * Moderation schema
 */
export const ModerationReturnSchema = z
	.object({
		is_malicious: z.boolean(),
		reason: z.string(),
	})
	.strict();
/**
 * Job description required skills extraction schema
 */
export const JobDescriptionSkillsExtractionSchema = z
	.object({
		company: z.string().nullable(),
		job_title: z.string().nullable(),
		skills_required: z
			.array(
				z.object({
					name: z.string(),
					level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
				}),
			)
			.default([]),
	})
	.strict();
/**
 * Job analysis result — returned to client after scraper step 1 (skill extraction + compatibility)
 */
export const JobAnalysisResultSchema = z
	.object({
		company: z.string().nullable(),
		job_title: z.string().nullable(),
		skills: z.array(
			z.object({
				name: z.string(),
				required_level: z.enum([
					'beginner',
					'intermediate',
					'advanced',
					'expert',
				]),
				user_level: z.string(),
			}),
		),
	})
	.strict();

const UserResourceSchema = z.object({
	title: z.string(),
	url: z.string(),
});

const SubtopicSchema = z.object({
	title: z.string(),
	description: z.string(),
	search_queries: z.array(z.string()),
	user_resources: z.array(UserResourceSchema).optional(),
});

const TopicSchema = z.object({
	title: z.string(),
	order: z.number(),
	rationale: z.string(),
	estimated_weeks: z.number(),
	subtopics: z.array(SubtopicSchema),
});

/**
 * Roadmap curriculum — topic-based output from the learning advisor LLM.
 */
export const RoadmapCurriculumSchema = z
	.object({
		summary: z.string(),
		estimated_weeks: z.number(),
		topics: z.array(TopicSchema),
	})
	.strict();

/**
 * Types
 */
export type ResumeExtractionType = z.infer<typeof ResumeExtractionSchema>;
export type SkillExtractionType = z.infer<typeof SkillExtractionSchema>;
export type ProjectExtractionType = z.infer<typeof ProjectExtractionSchema>;
export type ValidResumeType = z.infer<typeof ValidResumeReturnSchema>;
export type ResumeModerationType = z.infer<typeof ModerationReturnSchema>;
export type JobDescriptionModerationType = z.infer<
	typeof ModerationReturnSchema
>;
export type JobDescriptionSkillsExtractionType = z.infer<
	typeof JobDescriptionSkillsExtractionSchema
>;
export type JobAnalysisResultType = z.infer<typeof JobAnalysisResultSchema>;
export type RoadmapCurriculumType = z.infer<typeof RoadmapCurriculumSchema>;
export type UserResourceType = z.infer<typeof UserResourceSchema>;

/**
 * Combined structured output
 */
export type CvStructuredData = {
	extraction: ResumeExtractionType;
	skills: SkillExtractionType;
	projects: ProjectExtractionType;
};
