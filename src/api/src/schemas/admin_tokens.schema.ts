import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const adminTokensSchema = pgTable('admin_tokens', {
	id: uuid('id').primaryKey().defaultRandom(),
	user_email: text('user_email').unique().notNull(),
	token: text('token').notNull(),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
});
