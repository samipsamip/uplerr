import { EventEmitter } from 'stream';

import { factory } from '../../lib/factory';
import { startScraperWorker } from './scraper.service';
import {
	type GetJobContext,
	ResumeExtractionKind,
	type ScrapeContext,
} from './scraper.types';

const jobs = new Map<string, EventEmitter>();

export const startJobScraping = factory.createHandlers(
	async (c: ScrapeContext) => {
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

		const eventEmitter = new EventEmitter();
		jobs.set(jobId, eventEmitter);
		startScraperWorker(resumeExtractionObject, eventEmitter);
		return c.json({ jobId });
	},
);

export const scrapeJobDetails = factory.createHandlers(
	async (c: GetJobContext) => {
		const { jobId } = c.req.valid('param');
		const emitter = jobs.get(jobId);
		return c.json({ jobId }, 200);
	},
);
