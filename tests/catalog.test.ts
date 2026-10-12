import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/content/build-catalog";
import { parsePlanText } from "@/content/parse-plan";
import { STAFF, activeOperators } from "@/domain/people";
import { can } from "@/domain/permissions";
import { londonDateTimeToUtc, slotForPost } from "@/domain/schedule";
import { recommendFromSample, perThousand } from "@/domain/metrics";
import {
  approveTask,
  initialTaskState,
  recordPublication,
  startTask,
  submitTask,
} from "@/preview/task-state";
import { pageByCode } from "@/domain/pages";
import { productionGuide } from "@/domain/guide";

const source = readFileSync(
  path.resolve(process.cwd(), "data/source/uk-audience-network-plan.txt"),
  "utf8",
);

describe("month-one import", () => {
  const rows = parsePlanText(source);
  const { records, report } = buildCatalog(rows, STAFF);

  it("imports the PDF rows without duplicates or missing fields", () => {
    expect(report.expectedRecords).toBe(180);
    expect(report.parsedRows).toBe(180);
    expect(report.successfullyImported).toBe(180);
    expect(report.duplicates).toEqual([]);
    expect(report.missingFields).toEqual([]);
    expect(new Set(records.map((record) => record.contentId)).size).toBe(180);
  });

  it("keeps the PDF mix and records the prompt discrepancy", () => {
    expect(report.allocationNote).toContain("16 Reels");
    expect(report.allocationNote).toContain("14 Reels");
    for (const page of ["BGUK", "AHSUK", "SPSUK", "SGIUK", "CBCUK"]) {
      expect(report.formatMixByPage[page]).toEqual({
        REEL: 16,
        IMAGE_POST: 12,
        POLL: 4,
        CAROUSEL: 4,
      });
    }
  });

  it("preserves the Still Got It opening hook", () => {
    const post = records.find((record) => record.sourceId === "SGIUK-001");
    expect(post?.hook).toBe("She had not been on a first date since 1998.");
    expect(post?.format).toBe("REEL");
    expect(post?.pillar).toBe("Starting again");
    expect(post?.priority).toBe(true);
    expect(post?.publishAt).toBe("2026-10-12T18:00:00.000Z");
  });

  it("assigns production to the active UK operator and review to Shahzeb", () => {
    expect(activeOperators("UK").map((person) => person.id)).toEqual(["masho"]);
    expect(records.every((record) => record.assigneeId === "masho")).toBe(true);
    expect(records.every((record) => record.reviewerId === "shahzeb")).toBe(true);
  });

  it("does not treat format conflicts as failed imports", () => {
    expect(report.unresolved.length).toBeGreaterThan(0);
    expect(report.successfullyImported).toBe(180);
    const conflict = report.unresolved.find((item) => item.sourceId === "BGUK-019");
    expect(conflict?.reasons.some((reason) => reason.includes("POLL"))).toBe(true);
  });
});

describe("UK schedule", () => {
  it("converts London civil time across the October clock change", () => {
    expect(londonDateTimeToUtc("2026-10-12", "19:00").toISOString()).toBe("2026-10-12T18:00:00.000Z");
    expect(londonDateTimeToUtc("2026-11-02", "19:00").toISOString()).toBe("2026-11-02T19:00:00.000Z");
  });

  it("places week-four guide posts after the clock change", () => {
    const post = slotForPost("BGUK-036");
    expect(post.week).toBe(4);
    expect(post.expectedFormat).toBe("CAROUSEL");
    expect(post.publishAt.startsWith("2026-11-08")).toBe(true);
  });
});

describe("permissions and workflow", () => {
  it("hides finance from a content operator", () => {
    expect(can("CONTENT_OPERATOR", "view_finance")).toBe(false);
    expect(can("CONTENT_OPERATOR", "manage_postbacks")).toBe(false);
    expect(can("CONTENT_OPERATOR", "manage_users")).toBe(false);
    expect(can("CONTENT_OPERATOR", "view_staff_admin")).toBe(false);
    expect(can("SUPER_ADMIN", "view_finance")).toBe(true);
  });

  it("requires evidence before review and blocks self-approval", () => {
    const started = startTask(initialTaskState(), "masho", "2026-10-12T09:00:00.000Z");
    const blocked = submitTask(started, "REEL", "masho", "2026-10-12T10:00:00.000Z");
    expect(blocked.ok).toBe(false);

    const ready = {
      ...started,
      checklist: Object.fromEntries(
        ["read-brief", "script", "scenes", "images", "voiceover", "edit", "subtitles", "thumbnail", "quality", "upload", "submit"].map(
          (id) => [id, true],
        ),
      ),
      qualityChecks: {
        "uk-english": true,
        "one-idea": true,
        original: true,
        "not-a-testimonial": true,
        "no-humiliation": true,
        "age-appropriate": true,
        "anatomy-type": true,
        opening: true,
        captions: true,
        disclosure: true,
      },
      submissionNote: "Script, scenes and thumbnail are ready for review.",
      assetReference: "Affiliate Traffic OS/UK/Still Got It UK/2026-10/UK-SGIUK-001/",
    };
    const submitted = submitTask(ready, "REEL", "masho", "2026-10-12T16:00:00.000Z");
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;
    expect(approveTask(submitted.state, "masho", "CONTENT_OPERATOR", "masho", "Looks good", "2026-10-12T17:00:00.000Z")).toBeNull();
    const approved = approveTask(submitted.state, "shahzeb", "SUPER_ADMIN", "masho", "Approved.", "2026-10-12T17:00:00.000Z");
    expect(approved?.status).toBe("APPROVED");
    expect(recordPublication(approved!, "masho", "not-a-url", "2026-10-12T18:00:00.000Z")).toBeNull();
    expect(recordPublication(approved!, "masho", "https://www.facebook.com/example/posts/1", "2026-10-12T19:00:00.000Z")?.status).toBe("PUBLISHED");
  });
});

describe("guidance and recommendations", () => {
  it("gives Masho twenty production steps", () => {
    const { records } = buildCatalog(parsePlanText(source), STAFF);
    const record = records.find((item) => item.sourceId === "SGIUK-001");
    expect(record).toBeDefined();
    const steps = productionGuide(pageByCode("SGIUK"), record!);
    expect(steps).toHaveLength(20);
    expect(steps.map((step) => step.n)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
  });

  it("does not invent a winner from a small sample", () => {
    expect(perThousand(12, 0)).toBeNull();
    expect(perThousand(12, 1000)).toBe(12);
    const advice = recommendFromSample(3);
    expect(advice).toHaveLength(1);
    expect(advice[0]?.code).toBe("INSUFFICIENT_SAMPLE");
    expect(advice[0]?.text.toLowerCase()).not.toContain("proven winner");
  });
});
