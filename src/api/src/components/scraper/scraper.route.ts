import { factory } from '../../lib/factory';
import { authMiddleWare } from '../../lib/middleware';
import { zValidator } from '../../lib/validator';
import { scrapeJobDetails, startJobScraping } from './scraper.controller';
import {
	JobDetailsStreamSchema,
	ScrapeJobDetailsRequestSchema,
} from './scraper.types';

const scraperRoute = factory.createApp();

scraperRoute.post(
	'/scrape',
	authMiddleWare,
	zValidator('json', ScrapeJobDetailsRequestSchema),
	...startJobScraping,
);

scraperRoute.get(
	'/:jobId/stream',
	authMiddleWare,
	zValidator('param', JobDetailsStreamSchema),
	...scrapeJobDetails,
);

export default scraperRoute;
