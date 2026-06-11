import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const waitlistSchema = pgTable('waitlist', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').unique().notNull(),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
});
