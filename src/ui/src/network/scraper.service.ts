import type { JobAnalysisResultType } from '@uppler/types';

import { api } from './client';

export type { JobAnalysisResultType };

export type JobState =
	| { status: 'pending' }
	| { status: 'processing'; stage: string }
	| { status: 'done'; result: JobAnalysisResultType }
	| { status: 'error'; code: string; message: string };

type StartScrapingPayload =
	| { hasUrl: true; jobDescriptionURL: string }
	| { hasUrl: false; rawJobDescriptionText: string };

export const postStartScraping = (payload: StartScrapingPayload) =>
	api.post('api/scraper/scrape', { json: payload }).json<{ jobId: string }>();

export const getScrapingJobStatus = (jobId: string) =>
	api.get(`api/scraper/${jobId}/stream`).json<JobState>();
