import { initLogger, invoke } from 'braintrust';
import type {
	ProjectExtractionType,
	ResumeExtractionType,
	ResumeModerationType,
	SkillExtractionType,
	ValidResumeType,
} from '@uppler/types';

const BRAINTRUST_PROMPT_SLUGS = {
	IS_VALID_RESUME: 'uplerr-is-resume-valid-eec7',
	CORE_RESUME_EXTRACTION: 'uplerr-core-resume-extraction-2033',
	EXTRACT_SKILLS: 'uplerr-extract-skills-798c',
	RESUME_MODERATION: 'uplerr-resume-moderator-42f7',
	RESUME_PROJECTS_EXTRACTION: 'uplerr-resume-extract-projects-9a0a',
	RESUME_JOB_DESCRIPTION_MODERATION: 'uplerr-job-description-moderator-837d',
	RESUME_JOB_DESCRIPTION_GAP_ANALYSIS: 'uplerr-job-desc',
	RESUME_SKILL_LEARNING_PATH: 'uplerr-skill-learning-path',
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
	async checkForModeration(
		resumeText: string,
		profileId: string,
	): Promise<ResumeModerationType> {
		try {
			return await invoke({
				projectId: this.config.projectId,
				projectName: this.config.projectName,
				slug: BRAINTRUST_PROMPT_SLUGS.RESUME_MODERATION,
				input: {
					RESUME_TEXT: resumeText,
				},
				metadata: {
					profileId,
				},
			});
		} finally {
			this.logger.flush();
		}
	}

	async performValidationCheckOnResume(
		resumeText: string,
		profileId: string,
	): Promise<ValidResumeType> {
		try {
			return await invoke({
				projectId: this.config.projectId,
				projectName: this.config.projectName,
				slug: BRAINTRUST_PROMPT_SLUGS.IS_VALID_RESUME,
				input: {
					RESUME_TEXT: resumeText,
				},
				metadata: {
					profileId,
				},
			});
		} finally {
			this.logger.flush();
		}
	}
	async performResumeExtraction(
		resumeRawText: string,
		resumeLinks: string[],
		profileId: string,
	): Promise<ResumeExtractionType> {
		try {
			return await invoke({
				projectId: this.config.projectId,
				projectName: this.config.projectName,
				slug: BRAINTRUST_PROMPT_SLUGS.CORE_RESUME_EXTRACTION,
				input: {
					RESUME_TEXT: resumeRawText,
					RESUME_LINKS: resumeLinks,
				},
				metadata: {
					profileId,
				},
			});
		} finally {
			this.logger.flush();
		}
	}
	async performSkillsExtraction(
		resumeRawText: string,
		profileId: string,
	): Promise<SkillExtractionType> {
		try {
			return await invoke({
				projectId: this.config.projectId,
				projectName: this.config.projectName,
				slug: BRAINTRUST_PROMPT_SLUGS.EXTRACT_SKILLS,
				input: {
					RESUME_TEXT: resumeRawText,
				},
				metadata: {
					profileId,
				},
			});
		} finally {
			this.logger.flush();
		}
	}
	async performProjectsExtraction(
		resumeRawText: string,
		resumeLinks: string[],
		profileId: string,
	): Promise<ProjectExtractionType> {
		try {
			return await invoke({
				projectId: this.config.projectId,
				projectName: this.config.projectName,
				slug: BRAINTRUST_PROMPT_SLUGS.RESUME_PROJECTS_EXTRACTION,
				input: {
					RESUME_TEXT: resumeRawText,
					RESUME_LINKS: resumeLinks,
				},
				metadata: {
					profileId,
				},
			});
		} finally {
			this.logger.flush();
		}
	}
	async moderateJobDescription(
		jobDescriptionRawText: string,
		profileId: string,
	) {
		try {
			return await invoke({
				projectId: this.config.projectId,
				projectName: this.config.projectName,
				slug: BRAINTRUST_PROMPT_SLUGS.RESUME_JOB_DESCRIPTION_MODERATION,
				input: {
					JOB_DESCRIPTION: jobDescriptionRawText,
				},
				metadata: {
					profileId,
				},
			});
		} finally {
			this.logger.flush();
		}
	}
	async identifyGapsBetweenJDandUser() {}
}

export const braintrust = new BrainTrust({
	apiKey: process.env.BRAINTRUST_API_KEY ?? '',
	projectId: process.env.BRAINTRUST_PROJECT_ID ?? '',
	projectName: process.env.BRAINTRUST_PROJECT_NAME ?? '',
});
