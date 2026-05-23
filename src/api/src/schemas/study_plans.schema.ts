import {
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

import { cvProfileSchema } from './cv_profiles.schema';
import { profileSchema } from './profiles.schema';

export const studyPlanStatusEnum = pgEnum('study_plan_status', [
	'active',
	'completed',
	'archived',
]);

export const studyPlanSchema = pgTable('study_plans', {
	id: uuid().primaryKey().defaultRandom(),
	user_id: text('user_id')
		.references(() => profileSchema.user_id)
		.notNull(),
	cv_profile_id: uuid('cv_profile_id').references(() => cvProfileSchema.id),
	source_url: text('source_url'),
	job_ad_text: text('job_ad_text'),
	job_title: text('job_title'),
	company: text('company'),
	extracted_skills: jsonb('extracted_skills').notNull(),
	status: studyPlanStatusEnum('status').notNull().default('active'),
	created_at: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	updated_at: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
