import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

import { user } from './auth-schema';

export const profileSchema = pgTable('user_profiles', {
	id: uuid('id').primaryKey().defaultRandom(),
	user_id: text('user_id')
		.references(() => user.id)
		.unique()
		.notNull(),
	full_name: text('full_name'),
	subscription_tier: text('subscription_tier').default('free').notNull(),
	stripe_customer_id: text('stripe_customer_id'),
	stripe_subscription_id: text('stripe_subscription_id'),
	cv_generations_used: integer('cv_generations_used').default(0).notNull(),
	study_plans_used: integer('study_plans_used').default(0).notNull(),
	usage_reset_at: timestamp('usage_reset_at', { withTimezone: true }),
	created_at: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	is_banned: boolean('is_banned').default(false).notNull(),
	ban_reason: text('ban_reason'),
	deleted_at: timestamp('deleted_at', { withTimezone: true }),
});

export const userProfilePublicFields = {
	id: profileSchema.id,
	full_name: profileSchema.full_name,
	subscription_tier: profileSchema.subscription_tier,
	cv_generations_used: profileSchema.cv_generations_used,
	study_plans_used: profileSchema.study_plans_used,
	usage_reset_at: profileSchema.usage_reset_at,
};
