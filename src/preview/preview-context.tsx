"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { contentRecords } from "@/content/catalog";
import type { ContentRecord, TaskStatus } from "@/domain/types";
import { can } from "@/domain/permissions";
import {
  initialTaskState,
  type MetricEntry,
  type TaskState,
} from "@/preview/task-state";
import type { CampaignRecord } from "@/domain/campaign";
import { BUILD_CAMPAIGN } from "@/domain/campaign";
import type { Role } from "@/domain/types";

export type SessionUser = {
  id: string;
  personKey: string;
  email: string;
  name: string;
  role: Role;
  disabled: boolean;
};

type TaskCommand =
  | { action: "start" }
  | { action: "toggle"; kind: "checklist" | "qualityChecks"; id: string; value: boolean }
  | { action: "draft"; patch: Partial<Pick<TaskState, "submissionNote" | "assetReference" | "facebookUrl" | "hookOverride">> }
  | { action: "submit"; format: ContentRecord["format"] }
  | { action: "approve"; comment: string; assigneeId: string }
  | { action: "requestRevision"; comment: string }
  | { action: "postpone"; dueAt: string; publishAt: string; comment: string }
  | { action: "cancel"; reason: string }
  | { action: "publish"; facebookUrl: string }
  | { action: "saveMetrics"; entry: MetricEntry };

type Snapshot = {
  ready: boolean;
  user: SessionUser | null;
  states: Record<string, TaskState>;
  training: Record<string, boolean>;
  visibleContentIds: string[];
  campaign: CampaignRecord;
};

const SERVER_SNAPSHOT: Snapshot = {
  ready: false,
  user: null,
  states: {},
  training: {},
  visibleContentIds: [],
  campaign: BUILD_CAMPAIGN,
};

let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let loading = false;
let chain: Promise<void> = Promise.resolve();

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function refresh() {
  const response = await fetch("/api/work", { cache: "no-store" });
  if (response.status === 401) {
    emit({ ...SERVER_SNAPSHOT, ready: true });
    return;
  }
  if (!response.ok) throw new Error("Work could not be loaded.");
  const body = (await response.json()) as {
    tasks?: Record<string, TaskState>;
    states?: Record<string, TaskState>;
    training: Record<string, boolean>;
    visibleContentIds: string[];
    campaign: CampaignRecord;
  };
  const me = await fetch("/api/auth/me", { cache: "no-store" });
  const user = me.ok ? ((await me.json()) as { user: SessionUser }).user : null;
  emit({
    ready: true,
    user,
    states: body.states ?? body.tasks ?? {},
    training: body.training ?? {},
    visibleContentIds: body.visibleContentIds ?? [],
    campaign: body.campaign ?? BUILD_CAMPAIGN,
  });
}

function getClientSnapshot(): Snapshot {
  if (!loading && typeof window !== "undefined") {
    loading = true;
    void refresh().catch(() => emit({ ...SERVER_SNAPSHOT, ready: true }));
  }
  return snapshot;
}

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = chain.then(work, work);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function sendTask(contentId: string, command: TaskCommand): Promise<{ ok: true; state: TaskState } | { ok: false; error: string; blockers?: string[] }> {
  return enqueue(async () => {
    const response = await fetch("/api/work", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "task", contentId, command }),
    });
    const body = (await response.json()) as { state?: TaskState; error?: string; blockers?: string[] };
    if (!response.ok || !body.state) return { ok: false, error: body.error ?? "The task was not saved.", blockers: body.blockers };
    emit({ ...snapshot, states: { ...snapshot.states, [contentId]: body.state } });
    return { ok: true, state: body.state };
  });
}

type PreviewContextValue = {
  ready: boolean;
  user: SessionUser | null;
  canAccess: (contentId: string) => boolean;
  stateFor: (contentId: string) => TaskState;
  effectiveDue: (record: ContentRecord) => string;
  effectivePublish: (record: ContentRecord) => string;
  effectiveHook: (record: ContentRecord) => string;
  start: (contentId: string) => Promise<void>;
  toggleCheck: (contentId: string, kind: "checklist" | "qualityChecks", id: string, value: boolean) => Promise<void>;
  updateDraft: (contentId: string, patch: Partial<Pick<TaskState, "submissionNote" | "assetReference" | "facebookUrl" | "hookOverride">>) => Promise<void>;
  submit: (contentId: string) => Promise<string[] | null>;
  approve: (contentId: string, comment: string) => Promise<boolean>;
  requestRevision: (contentId: string, comment: string) => Promise<boolean>;
  postpone: (contentId: string, dueAt: string, publishAt: string, comment: string) => Promise<boolean>;
  cancel: (contentId: string, reason: string) => Promise<boolean>;
  publish: (contentId: string, facebookUrl: string) => Promise<boolean>;
  saveMetrics: (contentId: string, entry: MetricEntry) => Promise<boolean>;
  training: Record<string, boolean>;
  setTraining: (key: string, value: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const current = useSyncExternalStore(subscribe, getClientSnapshot, () => SERVER_SNAPSHOT);
  const value = useMemo<PreviewContextValue>(() => {
    const stateFor = (contentId: string) => current.states[contentId] ?? initialTaskState();
    const recordFor = (contentId: string) => contentRecords.find((item) => item.contentId === contentId);
    return {
      ready: current.ready,
      user: current.user,
      canAccess: (contentId) => current.visibleContentIds.includes(contentId),
      stateFor,
      effectiveDue: (record) => stateFor(record.contentId).dueAtOverride ?? record.dueAt,
      effectivePublish: (record) => stateFor(record.contentId).publishAtOverride ?? record.publishAt,
      effectiveHook: (record) => stateFor(record.contentId).hookOverride ?? record.hook,
      start: async (contentId) => {
        await sendTask(contentId, { action: "start" });
      },
      toggleCheck: async (contentId, kind, id, value) => {
        await sendTask(contentId, { action: "toggle", kind, id, value });
      },
      updateDraft: async (contentId, patch) => {
        await sendTask(contentId, { action: "draft", patch });
      },
      submit: async (contentId) => {
        const record = recordFor(contentId);
        if (!record) return ["Unknown task."];
        const result = await sendTask(contentId, { action: "submit", format: record.format });
        return result.ok ? null : result.blockers ?? [result.error];
      },
      approve: async (contentId, comment) => {
        const record = recordFor(contentId);
        if (!record) return false;
        const result = await sendTask(contentId, { action: "approve", comment, assigneeId: record.assigneeId });
        return result.ok;
      },
      requestRevision: async (contentId, comment) => (await sendTask(contentId, { action: "requestRevision", comment })).ok,
      postpone: async (contentId, dueAt, publishAt, comment) => (await sendTask(contentId, { action: "postpone", dueAt, publishAt, comment })).ok,
      cancel: async (contentId, reason) => (await sendTask(contentId, { action: "cancel", reason })).ok,
      publish: async (contentId, facebookUrl) => (await sendTask(contentId, { action: "publish", facebookUrl })).ok,
      saveMetrics: async (contentId, entry) => (await sendTask(contentId, { action: "saveMetrics", entry })).ok,
      training: current.training,
      setTraining: async (key, completed) => {
        const response = await fetch("/api/work", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "training", lessonKey: key, completed }),
        });
        if (!response.ok) return;
        emit({ ...snapshot, training: { ...snapshot.training, [key]: completed } });
      },
      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        emit({ ...SERVER_SNAPSHOT, ready: true });
      },
    };
  }, [current]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview(): PreviewContextValue {
  const value = useContext(PreviewContext);
  if (!value) throw new Error("PreviewProvider is missing");
  return value;
}

export function ownerArea(role: Role | undefined): boolean {
  return role ? can(role, "approve_content") || can(role, "view_finance") || can(role, "manage_users") : false;
}

let clockSnapshot: number | null = null;

function subscribeClock() {
  return () => {};
}

function readClock(): number | null {
  clockSnapshot ??= Date.now();
  return clockSnapshot;
}

export function usePreviewClock(): number | null {
  return useSyncExternalStore(subscribeClock, readClock, () => null);
}

export function statusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    PLANNED: "Planned",
    ASSIGNED: "Not started",
    IN_PROGRESS: "In progress",
    READY_FOR_REVIEW: "Waiting for approval",
    CHANGES_REQUESTED: "Changes requested",
    APPROVED: "Approved",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    METRICS_DUE: "Metrics due",
    PERFORMANCE_RECORDED: "Performance recorded",
    CANCELLED: "Cancelled",
  };
  return labels[status];
}
