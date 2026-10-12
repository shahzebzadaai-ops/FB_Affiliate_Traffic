"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { contentRecords } from "@/content/catalog";
import { staffById } from "@/domain/people";
import type { ContentRecord, TaskStatus } from "@/domain/types";
import {
  approveTask,
  cancelTask,
  initialTaskState,
  postponeTask,
  recordMetrics,
  recordPublication,
  requestChanges,
  startTask,
  submitTask,
  type MetricEntry,
  type TaskState,
} from "@/preview/task-state";

const IDENTITY_KEY = "atos.preview.identity";
const STATE_KEY = "atos.preview.state.v1";
const TRAINING_KEY = "atos.preview.training.v1";

export type PreviewIdentityId = "shahzeb" | "masho";

type Snapshot = {
  ready: boolean;
  identityId: PreviewIdentityId | null;
  states: Record<string, TaskState>;
  training: Record<string, boolean>;
};

const SERVER_SNAPSHOT: Snapshot = {
  ready: false,
  identityId: null,
  states: {},
  training: {},
};

let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function loadSnapshot(): Snapshot {
  const stored = localStorage.getItem(IDENTITY_KEY);
  return {
    ready: true,
    identityId: stored === "shahzeb" || stored === "masho" ? stored : null,
    states: readJson(STATE_KEY, {}),
    training: readJson(TRAINING_KEY, {}),
  };
}

function emit(next: Snapshot) {
  snapshot = next;
  if (next.identityId) localStorage.setItem(IDENTITY_KEY, next.identityId);
  else localStorage.removeItem(IDENTITY_KEY);
  localStorage.setItem(STATE_KEY, JSON.stringify(next.states));
  localStorage.setItem(TRAINING_KEY, JSON.stringify(next.training));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getClientSnapshot(): Snapshot {
  if (!snapshot.ready && typeof window !== "undefined") {
    snapshot = loadSnapshot();
  }
  return snapshot;
}

type PreviewContextValue = {
  ready: boolean;
  identityId: PreviewIdentityId | null;
  enter: (id: PreviewIdentityId) => void;
  leave: () => void;
  resetWork: () => void;
  stateFor: (contentId: string) => TaskState;
  effectiveDue: (record: ContentRecord) => string;
  effectivePublish: (record: ContentRecord) => string;
  effectiveHook: (record: ContentRecord) => string;
  start: (contentId: string) => void;
  toggleCheck: (contentId: string, kind: "checklist" | "qualityChecks", id: string, value: boolean) => void;
  updateDraft: (contentId: string, patch: Partial<Pick<TaskState, "submissionNote" | "assetReference" | "facebookUrl" | "hookOverride">>) => void;
  submit: (contentId: string) => string[] | null;
  approve: (contentId: string, comment: string) => boolean;
  requestRevision: (contentId: string, comment: string) => boolean;
  postpone: (contentId: string, dueAt: string, publishAt: string, comment: string) => boolean;
  cancel: (contentId: string, reason: string) => boolean;
  publish: (contentId: string, facebookUrl: string) => boolean;
  saveMetrics: (contentId: string, entry: MetricEntry) => boolean;
  training: Record<string, boolean>;
  setTraining: (key: string, value: boolean) => void;
};

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const current = useSyncExternalStore(subscribe, getClientSnapshot, () => SERVER_SNAPSHOT);

  const value = useMemo<PreviewContextValue>(() => {
    const actor = current.identityId ? staffById(current.identityId) : undefined;
    const now = () => new Date().toISOString();
    const stateFor = (contentId: string) => current.states[contentId] ?? initialTaskState();
    const replaceState = (contentId: string, next: TaskState | null) => {
      if (!next) return false;
      emit({ ...current, states: { ...current.states, [contentId]: next } });
      return true;
    };

    return {
      ready: current.ready,
      identityId: current.identityId,
      enter: (id) => emit({ ...getClientSnapshot(), identityId: id }),
      leave: () => emit({ ...getClientSnapshot(), identityId: null }),
      resetWork: () => emit({ ...getClientSnapshot(), states: {}, training: {} }),
      stateFor,
      effectiveDue: (record) => stateFor(record.contentId).dueAtOverride ?? record.dueAt,
      effectivePublish: (record) => stateFor(record.contentId).publishAtOverride ?? record.publishAt,
      effectiveHook: (record) => stateFor(record.contentId).hookOverride ?? record.hook,
      start: (contentId) => {
        if (!actor) return;
        replaceState(contentId, startTask(stateFor(contentId), actor.id, now()));
      },
      toggleCheck: (contentId, kind, id, checked) => {
        const task = stateFor(contentId);
        replaceState(contentId, { ...task, [kind]: { ...task[kind], [id]: checked } });
      },
      updateDraft: (contentId, patch) => {
        replaceState(contentId, { ...stateFor(contentId), ...patch });
      },
      submit: (contentId) => {
        if (!actor) return ["Choose a preview identity first."];
        const record = contentRecords.find((item) => item.contentId === contentId);
        if (!record) return ["Unknown task."];
        const result = submitTask(stateFor(contentId), record.format, actor.id, now());
        if (!result.ok) return result.blockers;
        replaceState(contentId, result.state);
        return null;
      },
      approve: (contentId, comment) => {
        if (!actor) return false;
        const record = contentRecords.find((item) => item.contentId === contentId);
        if (!record) return false;
        return replaceState(
          contentId,
          approveTask(stateFor(contentId), actor.id, actor.role, record.assigneeId, comment, now()),
        );
      },
      requestRevision: (contentId, comment) => {
        if (!actor) return false;
        return replaceState(contentId, requestChanges(stateFor(contentId), actor.id, actor.role, comment, now()));
      },
      postpone: (contentId, dueAt, publishAt, comment) => {
        if (!actor) return false;
        return replaceState(
          contentId,
          postponeTask(stateFor(contentId), actor.id, actor.role, dueAt, publishAt, comment, now()),
        );
      },
      cancel: (contentId, reason) => {
        if (!actor) return false;
        return replaceState(contentId, cancelTask(stateFor(contentId), actor.id, actor.role, reason, now()));
      },
      publish: (contentId, facebookUrl) => {
        if (!actor) return false;
        return replaceState(contentId, recordPublication(stateFor(contentId), actor.id, facebookUrl, now()));
      },
      saveMetrics: (contentId, entry) => {
        if (!actor) return false;
        return replaceState(contentId, recordMetrics(stateFor(contentId), actor.id, entry, now()));
      },
      training: current.training,
      setTraining: (key, checked) => {
        const latest = getClientSnapshot();
        emit({ ...latest, training: { ...latest.training, [key]: checked } });
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
