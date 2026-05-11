import {
  integer,
  jsonb,
  pgTable,
  uuid,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

export const profileSchema = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  full_name: varchar({ length: 255 }).notNull(),
  skills: jsonb().default({}).notNull(),
  plan_credits: integer().default(3).notNull(),
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
