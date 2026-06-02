import type { EventEmitter } from 'node:stream';

import { JobAdvertisementScraper } from '../../lib/scraper/JobAdvertisementScraper';
import { normalizeText } from '../../lib/scraper/utils';
import {
	type ResumeExtractionJobType,
	ResumeExtractionKind,
} from './scraper.types';

const scraper = new JobAdvertisementScraper();

export const startScraperWorker = (
	payload: ResumeExtractionJobType,
	eventEmitter: EventEmitter,
) => {
	eventEmitter.emit('starting');
	if (payload.kind === ResumeExtractionKind.RAW_JOB_ADVERTISEMENT) {
		normalizeText(payload.rawJobDescriptionText);
		//here call the LLM directly - call the moderation endpoint first and the extraction later.
	}
	if (payload.kind === ResumeExtractionKind.URL_EXTRACTION) {
		scraper.scrapeJobListing(payload.jobDescriptionURL);
	}
};
