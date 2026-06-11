import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

/**
 * Cache for scraped job listing content.
 * This table should be created as UNLOGGED in the generated migration:
 *   CREATE UNLOGGED TABLE "scraper_cache" (...)
 * UNLOGGED trades crash durability for significantly faster writes — acceptable
 * for a cache that can be cold-started from re-scraping.
 */
export const scraperCache = pgTable('scraper_cache', {
	urlHash: varchar('url_hash', { length: 64 }).primaryKey(),
	url: text('url').notNull(),
	content: text('content').notNull(),
	scrapedAt: timestamp('scraped_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
