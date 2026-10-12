import type { Role, TaskStatus } from "@/domain/types";
import { can, canApproveOwnWork } from "@/domain/permissions";
import { requiredChecklistIds } from "@/domain/workflows";
import { QUALITY_CHECKS } from "@/domain/quality";
import type { ContentFormat } from "@/domain/types";

export type Revision = {
  at: string;
  actorId: string;
  action: string;
  comment: string;
};

export type MetricEntry = {
  checkpoint: "24h" | "72h" | "7d";
  organicReach: number | null;
  paidReach: number | null;
  comments: number | null;
  shares: number | null;
  reactions: number | null;
  newFollowers: number | null;
  reelViews: number | null;
  watchTimeSeconds: number | null;
  websiteVisits: number | null;
  affiliateClicks: number | null;
};

export type TaskState = {
  status: TaskStatus;
  checklist: Record<string, boolean>;
  qualityChecks: Record<string, boolean>;
  submissionNote: string;
  assetReference: string;
  facebookUrl: string;
  revisions: Revision[];
  dueAtOverride?: string;
  publishAtOverride?: string;
  hookOverride?: string;
  cancelReason?: string;
  metrics: MetricEntry[];
};

export function initialTaskState(): TaskState {
  return {
    status: "ASSIGNED",
    checklist: {},
    qualityChecks: {},
    submissionNote: "",
    assetReference: "",
    facebookUrl: "",
    revisions: [],
    metrics: [],
  };
}

function withRevision(state: TaskState, revision: Revision, patch: Partial<TaskState>): TaskState {
  return {
    ...state,
    ...patch,
    revisions: [...state.revisions, revision],
  };
}

export function submissionBlockers(
  format: ContentFormat,
  state: TaskState,
): string[] {
  const blockers: string[] = [];
  for (const id of requiredChecklistIds(format)) {
    if (!state.checklist[id]) blockers.push(`Checklist: ${id}`);
  }
  for (const check of QUALITY_CHECKS) {
    if (!state.qualityChecks[check.id]) blockers.push(`Quality: ${check.label}`);
  }
  if (state.submissionNote.trim().length < 20) {
    blockers.push("Add a submission note of at least 20 characters.");
  }
  if (state.assetReference.trim().length < 8) {
    blockers.push("Add an asset reference. A finished description is not a file location.");
  }
  return blockers;
}

export function startTask(state: TaskState, actorId: string, at: string): TaskState {
  if (!["ASSIGNED", "PLANNED", "CHANGES_REQUESTED"].includes(state.status)) return state;
  return withRevision(
    state,
    { at, actorId, action: "START", comment: "Started production." },
    { status: "IN_PROGRESS" },
  );
}

export function submitTask(
  state: TaskState,
  format: ContentFormat,
  actorId: string,
  at: string,
): { ok: true; state: TaskState } | { ok: false; blockers: string[] } {
  const blockers = submissionBlockers(format, state);
  if (blockers.length > 0) return { ok: false, blockers };
  if (!["IN_PROGRESS", "CHANGES_REQUESTED"].includes(state.status)) {
    return { ok: false, blockers: ["Start the task before submitting it."] };
  }
  return {
    ok: true,
    state: withRevision(
      state,
      { at, actorId, action: "SUBMIT", comment: state.submissionNote.trim() },
      { status: "READY_FOR_REVIEW" },
    ),
  };
}

export function requestChanges(
  state: TaskState,
  actorId: string,
  actorRole: Role,
  comment: string,
  at: string,
): TaskState | null {
  if (!can(actorRole, "approve_content")) return null;
  if (state.status !== "READY_FOR_REVIEW") return null;
  if (comment.trim().length < 8) return null;
  return withRevision(
    state,
    { at, actorId, action: "REQUEST_CHANGES", comment: comment.trim() },
    { status: "CHANGES_REQUESTED" },
  );
}

export function approveTask(
  state: TaskState,
  actorId: string,
  actorRole: Role,
  assigneeId: string,
  comment: string,
  at: string,
): TaskState | null {
  if (!can(actorRole, "approve_content")) return null;
  if (canApproveOwnWork()) return null;
  if (actorId === assigneeId) return null;
  if (state.status !== "READY_FOR_REVIEW") return null;
  return withRevision(
    state,
    { at, actorId, action: "APPROVE", comment: comment.trim() || "Approved." },
    { status: "APPROVED" },
  );
}

export function postponeTask(
  state: TaskState,
  actorId: string,
  actorRole: Role,
  dueAt: string,
  publishAt: string,
  comment: string,
  at: string,
): TaskState | null {
  if (!can(actorRole, "manage_plan")) return null;
  if (state.status === "CANCELLED" || state.status === "PUBLISHED" || state.status === "PERFORMANCE_RECORDED") {
    return null;
  }
  return withRevision(
    state,
    { at, actorId, action: "POSTPONE", comment: comment.trim() || "Deadline changed." },
    { dueAtOverride: dueAt, publishAtOverride: publishAt },
  );
}

export function cancelTask(
  state: TaskState,
  actorId: string,
  actorRole: Role,
  reason: string,
  at: string,
): TaskState | null {
  if (!can(actorRole, "manage_plan")) return null;
  if (reason.trim().length < 8) return null;
  if (state.status === "PUBLISHED" || state.status === "PERFORMANCE_RECORDED") return null;
  return withRevision(
    state,
    { at, actorId, action: "CANCEL", comment: reason.trim() },
    { status: "CANCELLED", cancelReason: reason.trim() },
  );
}

export function recordPublication(
  state: TaskState,
  actorId: string,
  facebookUrl: string,
  at: string,
): TaskState | null {
  if (!["APPROVED", "SCHEDULED"].includes(state.status)) return null;
  if (!/^https?:\/\//.test(facebookUrl.trim())) return null;
  return withRevision(
    state,
    { at, actorId, action: "PUBLISH", comment: facebookUrl.trim() },
    { status: "PUBLISHED", facebookUrl: facebookUrl.trim() },
  );
}

export function recordMetrics(
  state: TaskState,
  actorId: string,
  entry: MetricEntry,
  at: string,
): TaskState | null {
  if (!["PUBLISHED", "METRICS_DUE", "PERFORMANCE_RECORDED"].includes(state.status)) return null;
  if (entry.organicReach === null && entry.paidReach === null) return null;
  const metrics = [...state.metrics.filter((item) => item.checkpoint !== entry.checkpoint), entry];
  const complete = ["24h", "72h", "7d"].every((checkpoint) =>
    metrics.some((item) => item.checkpoint === checkpoint),
  );
  return withRevision(
    state,
    { at, actorId, action: "RECORD_METRICS", comment: entry.checkpoint },
    { metrics, status: complete ? "PERFORMANCE_RECORDED" : "METRICS_DUE" },
  );
}
