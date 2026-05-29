import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';

import { skillsSchema } from './skills.schema';

export const skillResourceSchema = pgTable('skill_resources', {
	id: uuid('id').primaryKey().defaultRandom(),
	skill_id: uuid('skill_id')
		.references(() => skillsSchema.id, { onDelete: 'cascade' })
		.notNull(),
	title: varchar('title', { length: 255 }).notNull(),
	url: text('url').notNull(),
	type: text('type').notNull(),
	platform: varchar('platform', { length: 100 }),
	is_free: boolean('is_free').default(true).notNull(),
	description: text('description'),
	sort_order: integer('sort_order').default(0).notNull(),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
