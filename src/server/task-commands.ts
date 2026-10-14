import { can } from "@/domain/permissions";
import type { ContentFormat, Role } from "@/domain/types";
import {
  approveTask,
  cancelTask,
  initialTaskState,
  postponeTask,
  confirmScheduled,
  recordMetrics,
  recordPublication,
  reportPublicationIssue,
  requestChanges,
  startTask,
  submitTask,
  type MetricEntry,
  type TaskState,
} from "@/preview/task-state";

export type Actor = {
  id: string;
  personKey: string;
  role: Role;
  disabled: boolean;
};

export type TaskCommand =
  | { action: "start" }
  | { action: "toggle"; kind: "checklist" | "qualityChecks"; id: string; value: boolean }
  | { action: "draft"; patch: Partial<Pick<TaskState, "submissionNote" | "assetReference" | "facebookUrl" | "hookOverride">> }
  | { action: "submit"; format: ContentFormat }
  | { action: "approve"; comment: string }
  | { action: "requestRevision"; comment: string }
  | { action: "postpone"; dueAt: string; publishAt: string; comment: string }
  | { action: "cancel"; reason: string }
  | { action: "publish"; facebookUrl: string }
  | { action: "confirmScheduled" }
  | { action: "reportIssue"; note: string }
  | { action: "flagRegeneration"; note: string }
  | { action: "saveMetrics"; entry: MetricEntry };

export function canAccessPage(actor: Actor, pageCode: string, assignedPageCodes: readonly string[]): boolean {
  if (actor.disabled) return false;
  if (can(actor.role, "manage_plan") || can(actor.role, "approve_content") || can(actor.role, "view_all_pages")) return true;
  return assignedPageCodes.includes(pageCode);
}

export function canEnterOwner(role: Role): boolean {
  return can(role, "approve_content") || can(role, "view_finance") || can(role, "manage_users");
}

export function decideTaskCommand(
  actor: Actor,
  pageCode: string,
  assignedPageCodes: readonly string[],
  recordAssigneeId: string,
  state: TaskState,
  command: TaskCommand,
  now: string,
): { ok: true; state: TaskState } | { ok: false; error: string; blockers?: string[] } {
  if (!canAccessPage(actor, pageCode, assignedPageCodes)) return { ok: false, error: "This Page is not assigned to you." };
  const current = state ?? initialTaskState();

  if (command.action === "start") {
    if (!can(actor.role, "submit_work") && !can(actor.role, "manage_plan")) return { ok: false, error: "You cannot start this task." };
    return { ok: true, state: startTask(current, actor.personKey, now) };
  }

  if (command.action === "toggle") {
    if (!can(actor.role, "submit_work") && !can(actor.role, "manage_plan")) return { ok: false, error: "You cannot edit this checklist." };
    return {
      ok: true,
      state: { ...current, [command.kind]: { ...current[command.kind], [command.id]: command.value } },
    };
  }

  if (command.action === "draft") {
    if (!can(actor.role, "submit_work") && !can(actor.role, "manage_plan")) return { ok: false, error: "You cannot edit this task." };
    const patch = {
      submissionNote: command.patch.submissionNote,
      assetReference: command.patch.assetReference,
      facebookUrl: command.patch.facebookUrl,
      hookOverride: command.patch.hookOverride,
    };
    return { ok: true, state: { ...current, ...removeEmpty(patch) } };
  }

  if (command.action === "submit") {
    if (!can(actor.role, "submit_work")) return { ok: false, error: "You cannot submit this task." };
    const result = submitTask(current, command.format, actor.personKey, now);
    if (!result.ok) return { ok: false, error: result.blockers[0] ?? "This task is not ready.", blockers: result.blockers };
    return { ok: true, state: result.state };
  }

  if (command.action === "approve") {
    const next = approveTask(current, actor.personKey, actor.role, recordAssigneeId, command.comment, now);
    if (!next) return { ok: false, error: "Only a submitted task can be approved, and not by its assignee." };
    return { ok: true, state: next };
  }

  if (command.action === "requestRevision") {
    const next = requestChanges(current, actor.personKey, actor.role, command.comment, now);
    if (!next) return { ok: false, error: "Add a revision note of at least 8 characters." };
    return { ok: true, state: next };
  }

  if (command.action === "postpone") {
    const next = postponeTask(current, actor.personKey, actor.role, command.dueAt, command.publishAt, command.comment, now);
    if (!next) return { ok: false, error: "This task can no longer be moved." };
    return { ok: true, state: next };
  }

  if (command.action === "cancel") {
    const next = cancelTask(current, actor.personKey, actor.role, command.reason, now);
    if (!next) return { ok: false, error: "Add a reason before cancelling." };
    return { ok: true, state: next };
  }

  if (command.action === "confirmScheduled") {
    if (!can(actor.role, "submit_work") && !can(actor.role, "manage_plan")) return { ok: false, error: "You cannot confirm scheduling." };
    const next = confirmScheduled(current, actor.personKey, now);
    if (!next) return { ok: false, error: "Scheduling can be confirmed only after the asset is approved and a real file is stored." };
    return { ok: true, state: next };
  }

  if (command.action === "publish") {
    if (!can(actor.role, "submit_work") && !can(actor.role, "manage_plan")) return { ok: false, error: "You cannot record publication." };
    const next = recordPublication(current, actor.personKey, command.facebookUrl, now);
    if (!next) return { ok: false, error: "Confirm scheduling first, then paste the public Facebook URL." };
    return { ok: true, state: next };
  }

  if (command.action === "reportIssue") {
    if (!can(actor.role, "submit_work")) return { ok: false, error: "You cannot report an issue on this task." };
    const next = reportPublicationIssue(current, actor.personKey, command.note, now);
    if (!next) return { ok: false, error: "Describe the publishing problem in at least 8 characters." };
    return { ok: true, state: next };
  }

  if (command.action === "flagRegeneration") {
    if (!can(actor.role, "submit_work")) return { ok: false, error: "You cannot flag this asset." };
    if (typeof command.note !== "string" || command.note.trim().length < 8) return { ok: false, error: "Say what is wrong with the asset, in at least 8 characters." };
    return {
      ok: true,
      state: {
        ...current,
        regenerationRequest: { at: now, note: command.note.trim() },
        revisions: [
          ...current.revisions,
          { at: now, actorId: actor.personKey, action: "FLAG_REGENERATION", comment: command.note.trim() },
        ],
      },
    };
  }

  if (!can(actor.role, "submit_work") && !can(actor.role, "manage_plan")) return { ok: false, error: "You cannot record performance." };
  if (!["PUBLISHED", "METRICS_DUE", "PERFORMANCE_RECORDED"].includes(current.status)) {
    return { ok: false, error: "Performance can be saved only after the Facebook URL is recorded." };
  }
  const next = recordMetrics(current, actor.personKey, command.entry, now);
  if (!next) return { ok: false, error: "Enter organic or paid reach before saving. Do not guess." };
  return { ok: true, state: next };
}

function removeEmpty<T extends Record<string, string | undefined>>(patch: T): Partial<T> {
  return Object.fromEntries(Object.entries(patch).filter((entry) => entry[1] !== undefined)) as Partial<T>;
}
