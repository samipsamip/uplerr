import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { profileSchema } from './profiles.schema';
import { skillCategoryEnum, skillLevelEnum } from './skill-enums.schema';

export { skillCategoryEnum, skillLevelEnum };

export const userSkillSchema = pgTable('user_skills', {
	id: uuid('id').primaryKey().defaultRandom(),
	profile_id: uuid('profile_id')
		.references(() => profileSchema.id)
		.notNull(),
	canonical_skill_id: uuid('canonical_skill_id'),
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
