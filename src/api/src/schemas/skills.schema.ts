import {
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';

import { skillCategoryEnum } from './skill-enums.schema';

export const skillsSchema = pgTable('skills', {
	id: uuid('id').primaryKey().defaultRandom(),
	slug: varchar('slug', { length: 100 }).unique().notNull(),
	display_name: varchar('display_name', { length: 100 }).notNull(),
	category: skillCategoryEnum('category').notNull(),
	description: text('description'),
	difficulty: integer('difficulty').default(3).notNull(),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
