import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from './auth-schema';

export const profileSchema = pgTable('user_profiles', {
	id: uuid('id').primaryKey().defaultRandom(),
	user_id: text('user_id')
		.references(() => user.id)
		.unique()
		.notNull(),
	full_name: text('full_name'),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	is_banned: boolean('is_banned').default(false).notNull(),
	ban_reason: text('ban_reason'),
	deleted_at: timestamp('deleted_at', { withTimezone: true }),
});

export const userProfilePublicFields = {
	id: profileSchema.id,
	full_name: profileSchema.full_name,
};
