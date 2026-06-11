import { factory } from '../../lib/factory';
import { type JobState, startScraperWorker } from './scraper.service';
import {
	type GetJobContext,
	ResumeExtractionKind,
	type ScrapeContext,
} from './scraper.types';

const jobs = new Map<string, JobState>();

export const startJobScraping = factory.createHandlers(
	async (c: ScrapeContext) => {
		const profileId = c.get('profileId');
		const payload = c.req.valid('json');
		const jobId = crypto.randomUUID();
		const { hasUrl } = payload;
		const resumeExtractionObject = hasUrl
			? {
					jobId,
					jobDescriptionURL: payload.jobDescriptionURL,
					kind: ResumeExtractionKind.URL_EXTRACTION,
				}
			: {
					jobId,
					rawJobDescriptionText: payload.rawJobDescriptionText,
					kind: ResumeExtractionKind.RAW_JOB_ADVERTISEMENT,
				};

		jobs.set(jobId, { status: 'pending' });
		startScraperWorker(resumeExtractionObject, profileId, (state) =>
			jobs.set(jobId, state),
		);
		return c.json({ jobId });
	},
);

export const getJobScrapingProgressByJobID = factory.createHandlers(
	async (c: GetJobContext) => {
		const { jobId } = c.req.valid('param');
		const job = jobs.get(jobId);

		if (!job) return c.json({ error: 'Job not found' }, 404);

		if (job.status === 'done' || job.status === 'error') {
			jobs.delete(jobId);
		}

		return c.json(job);
	},
);
