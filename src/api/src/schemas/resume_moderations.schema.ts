import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { profileSchema } from './profiles.schema';

export const resumeModerationSchema = pgTable('resume_moderations', {
	id: uuid('id').primaryKey().defaultRandom(),
	profile_id: uuid('profile_id')
		.references(() => profileSchema.id)
		.notNull(),
	raw_text: text('raw_text').notNull(),
	reason: text('reason').notNull(),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
});
