import type { JobAnalysisResultType } from '@uppler/types';

import { braintrust } from '../../lib/lllm/braintrust';
import { JobAdvertisementScraper } from '../../lib/scraper/JobAdvertisementScraper';
import { normalizeText } from '../../lib/scraper/utils';
import {
	JobDescriptionExtractionError,
	JobDescriptionModerationError,
} from '../../utils/error-utils';
import { getSkillsByProfileId } from '../skills/skills.service';
import {
	type ResumeExtractionJobType,
	ResumeExtractionKind,
} from './scraper.types';

const scraper = new JobAdvertisementScraper();

/**
 * Strips separators and lowercases so common variants resolve to the same key:
 * "Node.js" | "NodeJS" | "node js" → "nodejs"
 * "React.js" | "ReactJS" → "reactjs"
 * "Test-Driven Development" → "testdrivendevelopment"
 */
function canonicalize(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[.\s\-_/]+/g, '');
}

export type JobState =
	| { status: 'pending' }
	| { status: 'processing'; stage: string }
	| { status: 'done'; result: JobAnalysisResultType }
	| { status: 'error'; code: string; message: string };

async function analyzeJobDescription(
	rawText: string,
	profileId: string,
	onUpdate: (state: JobState) => void,
): Promise<void> {
	onUpdate({ status: 'processing', stage: 'extracting' });

	const normalized = normalizeText(rawText);

	const moderationResult = await braintrust.moderateJobDescription(
		normalized,
		profileId,
	);
	if (moderationResult.is_malicious) {
		throw new JobDescriptionModerationError(moderationResult.reason);
	}

	onUpdate({ status: 'processing', stage: 'analyzing-skills' });

	const extraction = await braintrust.extractRequiredSkillsFromJobDescription(
		normalized,
		profileId,
	);

	if (extraction.skills_required.length === 0) {
		throw new JobDescriptionExtractionError(
			'No required skills could be extracted from the job description. This may be due to the content being too short, too vague, or not containing clear requirements.',
		);
	}

	const userSkills = await getSkillsByProfileId(profileId);

	// Index by both exact lowercase and canonical form so "Node.js" matches "nodejs", "NodeJS", etc.
	const userSkillMap = new Map<string, string>();
	for (const s of userSkills) {
		const exact = s.name.toLowerCase();
		const canon = canonicalize(s.name);
		if (!userSkillMap.has(exact)) userSkillMap.set(exact, s.level);
		if (!userSkillMap.has(canon)) userSkillMap.set(canon, s.level);
	}

	const skills = extraction.skills_required.map((skill) => ({
		name: skill.name,
		required_level: skill.level,
		user_level:
			userSkillMap.get(skill.name.toLowerCase()) ??
			userSkillMap.get(canonicalize(skill.name)) ??
			'none',
	}));

	onUpdate({
		status: 'done',
		result: {
			company: extraction.company,
			job_title: extraction.job_title,
			skills,
		},
	});
}

export const startScraperWorker = (
	payload: ResumeExtractionJobType,
	profileId: string,
	onUpdate: (state: JobState) => void,
) => {
	void (async () => {
		try {
			if (payload.kind === ResumeExtractionKind.RAW_JOB_ADVERTISEMENT) {
				await analyzeJobDescription(
					payload.rawJobDescriptionText,
					profileId,
					onUpdate,
				);
			}

			if (payload.kind === ResumeExtractionKind.URL_EXTRACTION) {
				const scrapeResult = await scraper.scrapeJobListing(
					payload.jobDescriptionURL,
					(stage) => onUpdate({ status: 'processing', stage }),
				);

				if (!scrapeResult.success) {
					onUpdate({
						status: 'error',
						code: scrapeResult.code,
						message: scrapeResult.error,
					});
					return;
				}

				await analyzeJobDescription(scrapeResult.content, profileId, onUpdate);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			onUpdate({ status: 'error', code: 'FETCH_FAILED', message });
		}
	})();
};
