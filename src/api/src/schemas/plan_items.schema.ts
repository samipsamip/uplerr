import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { studyPlanSchema } from "./study_plans.schema";

export const planItemSchema = pgTable("plan_items", {
  id: uuid().primaryKey().defaultRandom(),
  plan_id: uuid("plan_id").references(() => studyPlanSchema.id, {
    onDelete: "cascade",
  }),
  skill_name: text().notNull(),
  category: text(),
  priority: integer().notNull(),
  user_competency: text(),
  resources: jsonb().default([]),
  estimated_hours: numeric(),
  sort_order: integer().notNull(),
  completed: boolean().default(false).notNull(),
  notes: text(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deleted_at: timestamp({ withTimezone: true }),
});
