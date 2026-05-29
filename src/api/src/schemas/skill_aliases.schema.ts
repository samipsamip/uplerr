import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { skillsSchema } from './skills.schema';

export const skillAliasSchema = pgTable('skill_aliases', {
	id: uuid('id').primaryKey().defaultRandom(),
	skill_id: uuid('skill_id')
		.references(() => skillsSchema.id, { onDelete: 'cascade' })
		.notNull(),
	alias: varchar('alias', { length: 100 }).unique().notNull(),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
