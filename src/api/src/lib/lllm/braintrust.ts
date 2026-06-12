import { initLogger, invoke } from 'braintrust';
import {
	type JobDescriptionModerationType,
	type JobDescriptionSkillsExtractionType,
	ModerationReturnSchema,
	ProjectExtractionSchema,
	type ProjectExtractionType,
	ResumeExtractionSchema,
	type ResumeExtractionType,
	type ResumeModerationType,
	type RoadmapCurriculumType,
	SkillExtractionSchema,
	type SkillExtractionType,
	ValidResumeReturnSchema,
	type ValidResumeType,
} from '@uppler/types';

const BRAINTRUST_PROMPT_SLUGS = {
	IS_VALID_RESUME: 'uplerr-is-resume-valid-eec7',
	CORE_RESUME_EXTRACTION: 'uplerr-core-resume-extraction-2033',
	EXTRACT_SKILLS: 'uplerr-extract-skills-798c',
	RESUME_MODERATION: 'uplerr-resume-moderator-42f7',
	RESUME_PROJECTS_EXTRACTION: 'uplerr-resume-extract-projects-9a0a',
	RESUME_JOB_DESCRIPTION_MODERATION: 'uplerr-job-description-moderator-837d',
	RESUME_JOB_DESCRIPTION_SKILLS_EXTRACTION:
		'uplerr-extract-required-skills-b003',
	ROADMAP_CURRICULUM: 'uplerr-learning-advisor-1faf',
} as const;

type BrainTrustConfig = {
	projectId: string;
	projectName: string;
	apiKey: string;
};

class BrainTrust {
	private readonly logger: ReturnType<typeof initLogger>;
	private readonly config: BrainTrustConfig;

	constructor(config: BrainTrustConfig) {
		this.config = config;
		this.logger = initLogger({
			apiKey: config.apiKey,
			projectName: config.projectName,
		});
	}

	private extractJson(raw: unknown): unknown {
		if (typeof raw !== 'string') return raw;
		const firstBrace = raw.indexOf('{');
		const lastBrace = raw.lastIndexOf('}');
		if (firstBrace !== -1 && lastBrace > firstBrace) {
			try {
				return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
			} catch {
				// fall through to throw below
			}
		}
		throw new Error(
			`[braintrust] response is not valid JSON: ${raw.slice(0, 200)}`,
		);
	}

	private async call<T>(
		slug: string,
		input: Record<string, unknown>,
		metadata: Record<string, unknown>,
	): Promise<T> {
		try {
			const raw = await invoke({
				projectId: this.config.projectId,
				projectName: this.config.projectName,
				slug,
				input,
				metadata,
			});
			const result = this.extractJson(raw) as Record<string, unknown>;
			return ((result as { parameter?: T }).parameter ?? result) as T;
		} finally {
			this.logger.flush();
		}
	}

	async checkForModeration(
		resumeText: string,
		profileId: string,
	): Promise<ResumeModerationType> {
		const raw = await this.call<unknown>(
			BRAINTRUST_PROMPT_SLUGS.RESUME_MODERATION,
			{ RESUME_TEXT: resumeText },
			{ profileId },
		);
		return ModerationReturnSchema.parse(raw);
	}

	async performValidationCheckOnResume(
		resumeText: string,
		profileId: string,
	): Promise<ValidResumeType> {
		const raw = await this.call<unknown>(
			BRAINTRUST_PROMPT_SLUGS.IS_VALID_RESUME,
			{ RESUME_TEXT: resumeText },
			{ profileId },
		);
		return ValidResumeReturnSchema.parse(raw);
	}

	async performResumeExtraction(
		resumeRawText: string,
		resumeLinks: string[],
		profileId: string,
	): Promise<ResumeExtractionType> {
		const raw = await this.call<unknown>(
			BRAINTRUST_PROMPT_SLUGS.CORE_RESUME_EXTRACTION,
			{ RESUME_TEXT: resumeRawText, RESUME_LINKS: resumeLinks },
			{ profileId },
		);
		return ResumeExtractionSchema.parse(raw);
	}

	async performSkillsExtraction(
		resumeRawText: string,
		profileId: string,
	): Promise<SkillExtractionType> {
		const raw = await this.call<unknown>(
			BRAINTRUST_PROMPT_SLUGS.EXTRACT_SKILLS,
			{ RESUME_TEXT: resumeRawText },
			{ profileId },
		);
		return SkillExtractionSchema.parse(raw);
	}

	async performProjectsExtraction(
		resumeRawText: string,
		resumeLinks: string[],
		profileId: string,
	): Promise<ProjectExtractionType> {
		const raw = await this.call<unknown>(
			BRAINTRUST_PROMPT_SLUGS.RESUME_PROJECTS_EXTRACTION,
			{ RESUME_TEXT: resumeRawText, RESUME_LINKS: resumeLinks },
			{ profileId },
		);
		return ProjectExtractionSchema.parse(raw);
	}

	moderateJobDescription(jobDescriptionRawText: string, profileId: string) {
		return this.call<JobDescriptionModerationType>(
			BRAINTRUST_PROMPT_SLUGS.RESUME_JOB_DESCRIPTION_MODERATION,
			{ JOB_DESCRIPTION: jobDescriptionRawText },
			{ profileId },
		);
	}

	extractRequiredSkillsFromJobDescription(
		jobDescriptionRawText: string,
		profileId: string,
	) {
		return this.call<JobDescriptionSkillsExtractionType>(
			BRAINTRUST_PROMPT_SLUGS.RESUME_JOB_DESCRIPTION_SKILLS_EXTRACTION,
			{ JOB_DESCRIPTION: jobDescriptionRawText },
			{ profileId },
		);
	}

	generateRoadmapCurriculum(
		input: {
			job_title: string | null;
			company: string | null;
			weekly_hours: number;
			timeline_target: string | null;
			skill_gaps: Array<{
				name: string;
				required_level: string;
				user_level: string;
			}>;
		},
		profileId: string,
	) {
		return this.call<RoadmapCurriculumType>(
			BRAINTRUST_PROMPT_SLUGS.ROADMAP_CURRICULUM,
			{
				JOB_TITLE: input.job_title ?? '',
				COMPANY: input.company ?? '',
				WEEKLY_HOURS: input.weekly_hours,
				TIMELINE_TARGET: input.timeline_target ?? 'not specified',
				SKILL_GAPS: input.skill_gaps,
			},
			{ profileId },
		);
	}
}

export const braintrust = new BrainTrust({
	apiKey: process.env.BRAINTRUST_API_KEY ?? '',
	projectId: process.env.BRAINTRUST_PROJECT_ID ?? '',
	projectName: process.env.BRAINTRUST_PROJECT_NAME ?? '',
});
