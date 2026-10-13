import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contentRecords } from "@/content/catalog";
import { confirmLaunchFile, readCampaign } from "@/campaign/store";
import {
  BUILD_CAMPAIGN,
  campaignClock,
  campaignInstant,
  confirmLaunch,
  planDayIndex,
  schedulePhrase,
} from "@/domain/campaign";
import { londonDateTimeToUtc, slotForPost } from "@/domain/schedule";
import { initialTaskState } from "@/preview/task-state";

describe("campaign launch control", () => {
  it("begins in build mode and does not start without confirmation", () => {
    expect(BUILD_CAMPAIGN).toEqual({ status: "BUILD", startedAt: null });
    const directory = mkdtempSync(path.join(tmpdir(), "atos-campaign-"));
    const file = path.join(directory, "campaign-launch.json");
    expect(readCampaign(file)).toEqual(BUILD_CAMPAIGN);
    const denied = confirmLaunchFile(new Date("2026-10-20T08:00:00.000Z"), false, file);
    expect(denied.ok).toBe(false);
    expect(denied.record.status).toBe("BUILD");
    expect(existsSync(file)).toBe(false);
    expect(campaignClock(BUILD_CAMPAIGN, new Date("2026-10-20T08:00:00.000Z"))).toEqual({ phase: "BUILD" });
  });

  it("starts at day 1 only after confirmation and keeps that timestamp", () => {
    const now = new Date("2026-10-20T08:00:00.000Z");
    const started = confirmLaunch(BUILD_CAMPAIGN, now, true);
    expect(started.ok).toBe(true);
    expect(started.record.startedAt).toBe("2026-10-20T08:00:00.000Z");
    expect(campaignClock(started.record, now)).toEqual({ phase: "ACTIVE", day: 1 });
    expect(campaignClock(started.record, new Date("2026-10-21T08:00:00.000Z"))).toEqual({ phase: "ACTIVE", day: 2 });
    const again = confirmLaunch(started.record, new Date("2026-11-01T08:00:00.000Z"), true);
    expect(again.record.startedAt).toBe(started.record.startedAt);
  });

  it("aligns planned UK times to the confirmed launch date", () => {
    const started = confirmLaunch(BUILD_CAMPAIGN, new Date("2026-10-20T08:00:00.000Z"), true).record;
    const opening = slotForPost("SGIUK-001");
    expect(planDayIndex(opening.publishAt)).toBe(0);
    expect(campaignInstant(opening.publishAt, BUILD_CAMPAIGN)).toBe(opening.publishAt);
    expect(schedulePhrase(opening.publishAt, BUILD_CAMPAIGN)).toBe("Day 1 · 19:00 UK");
    expect(campaignInstant(opening.publishAt, started)).toBe(londonDateTimeToUtc("2026-10-20", "19:00").toISOString());
    expect(campaignInstant(opening.dueAt, started)).toBe(londonDateTimeToUtc("2026-10-20", "16:00").toISOString());
  });

  it("preserves the launch record across a fresh read", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "atos-campaign-"));
    const file = path.join(directory, "campaign-launch.json");
    const saved = confirmLaunchFile(new Date("2026-10-20T08:00:00.000Z"), true, file);
    expect(readCampaign(file)).toEqual(saved.record);
    expect(confirmLaunchFile(new Date("2027-01-01T00:00:00.000Z"), true, file).record.startedAt).toBe(saved.record.startedAt);
  });

  it("does not publish posts when their planned date has passed", () => {
    expect(contentRecords).toHaveLength(180);
    expect(contentRecords.every((record) => record.publicationStatus === "UNPUBLISHED")).toBe(true);
    const started = confirmLaunch(BUILD_CAMPAIGN, new Date("2020-01-01T00:00:00.000Z"), true).record;
    expect(campaignClock(started, new Date("2026-12-01T00:00:00.000Z")).phase).toBe("REVIEW");
    expect(contentRecords.every((record) => record.publicationStatus === "UNPUBLISHED")).toBe(true);
    expect(initialTaskState().status).toBe("ASSIGNED");
  });
});
