import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { campaigns, contentItems, taskStates, trainingProgress } from "@/db/schema";
import { confirmLaunch, type CampaignRecord } from "@/domain/campaign";
import { can } from "@/domain/permissions";
import { initialTaskState, type TaskState } from "@/preview/task-state";
import { writeAudit, type PublicUser } from "@/server/accounts";
import { canAccessTask, decideTaskCommand, type TaskCommand } from "@/server/task-commands";

const CAMPAIGN_ID = "uk-month-one";

export async function loadWork(user: PublicUser) {
  const db = getDb();
  const items = await db.select().from(contentItems);
  const stored = await db.select().from(taskStates);
  const byId = new Map(stored.map((row) => [row.contentId, row.state]));
  const visible = items.filter((item) => canAccessTask({ ...user, disabled: user.disabled }, item.assigneeId));
  const states: Record<string, TaskState> = {};
  for (const item of visible) states[item.contentId] = byId.get(item.contentId) ?? initialTaskState();
  const trainingRows = can(user.role, "view_training_completion")
    ? await db.select().from(trainingProgress)
    : await db.select().from(trainingProgress).where(eq(trainingProgress.userId, user.id));
  const training: Record<string, boolean> = {};
  for (const row of trainingRows) training[row.lessonKey] = row.completed;
  return {
    states,
    training,
    visibleContentIds: visible.map((item) => item.contentId),
    campaign: await readCampaign(),
  };
}

export async function saveTask(user: PublicUser, contentId: string, command: TaskCommand) {
  const db = getDb();
  const [item] = await db.select().from(contentItems).where(eq(contentItems.contentId, contentId));
  if (!item) return { ok: false as const, status: 404, error: "That content ID is not in the plan." };
  const [existing] = await db.select().from(taskStates).where(eq(taskStates.contentId, contentId));
  const decision = decideTaskCommand(
    { ...user, disabled: user.disabled },
    item.assigneeId,
    existing?.state ?? initialTaskState(),
    command,
    new Date().toISOString(),
  );
  if (!decision.ok) return { ok: false as const, status: 403, error: decision.error, blockers: decision.blockers };
  if (existing) {
    await db.update(taskStates).set({ state: decision.state, updatedAt: new Date() }).where(eq(taskStates.contentId, contentId));
  } else {
    await db.insert(taskStates).values({ contentId, state: decision.state, updatedAt: new Date() });
  }
  await writeAudit(user.id, `TASK_${command.action.toUpperCase()}`, "content", contentId, {
    status: decision.state.status,
  });
  return { ok: true as const, state: decision.state };
}

export async function saveTraining(user: PublicUser, lessonKey: string, completed: boolean) {
  if (!lessonKey.startsWith(`${user.personKey}:`)) return { ok: false as const, error: "You can only update your own training." };
  if (!can(user.role, "submit_work")) return { ok: false as const, error: "You cannot update training." };
  const db = getDb();
  const existing = await db
    .select()
    .from(trainingProgress)
    .where(and(eq(trainingProgress.userId, user.id), eq(trainingProgress.lessonKey, lessonKey)));
  if (existing.length > 0) {
    await db
      .update(trainingProgress)
      .set({ completed, updatedAt: new Date() })
      .where(and(eq(trainingProgress.userId, user.id), eq(trainingProgress.lessonKey, lessonKey)));
  } else {
    await db.insert(trainingProgress).values({ userId: user.id, lessonKey, completed, updatedAt: new Date() });
  }
  await writeAudit(user.id, "TRAINING", "training", lessonKey, { completed });
  return { ok: true as const };
}

export async function readCampaign(): Promise<CampaignRecord> {
  const [row] = await getDb().select().from(campaigns).where(eq(campaigns.id, CAMPAIGN_ID));
  if (!row || row.status !== "ACTIVE" || !row.startedAt) return { status: "BUILD", startedAt: null };
  return { status: "ACTIVE", startedAt: row.startedAt.toISOString() };
}

export async function startCampaign(user: PublicUser, confirm: boolean, now = new Date()) {
  if (!can(user.role, "manage_plan")) return { ok: false as const, status: 403, error: "Only the owner can start the campaign." };
  const current = await readCampaign();
  const result = confirmLaunch(current, now, confirm);
  if (!result.ok) return { ok: false as const, status: 400, error: result.reason ?? "Confirmation is required.", record: result.record };
  if (result.record.status === "ACTIVE" && result.record.startedAt && current.status !== "ACTIVE") {
    await getDb()
      .update(campaigns)
      .set({ status: "ACTIVE", startedAt: new Date(result.record.startedAt), updatedAt: new Date() })
      .where(eq(campaigns.id, CAMPAIGN_ID));
    await writeAudit(user.id, "START_CAMPAIGN", "campaign", CAMPAIGN_ID, { startedAt: result.record.startedAt });
  }
  return { ok: true as const, record: result.record };
}
