import {
  addCivilDays,
  formatLondon,
  launchDayNumber,
  londonDateKey,
  londonDateTimeToUtc,
  londonToday,
  UK_MARKET,
} from "@/domain/schedule";

/** Planning anchor for the 180-post rhythm. This is not a live launch. */
export const PLAN_ANCHOR_DATE = UK_MARKET.launchDate;

export type CampaignRecord = {
  status: "BUILD" | "ACTIVE";
  startedAt: string | null;
};

export const BUILD_CAMPAIGN: CampaignRecord = {
  status: "BUILD",
  startedAt: null,
};

export type CampaignClock =
  | { phase: "BUILD" }
  | { phase: "ACTIVE"; day: number }
  | { phase: "REVIEW"; day: number };

export function confirmLaunch(
  current: CampaignRecord,
  now: Date,
  confirm: boolean,
): { ok: boolean; record: CampaignRecord; reason?: string } {
  if (current.status === "ACTIVE" && current.startedAt) {
    return { ok: true, record: current };
  }
  if (!confirm) {
    return { ok: false, record: current, reason: "Confirmation is required before the campaign clock can start." };
  }
  return { ok: true, record: { status: "ACTIVE", startedAt: now.toISOString() } };
}

export function londonLaunchDate(record: CampaignRecord): string | null {
  if (record.status !== "ACTIVE" || !record.startedAt) return null;
  return londonToday(new Date(record.startedAt));
}

export function campaignClock(record: CampaignRecord, now = new Date()): CampaignClock {
  const start = londonLaunchDate(record);
  if (!start) return { phase: "BUILD" };
  const day = launchDayNumber(londonToday(now), start);
  if (day > UK_MARKET.sprintDays) return { phase: "REVIEW", day };
  return { phase: "ACTIVE", day: Math.max(day, 1) };
}

export function londonClock(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_MARKET.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour === "24" ? "00" : hour}:${minute}`;
}

/** Zero-based day offset from the planning anchor. Day 1 of the plan is 0. */
export function planDayIndex(iso: string, anchor = PLAN_ANCHOR_DATE): number {
  return launchDayNumber(londonDateKey(iso), anchor) - 1;
}

export function campaignInstant(templateIso: string, record: CampaignRecord): string {
  const start = londonLaunchDate(record);
  if (!start) return templateIso;
  const ymd = addCivilDays(start, planDayIndex(templateIso));
  return londonDateTimeToUtc(ymd, londonClock(templateIso)).toISOString();
}

export function schedulePhrase(templateIso: string, record: CampaignRecord): string {
  const day = planDayIndex(templateIso) + 1;
  const clock = londonClock(templateIso);
  if (record.status !== "ACTIVE" || !record.startedAt) {
    return `Day ${day} · ${clock} UK`;
  }
  const instant = campaignInstant(templateIso, record);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_MARKET.timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(new Date(instant));
}

export function isLiveDate(record: CampaignRecord): boolean {
  return record.status === "ACTIVE" && Boolean(record.startedAt);
}

export function placedInstant(templateIso: string, override: string | undefined, record: CampaignRecord): string {
  if (override) return override;
  return campaignInstant(templateIso, record);
}

export function placedPhrase(templateIso: string, override: string | undefined, record: CampaignRecord): string {
  if (override) return formatLondon(override);
  return schedulePhrase(templateIso, record);
}
