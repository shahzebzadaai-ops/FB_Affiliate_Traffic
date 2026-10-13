export type StaffQueueName = "today" | "ready" | "scheduled" | "published" | "issues";

export type QueueFacts = {
  status: string;
  planDay: number;
  dueDate: string;
  publishDate: string;
  dueOverridden: boolean;
  publishOverridden: boolean;
  assetReference: string;
  flagged: boolean;
};

const PUBLISHED = new Set(["PUBLISHED", "METRICS_DUE", "PERFORMANCE_RECORDED"]);

export function hasMasterFile(assetReference: string): boolean {
  return /^https?:\/\//.test(assetReference.trim());
}

export function inPublishQueue(item: QueueFacts, queue: StaffQueueName, ctx: { live: boolean; today: string }): boolean {
  if (item.status === "CANCELLED") return false;
  if (queue === "ready") return hasMasterFile(item.assetReference) && !PUBLISHED.has(item.status) && item.status !== "SCHEDULED";
  if (queue === "scheduled") return item.status === "SCHEDULED";
  if (queue === "published") return PUBLISHED.has(item.status);
  if (queue === "issues") return item.flagged;
  if (ctx.live) return item.dueDate === ctx.today || item.publishDate === ctx.today;
  return item.planDay === 1 && !item.dueOverridden && !item.publishOverridden;
}

export function addCivilDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

export function inSevenDayWindow(planDay: number, publishDate: string, ctx: { live: boolean; today: string }): boolean {
  if (!ctx.live) return planDay >= 1 && planDay <= 7;
  return publishDate >= ctx.today && publishDate <= addCivilDays(ctx.today, 6);
}

export function isMissedPublication(status: string, publishAtMs: number, nowMs: number, live: boolean): boolean {
  if (!live) return false;
  if (PUBLISHED.has(status) || status === "CANCELLED" || status === "SCHEDULED") return false;
  return publishAtMs < nowMs;
}
