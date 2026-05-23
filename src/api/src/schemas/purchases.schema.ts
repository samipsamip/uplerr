import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { profileSchema } from './profiles.schema';

export const purchaseSchema = pgTable('purchases', {
	id: uuid().primaryKey().defaultRandom(),
	user_id: uuid('user_id').references(() => profileSchema.id),
	stripe_session_id: text().unique(),
	credits_added: integer().notNull(),
	amount_paid: integer().notNull(),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
