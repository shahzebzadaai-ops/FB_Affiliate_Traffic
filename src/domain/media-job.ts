import type { ContentRecord, PageCode } from "@/domain/types";
import { planDayIndex } from "@/domain/campaign";

export const JOB_STATUSES = [
  "QUEUED",
  "LEASED",
  "ASSEMBLING",
  "UPLOADING",
  "AWAITING_STORAGE",
  "READY_FOR_APPROVAL",
  "APPROVED",
  "FAILED",
  "CANCELLED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const OPEN_JOB_STATUSES: JobStatus[] = ["QUEUED", "LEASED", "ASSEMBLING", "UPLOADING", "AWAITING_STORAGE", "READY_FOR_APPROVAL"];

export const LEASE_MS = 10 * 60 * 1000;
export const HEARTBEAT_ONLINE_MS = 2 * 60 * 1000;
export const GLOBAL_RENDER_SLOTS = 1;

const BRITISH_VOICES = {
  BGUK: "bf_alice",
  AHSUK: "bf_isabella",
  SPSUK: "bf_lily",
  SGIUK: "bf_emma",
  CBCUK: "bm_george",
} as const;

export type ProductionSpec = {
  schemaVersion: 1;
  contentId: string;
  pageCode: PageCode;
  pageName: string;
  format: "REEL" | "IMAGE_POST";
  hook: string;
  narration: string[];
  visualDirection: string;
  sceneNotes: string | null;
  captionInstructions: string;
  voice: string;
  output: {
    width: 1080;
    height: 1920;
    fps: 30;
    minSeconds: 30;
    maxSeconds: 40;
  };
  driveFolderPath: string;
  music: { mode: "none"; reason: string };
  storySource: "imported-plan-brief";
  fictional: true;
  planDuration: string | null;
  unresolved: string[];
};

export type ProductionMeasurements = {
  renderSeconds: number;
  peakRssBytes: number;
  tempDiskBytes: number;
  externalApiCostCents: number | null;
};

export type ProductionResult = {
  sha256: string;
  durationSeconds: number | null;
  width: number;
  height: number;
  byteSize: number;
  assetUrl: string | null;
  driveFileId: string | null;
  measurements: ProductionMeasurements;
};

const BANNED_KEY = /revenue|commission|payout|password|secret|token|apikey|credential|shell|argv|command/i;

export function productionSpec(record: ContentRecord, pageName: string): ProductionSpec | { error: string } {
  if (record.format !== "REEL" && record.format !== "IMAGE_POST") {
    return { error: "This worker renders Reels and still images. Polls and carousels stay in the plan until a later profile." };
  }
  if (record.unresolved.length > 0) {
    return { error: "This brief still has unresolved notes. Resolve them before a worker can take the job." };
  }
  const narration = [record.hook.trim(), record.engagementQuestion.trim()].filter((line) => line.length > 0);
  const spec: ProductionSpec = {
    schemaVersion: 1,
    contentId: record.contentId,
    pageCode: record.pageCode,
    pageName,
    format: record.format,
    hook: record.hook,
    narration,
    visualDirection: record.imageInstructions,
    sceneNotes: record.reelScenes,
    captionInstructions: record.captionInstructions,
    voice: BRITISH_VOICES[record.pageCode],
    output: { width: 1080, height: 1920, fps: 30, minSeconds: 30, maxSeconds: 40 },
    driveFolderPath: record.driveFolderPath,
    music: { mode: "none", reason: "No licensed music file is attached to this job." },
    storySource: "imported-plan-brief",
    fictional: true,
    planDuration: record.duration,
    unresolved: [],
  };
  if (!specIsSafe(spec)) return { error: "The job spec was rejected." };
  return spec;
}

export function specIsSafe(value: unknown): boolean {
  return collectKeys(value).every((key) => !BANNED_KEY.test(key));
}

function collectKeys(value: unknown, keys: string[] = []): string[] {
  if (!value || typeof value !== "object") return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.push(key);
    collectKeys(child, keys);
  }
  return keys;
}

export function httpsAssetUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^https:\/\//.test(trimmed)) return null;
  return trimmed;
}

export function readyBuffer(
  items: { publishAt: string; assetReference: string }[],
  live: boolean,
  today: string,
): { due: number; ready: number; sufficient: boolean; window: string } {
  const dueItems = items.filter((item) => {
    const day = planDayIndex(item.publishAt) + 1;
    if (!live) return day >= 1 && day <= 3;
    return item.publishAt.slice(0, 10) >= today && item.publishAt.slice(0, 10) <= addDays(today, 2);
  });
  const ready = dueItems.filter((item) => /^https:\/\//.test(item.assetReference.trim())).length;
  return {
    due: dueItems.length,
    ready,
    sufficient: dueItems.length === 0 || ready >= dueItems.length,
    window: live ? "next-72-hours" : "plan-days-1-to-3",
  };
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function workerOnline(lastHeartbeatAt: Date | null, now: number): boolean {
  if (!lastHeartbeatAt) return false;
  return now - lastHeartbeatAt.getTime() <= HEARTBEAT_ONLINE_MS;
}
