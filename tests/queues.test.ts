import { describe, expect, it } from "vitest";
import { hasMasterFile, inPublishQueue, inSevenDayWindow, isMissedPublication, type QueueFacts } from "@/preview/queues";

const base: QueueFacts = {
  status: "ASSIGNED",
  planDay: 1,
  dueDate: "2026-10-12",
  publishDate: "2026-10-12",
  dueOverridden: false,
  publishOverridden: false,
  assetReference: "",
  flagged: false,
};

describe("publishing queues", () => {
  it("does not treat a description as a master file", () => {
    expect(hasMasterFile("")).toBe(false);
    expect(hasMasterFile("Finished Reel on the laptop")).toBe(false);
    expect(hasMasterFile(" https://files.example/reel.mp4 ")).toBe(true);
  });

  it("keeps ready empty until a file URL is stored", () => {
    const ctx = { live: false, today: "2026-10-13" };
    expect(inPublishQueue(base, "ready", ctx)).toBe(false);
    expect(inPublishQueue({ ...base, assetReference: "https://files.example/a.mp4" }, "ready", ctx)).toBe(true);
    expect(inPublishQueue({ ...base, assetReference: "https://files.example/a.mp4", status: "PUBLISHED" }, "ready", ctx)).toBe(false);
  });

  it("uses plan day 1 before the campaign is live", () => {
    const ctx = { live: false, today: "2026-10-20" };
    expect(inPublishQueue(base, "today", ctx)).toBe(true);
    expect(inPublishQueue({ ...base, planDay: 2 }, "today", ctx)).toBe(false);
  });

  it("limits the studio window to seven plan days, then seven civil days", () => {
    expect(inSevenDayWindow(7, "2026-10-18", { live: false, today: "2026-10-20" })).toBe(true);
    expect(inSevenDayWindow(8, "2026-10-19", { live: false, today: "2026-10-20" })).toBe(false);
    expect(inSevenDayWindow(20, "2026-10-18", { live: true, today: "2026-10-13" })).toBe(true);
    expect(inSevenDayWindow(20, "2026-10-20", { live: true, today: "2026-10-13" })).toBe(false);
  });

  it("does not call a post missed before the clock starts", () => {
    expect(isMissedPublication("ASSIGNED", Date.parse("2026-10-12T18:00:00.000Z"), Date.parse("2026-10-13T18:00:00.000Z"), false)).toBe(false);
    expect(isMissedPublication("ASSIGNED", Date.parse("2026-10-12T18:00:00.000Z"), Date.parse("2026-10-13T18:00:00.000Z"), true)).toBe(true);
    expect(isMissedPublication("PUBLISHED", Date.parse("2026-10-12T18:00:00.000Z"), Date.parse("2026-10-13T18:00:00.000Z"), true)).toBe(false);
  });
});
