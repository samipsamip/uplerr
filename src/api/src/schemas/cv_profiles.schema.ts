import {
	boolean,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';

import { profileSchema } from './profiles.schema';

export const cvProfileSchema = pgTable('cv_profiles', {
	id: uuid('id').primaryKey().defaultRandom(),
	user_id: text('user_id')
		.references(() => profileSchema.user_id)
		.notNull(),
	original_filename: text('original_filename').notNull(),
	resume_key: varchar('resume_key', { length: 255 }),
	resume_hash: varchar('resume_hash', { length: 64 }),
	raw_text: text('raw_text'),
	structured_data: jsonb('structured_data'),
	is_active: boolean('is_active').default(true).notNull(),
	uploaded_at: timestamp('uploaded_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
