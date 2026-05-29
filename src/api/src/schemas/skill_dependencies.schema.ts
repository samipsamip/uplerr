import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { skillsSchema } from './skills.schema';

export const skillDependencySchema = pgTable('skill_dependencies', {
	id: uuid('id').primaryKey().defaultRandom(),
	skill_id: uuid('skill_id')
		.references(() => skillsSchema.id, { onDelete: 'cascade' })
		.notNull(),
	depends_on_skill_id: uuid('depends_on_skill_id')
		.references(() => skillsSchema.id, { onDelete: 'cascade' })
		.notNull(),
	importance: integer('importance').default(2).notNull(),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
