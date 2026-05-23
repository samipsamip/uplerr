import {
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';

import { profileSchema } from './profiles.schema';

export const skillCategoryEnum = pgEnum('skill_category', [
	'Frontend',
	'Backend',
	'Mobile',
	'DevOps',
	'Cloud',
	'Data',
	'Design',
	'Testing',
	'Security',
	'Other',
]);

export const skillLevelEnum = pgEnum('skill_level', [
	'beginner',
	'intermediate',
	'advanced',
	'expert',
]);

export const userSkillSchema = pgTable('user_skills', {
	id: uuid('id').primaryKey().defaultRandom(),
	user_id: text('user_id')
		.references(() => profileSchema.user_id)
		.notNull(),
	name: varchar('name', { length: 100 }).notNull(),
	category: skillCategoryEnum('category').notNull(),
	level: skillLevelEnum('level').notNull(),
	source: text('source').default('manual').notNull(),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
