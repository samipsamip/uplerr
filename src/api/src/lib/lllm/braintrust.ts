import { initLogger, invoke } from 'braintrust';
import type {
	JobDescriptionModerationType,
	JobDescriptionSkillsExtractionType,
	ProjectExtractionType,
	ResumeExtractionType,
	ResumeModerationType,
	RoadmapCurriculumType,
	SkillExtractionType,
	ValidResumeType,
} from '@uppler/types';

const BRAINTRUST_PROMPT_SLUGS = {
	IS_VALID_RESUME: process.env.BRAINTRUST_SLUG_IS_VALID_RESUME ?? '',
	CORE_RESUME_EXTRACTION:
		process.env.BRAINTRUST_SLUG_CORE_RESUME_EXTRACTION ?? '',
	EXTRACT_SKILLS: process.env.BRAINTRUST_SLUG_EXTRACT_SKILLS ?? '',
	RESUME_MODERATION: process.env.BRAINTRUST_SLUG_RESUME_MODERATION ?? '',
	RESUME_PROJECTS_EXTRACTION:
		process.env.BRAINTRUST_SLUG_RESUME_PROJECTS_EXTRACTION ?? '',
	RESUME_JOB_DESCRIPTION_MODERATION:
		process.env.BRAINTRUST_SLUG_JOB_DESCRIPTION_MODERATION ?? '',
	RESUME_JOB_DESCRIPTION_SKILLS_EXTRACTION:
		process.env.BRAINTRUST_SLUG_JOB_DESCRIPTION_SKILLS_EXTRACTION ?? '',
	ROADMAP_CURRICULUM: process.env.BRAINTRUST_SLUG_ROADMAP_CURRICULUM ?? '',
};

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
			return (result.parameter ?? result.json ?? result) as T;
		} finally {
			this.logger.flush();
		}
	}

	checkForModeration(resumeText: string, profileId: string) {
		return this.call<ResumeModerationType>(
			BRAINTRUST_PROMPT_SLUGS.RESUME_MODERATION,
			{ RESUME_TEXT: resumeText },
			{ profileId },
		);
	}

	performValidationCheckOnResume(resumeText: string, profileId: string) {
		return this.call<ValidResumeType>(
			BRAINTRUST_PROMPT_SLUGS.IS_VALID_RESUME,
			{ RESUME_TEXT: resumeText },
			{ profileId },
		);
	}

	performResumeExtraction(
		resumeRawText: string,
		resumeLinks: string[],
		profileId: string,
	) {
		return this.call<ResumeExtractionType>(
			BRAINTRUST_PROMPT_SLUGS.CORE_RESUME_EXTRACTION,
			{ RESUME_TEXT: resumeRawText, RESUME_LINKS: resumeLinks },
			{ profileId },
		);
	}

	performSkillsExtraction(resumeRawText: string, profileId: string) {
		return this.call<SkillExtractionType>(
			BRAINTRUST_PROMPT_SLUGS.EXTRACT_SKILLS,
			{ RESUME_TEXT: resumeRawText },
			{ profileId },
		);
	}

	performProjectsExtraction(
		resumeRawText: string,
		resumeLinks: string[],
		profileId: string,
	) {
		return this.call<ProjectExtractionType>(
			BRAINTRUST_PROMPT_SLUGS.RESUME_PROJECTS_EXTRACTION,
			{ RESUME_TEXT: resumeRawText, RESUME_LINKS: resumeLinks },
			{ profileId },
		);
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
