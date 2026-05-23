import {
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

import { user } from './auth-schema';

export const studyPlanStatusEnum = pgEnum('study_plan_status', [
	'active',
	'completed',
	'archived',
]);

export const studyPlanSchema = pgTable('study_plans', {
	id: uuid().primaryKey().defaultRandom(),
	user_id: text('user_id').references(() => user.id),
	source_url: text().notNull(),
	source_text: text(),
	job_title: text(),
	extracted_skills: jsonb().notNull(),
	status: studyPlanStatusEnum('status').notNull().default('active'),
	created_at: timestamp({
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),
	updated_at: timestamp({
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),
	deleted_at: timestamp({
		withTimezone: true,
	}),
});
