import type { PageIdentity } from "@/domain/pages";
import { pageByCode } from "@/domain/pages";
import { activeOperators, marketReviewer, type StaffMember } from "@/domain/people";
import { slotForPost, UK_MARKET } from "@/domain/schedule";
import {
  contentRecordSchema,
  importReportSchema,
  type ContentFormat,
  type ContentRecord,
  type ImportReport,
  type PageCode,
} from "@/domain/types";
import type { ParsedPlanRow } from "@/content/parse-plan";

const FORMAT_MAP: Record<ParsedPlanRow["formatRaw"], ContentFormat> = {
  Reel: "REEL",
  Image: "IMAGE_POST",
  Poll: "POLL",
  Carousel: "CAROUSEL",
};

const BOILERPLATE = [
  "20-35s original AI-assisted reel. ",
  "4:5 editorial image/story card. ",
  "Native Facebook poll/question. ",
  "5-slide 4:5 carousel. ",
];

const PROMPT_ALLOCATION = "14 Reels, 14 text/image posts, 4 polls and 4 carousels per Page";
const PDF_ALLOCATION = "16 Reels, 12 image/story posts, 4 polls and 4 carousels per Page";

function specificDirection(brief: string): string {
  let rest = brief;
  for (const prefix of BOILERPLATE) {
    if (rest.startsWith(prefix)) {
      rest = rest.slice(prefix.length);
      break;
    }
  }
  return rest;
}

function conflictingDirection(format: ContentFormat, brief: string): string | null {
  const rest = specificDirection(brief);
  let primary: ContentFormat | null = null;
  if (/native poll/i.test(rest)) primary = "POLL";
  else if (/\bcarousel\b/i.test(rest)) primary = "CAROUSEL";
  else if (/\breel\b/i.test(rest)) primary = "REEL";
  if (!primary || primary === format) return null;
  return `The format column says ${format}, but the specific brief sentence describes ${primary}. Produce ${format} until Shahzeb resolves it. Sentence: ${rest}`;
}

function yearMonth(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_MARKET.timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

function drivePath(pageName: string, contentId: string, publishAt: string): string {
  return `Affiliate Traffic OS/UK/${pageName}/${yearMonth(publishAt)}/${contentId}/`;
}

function voiceFor(page: PageIdentity): string {
  return `${page.tone} Natural UK English. Not a caricature and not an American accent.`;
}

export function buildCatalog(
  rows: ParsedPlanRow[],
  staff: StaffMember[],
): { records: ContentRecord[]; report: ImportReport } {
  const duplicates: string[] = [];
  const seen = new Set<string>();
  const missingFields: ImportReport["missingFields"] = [];
  const unresolved: ImportReport["unresolved"] = [];
  const records: ContentRecord[] = [];
  const operators = activeOperators(UK_MARKET.code, staff);
  const reviewer = marketReviewer(UK_MARKET.code, staff);
  const mix: Record<string, Record<string, number>> = {};

  rows.forEach((row, index) => {
    if (seen.has(row.sourceId)) duplicates.push(row.sourceId);
    seen.add(row.sourceId);

    const fields: string[] = [];
    if (!row.pillar) fields.push("pillar");
    if (!row.hook) fields.push("hook");
    if (!row.brief) fields.push("brief");
    if (!row.cta) fields.push("cta");
    if (!row.formatRaw) fields.push("format");
    if (fields.length > 0) {
      missingFields.push({ sourceId: row.sourceId || `row-${index + 1}`, fields });
      return;
    }
    if (!reviewer || operators.length === 0) {
      missingFields.push({ sourceId: row.sourceId, fields: ["assignee"] });
      return;
    }

    const pageCode = row.sourceId.split("-")[0] as PageCode;
    const page = pageByCode(pageCode);
    const format = FORMAT_MAP[row.formatRaw];
    const slot = slotForPost(row.sourceId);
    const priority = row.hook.startsWith("PRIORITY - ");
    const angle = row.hook.replace(/^PRIORITY - /, "");
    const contentId = `UK-${row.sourceId}`;
    const reasons: string[] = [];
    const conflict = conflictingDirection(format, row.brief);
    if (conflict) reasons.push(conflict);
    if (format !== slot.expectedFormat) {
      reasons.push(
        `This row is ${format}, but the weekly rhythm slot for its position expects ${slot.expectedFormat}.`,
      );
    }
    if (format === "POLL") {
      reasons.push(
        "Poll answer choices are not listed in the source plan. Draft 2–4 choices for Shahzeb to approve. Do not invent them as if they were already approved.",
      );
    }
    if (format === "CAROUSEL" && !/slide 2/i.test(row.brief)) {
      reasons.push("The carousel brief does not specify the three teaching points.");
    } else if (format === "CAROUSEL") {
      reasons.push(
        "The carousel structure is specified, but the three teaching points are not written out. Draft them from the hook for approval.",
      );
    }

    const question = angle.includes("?")
      ? angle.slice(angle.indexOf(angle.match(/[^.?]*\?/)?.[0] ?? angle))
      : `What do you think about this: ${angle}`;
    const monetisation = /guide bridge/i.test(row.cta) ? "guide_bridge_if_ready" : "none";
    const assignee = operators[index % operators.length];

    const record: ContentRecord = {
      contentId,
      sourceId: row.sourceId,
      countryCode: UK_MARKET.code,
      pageCode,
      persona: page.persona,
      pillar: row.pillar,
      angle,
      hook: angle,
      priority,
      format,
      sourceBrief: row.brief,
      creativeBrief: [
        `Source brief: ${row.brief}`,
        `Page tone: ${page.tone}`,
        `Visual direction: ${page.visual}`,
        monetisation === "none"
          ? "No affiliate link and no hard sell."
          : "Guide bridge only if the public site is ready and Shahzeb has approved a clear advertising disclosure. Otherwise publish it as a native post.",
        "Fictional scenarios stay editorial. Do not present them as real testimonials.",
      ].join(" "),
      scriptRequirements:
        format === "REEL"
          ? "20–35 seconds. Hook in the first 2 seconds. 4–6 scenes. Natural UK voice. Captions. End with one question."
          : format === "POLL"
            ? "One question and 2–4 choices. No outbound link."
            : format === "CAROUSEL"
              ? "Five slides: hook, three useful points, discussion question."
              : "One idea. Headline of no more than 12 words. The caption carries the story.",
      imageInstructions: page.visual,
      reelScenes:
        format === "REEL"
          ? `4–6 original scenes. Hook visible in the first 2 seconds. ${specificDirection(row.brief)}`
          : null,
      captionInstructions: `Write in the ${page.name} voice. One idea. End with the engagement question. ${
        monetisation === "guide_bridge_if_ready"
          ? "If a partner link is added later, the caption must identify it as advertising."
          : "Do not add an affiliate link."
      }`,
      engagementQuestion: question,
      expectedReaction: row.cta,
      assigneeId: assignee.id,
      reviewerId: reviewer.id,
      dueAt: slot.dueAt,
      publishAt: slot.publishAt,
      approvalStatus: "NOT_SUBMITTED",
      assetRequirements:
        format === "REEL"
          ? ["Vertical video 20–35s", "Subtitles", "Thumbnail", "Caption"]
          : format === "CAROUSEL"
            ? ["Five 4:5 slides", "Slide copy", "Caption"]
            : format === "POLL"
              ? ["Question", "2–4 choices", "No outbound link"]
              : ["4:5 original image", "Headline", "Caption"],
      publicationStatus: "UNPUBLISHED",
      performanceCheckpoints: ["24h", "72h", "7d"],
      cta: row.cta,
      week: slot.week,
      monetisation,
      driveFolderPath: drivePath(page.name, contentId, slot.publishAt),
      unresolved: reasons,
      voiceoverStyle: voiceFor(page),
      duration: format === "REEL" ? "20–35 seconds" : null,
    };

    const parsed = contentRecordSchema.safeParse(record);
    if (!parsed.success) {
      missingFields.push({
        sourceId: row.sourceId,
        fields: parsed.error.issues.map((issue) => issue.path.join(".") || "record"),
      });
      return;
    }

    records.push(parsed.data);
    mix[pageCode] ??= {};
    mix[pageCode][format] = (mix[pageCode][format] ?? 0) + 1;
    if (reasons.length > 0) {
      unresolved.push({ contentId, sourceId: row.sourceId, reasons });
    }
  });

  const report = importReportSchema.parse({
    expectedRecords: 180,
    parsedRows: rows.length,
    successfullyImported: records.length,
    duplicates,
    missingFields,
    unresolved,
    formatMixByPage: mix,
    allocationNote: `The build prompt suggested ${PROMPT_ALLOCATION}. The PDF specifies ${PDF_ALLOCATION}. The imported calendar keeps the PDF's 180 posts and its mix until Shahzeb approves a different allocation.`,
  });

  return { records, report };
}
