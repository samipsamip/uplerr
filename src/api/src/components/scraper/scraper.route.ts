import { factory } from '../../lib/factory';
import { authMiddleWare } from '../../lib/middleware';
import { scrapeJobDetails } from './scraper.controller';

const scraperRoute = factory.createApp();

scraperRoute.post('/scrape', authMiddleWare, ...scrapeJobDetails);
