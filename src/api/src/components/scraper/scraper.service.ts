import { JobAdvertisementScraper } from '../../lib/scraper/JobAdvertisementScraper';
import { normalizeText } from '../../lib/scraper/utils';
import {
	type ResumeExtractionJobType,
	ResumeExtractionKind,
} from './scraper.types';

const scraper = new JobAdvertisementScraper();

export type JobState =
	| { status: 'pending' }
	| { status: 'processing'; stage: string }
	| { status: 'done'; content: string }
	| { status: 'error'; code: string; message: string };

export const startScraperWorker = (
	payload: ResumeExtractionJobType,
	onUpdate: (state: JobState) => void,
) => {
	void (async () => {
		try {
			if (payload.kind === ResumeExtractionKind.RAW_JOB_ADVERTISEMENT) {
				onUpdate({ status: 'processing', stage: 'extracting' });
				const normalized = normalizeText(payload.rawJobDescriptionText);
				//here call the LLM directly - call the moderation endpoint first and the extraction later.
				onUpdate({ status: 'done', content: normalized });
			}

			if (payload.kind === ResumeExtractionKind.URL_EXTRACTION) {
				const result = await scraper.scrapeJobListing(
					payload.jobDescriptionURL,
					(stage) => onUpdate({ status: 'processing', stage }),
				);

				if (result.success) {
					onUpdate({ status: 'done', content: result.content });
				} else {
					onUpdate({
						status: 'error',
						code: result.code,
						message: result.error,
					});
				}
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			onUpdate({ status: 'error', code: 'FETCH_FAILED', message });
		}
	})();
};
