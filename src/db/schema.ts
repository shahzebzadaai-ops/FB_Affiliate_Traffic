import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { TaskState } from "@/preview/task-state";
import type { ContentRecord } from "@/domain/types";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  personKey: text("person_key").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  passwordHash: text("password_hash").notNull(),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: integer("id").primaryKey(),
  email: text("email").notNull(),
  ip: text("ip").notNull(),
  succeeded: boolean("succeeded").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const contentItems = pgTable("content_items", {
  contentId: text("content_id").primaryKey(),
  sourceId: text("source_id").notNull(),
  pageCode: text("page_code").notNull(),
  assigneeId: text("assignee_id").notNull(),
  publicationStatus: text("publication_status").notNull(),
  unresolved: jsonb("unresolved").$type<string[]>().notNull(),
  record: jsonb("record").$type<ContentRecord>().notNull(),
});

export const taskStates = pgTable("task_states", {
  contentId: text("content_id").primaryKey(),
  state: jsonb("state").$type<TaskState>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const trainingProgress = pgTable("training_progress", {
  userId: uuid("user_id").notNull(),
  lessonKey: text("lesson_key").notNull(),
  completed: boolean("completed").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  timeZone: text("time_zone").notNull(),
  planVersion: text("plan_version").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: integer("id").primaryKey(),
  at: timestamp("at", { withTimezone: true }).notNull(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  detail: jsonb("detail").$type<Record<string, unknown>>().notNull(),
});

export const mandalaGoals = pgTable("mandala_goals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  targetAmountCents: integer("target_amount_cents").notNull(),
  currency: text("currency").notNull(),
  deadline: text("deadline"),
  notes: text("notes").notNull(),
});

export const mandalaPillars = pgTable("mandala_pillars", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  position: integer("position").notNull(),
  title: text("title").notNull(),
});

export const mandalaActions = pgTable("mandala_actions", {
  id: text("id").primaryKey(),
  pillarId: text("pillar_id").notNull(),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  successCriterion: text("success_criterion").notNull(),
  ownerLabel: text("owner_label").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
  dependencies: jsonb("dependencies").$type<string[]>().notNull(),
  dueOn: text("due_on"),
  completedOn: text("completed_on"),
  evidence: jsonb("evidence").$type<string[]>().notNull(),
  latestMeasurement: text("latest_measurement"),
  dataSource: text("data_source"),
  confidence: text("confidence"),
  blocker: text("blocker"),
  lastReviewedOn: text("last_reviewed_on"),
});
