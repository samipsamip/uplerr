import type { Context } from 'hono';
import { z } from 'zod';

import type { Env } from '../../lib/factory';
export const ScrapeJobDetailsRequestSchema = z.discriminatedUnion('hasUrl', [
	z.object({ hasUrl: z.literal(true), jobDescriptionURL: z.url() }),
	z.object({ hasUrl: z.literal(false), rawJobDescriptionText: z.string() }),
]);

type ScrapePayload = z.infer<typeof ScrapeJobDetailsRequestSchema>;
type ScrapeInput = {
	in: { json: ScrapePayload };
	out: { json: ScrapePayload };
};
export type ScrapeContext = Context<Env, string, ScrapeInput>;
type GetJobInput = {
	in: { param: z.infer<typeof JobDetailsStreamSchema> };
	out: { param: z.infer<typeof JobDetailsStreamSchema> };
};
export type GetJobContext = Context<Env, string, GetJobInput>;

export const ResumeExtractionKind = {
	URL_EXTRACTION: 'URL_EXTRACTION',
	RAW_JOB_ADVERTISEMENT: 'RAW_JOB_ADVERTISEMENT',
} as const;

export type ResumeExtractionJobType =
	| {
			jobId: string;
			jobDescriptionURL: string;
			kind: typeof ResumeExtractionKind.URL_EXTRACTION;
	  }
	| {
			jobId: string;
			rawJobDescriptionText: string;
			kind: typeof ResumeExtractionKind.RAW_JOB_ADVERTISEMENT;
	  };

export const JobDetailsStreamSchema = z.object({ jobId: z.string() });
