import {
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const profileSchema = pgTable('user_profiles', {
	id: uuid('id').primaryKey().defaultRandom(),
	user_id: text('user_id')
		.references(() => user.id)
		.unique()
		.notNull(),
	resume_key: varchar({ length: 255 }),
	resume_file_name: varchar({ length: 255 }),
	resume_hash: varchar({ length: 64 }),
	skills: jsonb().default({}),
	created_at: timestamp({
		withTimezone: true,
	})
		.defaultNow()
		.notNull(),
	updated_at: timestamp({
		withTimezone: true,
	})
		.defaultNow()
		.notNull(),
	deleted_at: timestamp({
		withTimezone: true,
	}),
});

export const userProfilePublicFields = {
	id: profileSchema.id,
	resume_file_name: profileSchema.resume_file_name,
	skills: profileSchema.skills,
	createdAt: profileSchema.created_at,
};
