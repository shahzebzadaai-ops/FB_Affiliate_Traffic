import { z } from "zod";
import { NEGATIVE_PROMPT } from "@/domain/muse";
import type { PageIdentity } from "@/domain/pages";

export const RESEARCH_PAGE_CODE = "BGUK" as const;
export const CONTENT_ID_PATTERN = /^RI-BGUK-\d{3}$/;

const httpsUrl = z.string().trim().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use an https source URL.");

export const researchSourceSchema = z.object({
  url: httpsUrl,
  sourceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  theme: z.string().trim().min(8).max(200),
  evidence: z.string().trim().min(40).max(4000),
  notes: z.string().trim().max(1000),
});

export type ResearchSource = z.infer<typeof researchSourceSchema>;

const scoreSchema = z.enum(["low", "medium", "high"]);
const reasonSchema = z.string().trim().min(12).max(500);

const scoredSchema = z.object({
  score: scoreSchema,
  reason: reasonSchema,
});

export const researchCandidateSchema = z.object({
  id: z.string().regex(/^c[1-4]$/),
  title: z.string().trim().min(8).max(140),
  audience: z.string().trim().min(8).max(300),
  insight: z.string().trim().min(20).max(600),
  relevance: scoredSchema,
  evidenceStrength: z.object({
    score: scoreSchema,
    reason: reasonSchema,
    sourceIndexes: z.array(z.number().int().min(0).max(30)).min(1).max(8),
  }),
  emotionalOrPractical: scoredSchema,
  reelPotential: scoredSchema,
  discussionMotivation: scoredSchema,
  pageAlignment: scoredSchema,
  repetition: z.object({
    score: z.enum(["low", "medium", "high", "unknown"]),
    reason: reasonSchema,
  }),
  uncertainty: z.string().trim().min(12).max(500),
  rank: z.number().int().min(1).max(4),
});

export const researchEvaluationSchema = z.object({
  confirmed: z.array(z.object({
    sourceIndex: z.number().int().min(0).max(30),
    statement: z.string().trim().min(12).max(500),
  })).min(2).max(8),
  interpretation: z.array(z.string().trim().min(12).max(500)).min(1).max(6),
  notEstablished: z.array(z.string().trim().min(12).max(500)).min(1).max(6),
  candidates: z.array(researchCandidateSchema).min(2).max(4),
});

export type ResearchEvaluation = z.infer<typeof researchEvaluationSchema>;
export type ResearchCandidate = z.infer<typeof researchCandidateSchema>;

const sceneSchema = z.object({
  number: z.number().int().min(1).max(6),
  durationSeconds: z.number().int().min(3).max(12),
  voiceover: z.string().trim().min(8).max(400),
  onScreenText: z.string().trim().max(140),
  subtitle: z.string().trim().min(3).max(180),
  visual: z.string().trim().min(20).max(800),
  camera: z.string().trim().min(8).max(300),
  lighting: z.string().trim().min(8).max(300),
  environment: z.string().trim().min(8).max(300),
  motion: z.string().trim().min(8).max(300),
  continuity: z.string().trim().min(12).max(400),
  character: z.string().trim().min(12).max(400),
});

export const reelScriptSchema = z.object({
  title: z.string().trim().min(8).max(140),
  audience: z.string().trim().min(12).max(300),
  topic: z.string().trim().min(8).max(200),
  insight: z.string().trim().min(20).max(600),
  hook: z.string().trim().min(8).max(180),
  script: z.string().trim().min(80).max(2200),
  voiceover: z.string().trim().min(40).max(1400),
  caption: z.string().trim().min(40).max(1600),
  engagementQuestion: z.string().trim().min(8).max(220),
  cta: z.string().trim().min(3).max(200),
  scenes: z.array(sceneSchema).min(4).max(6),
  referenceImages: z.array(z.object({
    id: z.string().trim().min(2).max(40),
    purpose: z.string().trim().min(8).max(240),
    prompt: z.string().trim().min(20).max(900),
    generated: z.literal(false),
  })).min(1).max(3),
  uncertainty: z.string().trim().min(12).max(500),
  evidenceUsed: z.array(z.number().int().min(0).max(30)).min(1).max(8),
});

export type ReelScript = z.infer<typeof reelScriptSchema>;

export type ResearchHandoff = {
  contentId: string;
  pageCode: typeof RESEARCH_PAGE_CODE;
  pageName: string;
  publishing: "disabled";
  source: "owner-supplied-evidence";
  liveResearch: false;
  model: string | null;
  notice: string;
  sources: Array<{ index: number; url: string; sourceDate: string | null; theme: string }>;
  confirmed: ResearchEvaluation["confirmed"];
  interpretation: string[];
  notEstablished: string[];
  approvedConcept: { id: string; title: string; insight: string; uncertainty: string };
  audience: string;
  topic: string;
  insight: string;
  hook: string;
  script: string;
  voiceover: string;
  durationSeconds: number;
  durationSpec: "20–35 seconds";
  aspectRatio: "9:16";
  width: 1080;
  height: 1920;
  composition: string;
  scenes: Array<ReelScript["scenes"][number] & { timestamp: string; prompt: string }>;
  narration: Array<{ scene: number; startSecond: number; durationSeconds: number; voiceover: string }>;
  referenceImages: Array<ReelScript["referenceImages"][number] & { status: "not-generated" }>;
  caption: string;
  title: string;
  engagementQuestion: string;
  cta: string;
  assembly: string;
  checklist: string[];
  negativePrompt: string;
};

const FABRICATED_METRIC = /\b\d[\d,.]*\s*(upvotes?|likes?|views?|shares?|comments?)\b/i;

function sourceMode(indexes: number[], count: number): "zero" | "one" {
  const finite = indexes.filter((index) => index >= 0 && index <= count);
  if (finite.some((index) => index === 0)) return "zero";
  if (finite.length > 0 && finite.every((index) => index >= 1) && finite.some((index) => index === count)) return "one";
  return "zero";
}

function placedIndex(index: number, count: number, mode: "zero" | "one"): number | null {
  const value = mode === "one" ? index - 1 : index;
  return value >= 0 && value < count ? value : null;
}

export function alignEvaluationSources(evaluation: ResearchEvaluation, count: number): ResearchEvaluation {
  const seen = [
    ...evaluation.confirmed.map((item) => item.sourceIndex),
    ...evaluation.candidates.flatMap((candidate) => candidate.evidenceStrength.sourceIndexes),
  ];
  const mode = sourceMode(seen, count);
  const confirmed = evaluation.confirmed.flatMap((item) => {
    const sourceIndex = placedIndex(item.sourceIndex, count, mode);
    return sourceIndex === null ? [] : [{ ...item, sourceIndex }];
  }).slice(0, 8);
  const candidates = evaluation.candidates.flatMap((candidate) => {
    const sourceIndexes = [...new Set(candidate.evidenceStrength.sourceIndexes.flatMap((index) => {
      const value = placedIndex(index, count, mode);
      return value === null ? [] : [value];
    }))];
    if (sourceIndexes.length === 0) return [];
    return [{ ...candidate, evidenceStrength: { ...candidate.evidenceStrength, sourceIndexes } }];
  }).slice(0, 4);
  return { ...evaluation, confirmed, candidates };
}

export function alignScriptSources(script: ReelScript, count: number): ReelScript {
  const mode = sourceMode(script.evidenceUsed, count);
  const evidenceUsed = [...new Set(script.evidenceUsed.flatMap((index) => {
    const value = placedIndex(index, count, mode);
    return value === null ? [] : [value];
  }))];
  return { ...script, evidenceUsed };
}

export function groundEvaluation(evaluation: ResearchEvaluation, sources: ResearchSource[]): string | null {
  if (sources.length === 0) return "Add at least one source before evaluating topics.";
  const ranks = evaluation.candidates.map((candidate) => candidate.rank);
  if (new Set(ranks).size !== ranks.length) return "Each topic needs its own rank.";
  const ids = evaluation.candidates.map((candidate) => candidate.id);
  if (new Set(ids).size !== ids.length) return "Each topic needs its own id.";
  for (const item of evaluation.confirmed) {
    const source = sources[item.sourceIndex];
    if (!source) return "A confirmed statement points at a source that was not saved.";
    const problem = unsupportedClaim(item.statement, [source]);
    if (problem) return problem;
  }
  for (const candidate of evaluation.candidates) {
    for (const index of candidate.evidenceStrength.sourceIndexes) {
      if (!sources[index]) return "A topic cites a source that was not saved.";
    }
    const problem = unsupportedClaim(
      [candidate.title, candidate.insight, candidate.uncertainty, candidate.relevance.reason, candidate.evidenceStrength.reason].join(" "),
      sources,
    );
    if (problem) return problem;
  }
  return null;
}

export function groundScript(script: ReelScript, sources: ResearchSource[]): string | null {
  const numbers = script.scenes.map((scene) => scene.number);
  const expected = script.scenes.map((_, index) => index + 1);
  if (numbers.join(",") !== expected.join(",")) return "Scene numbers must run from 1 without gaps.";
  const total = script.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
  if (total < 20 || total > 35) return `The scenes add up to ${total} seconds. The Reel must be 20–35 seconds.`;
  for (const index of script.evidenceUsed) {
    if (!sources[index]) return "The script cites a source that was not saved.";
  }
  const blob = [
    script.script,
    script.voiceover,
    script.caption,
    script.hook,
    ...script.scenes.map((scene) => `${scene.voiceover} ${scene.visual} ${scene.onScreenText}`),
  ].join("\n");
  return unsupportedClaim(blob, sources);
}

function unsupportedClaim(text: string, sources: ResearchSource[]): string | null {
  if (FABRICATED_METRIC.test(text)) return "The reply included an engagement count that was not in the saved evidence.";
  const allowed = new Set(sources.map((source) => source.url));
  const urls = text.match(/https?:\/\/[^\s)"']+/g) ?? [];
  for (const raw of urls) {
    const url = raw.replace(/[.,]$/, "");
    if (!allowed.has(url)) return "The reply cited a URL that was not saved with the research.";
  }
  const quotes = [...text.matchAll(/[“"]([^”"]{20,})[”"]/g)].map((match) => match[1]);
  const evidence = sources.map((source) => source.evidence).join("\n");
  for (const quote of quotes) {
    if (!evidence.includes(quote)) return `A quotation is not present in the saved evidence. Remove these quotation marks and do not present this as a quote: ${quote.slice(0, 90)}`;
  }
  return null;
}

export function buildResearchHandoff(input: {
  contentId: string;
  page: PageIdentity;
  sources: ResearchSource[];
  evaluation: ResearchEvaluation;
  candidateId: string;
  script: ReelScript;
  model: string | null;
}): ResearchHandoff {
  const candidate = input.evaluation.candidates.find((item) => item.id === input.candidateId);
  if (!candidate) throw new Error("The approved topic is not in this evaluation.");
  const durationProblem = groundScript(input.script, input.sources);
  if (durationProblem) throw new Error(durationProblem);
  const lead = input.script.scenes[0];
  const lockedCharacter = [lead?.character, lead?.continuity].reduce((text, line) => {
    const part = line?.trim();
    if (!part) return text;
    if (!text) return part;
    return /[.!?]$/.test(text) ? `${text} ${part}` : `${text}. ${part}`;
  }, "");
  let cursor = 0;
  const scenes = input.script.scenes.map((scene) => {
    const startSecond = cursor;
    cursor += scene.durationSeconds;
    return {
      ...scene,
      character: lockedCharacter || scene.character,
      timestamp: `${stamp(startSecond)}–${stamp(cursor)}`,
      prompt: clipPrompt(input.page, input.script, scene, lockedCharacter || scene.character),
    };
  });
  let start = 0;
  const timed = scenes.map((scene) => {
    const row = { scene: scene.number, startSecond: start, durationSeconds: scene.durationSeconds, voiceover: scene.voiceover };
    start += scene.durationSeconds;
    return row;
  });
  const checklist = operatorChecklist(input.contentId, scenes.length);
  return {
    contentId: input.contentId,
    pageCode: RESEARCH_PAGE_CODE,
    pageName: input.page.name,
    publishing: "disabled",
    source: "owner-supplied-evidence",
    liveResearch: false,
    model: input.model,
    notice: "Prepared from the sources saved on this package. The model did not search the web. No Muse API was called. Publishing is off.",
    sources: input.sources.map((source, index) => ({
      index,
      url: source.url,
      sourceDate: source.sourceDate,
      theme: source.theme,
    })),
    confirmed: input.evaluation.confirmed,
    interpretation: input.evaluation.interpretation,
    notEstablished: input.evaluation.notEstablished,
    approvedConcept: {
      id: candidate.id,
      title: candidate.title,
      insight: candidate.insight,
      uncertainty: candidate.uncertainty,
    },
    audience: input.script.audience,
    topic: input.script.topic,
    insight: input.script.insight,
    hook: input.script.hook,
    script: input.script.script,
    voiceover: input.script.voiceover,
    durationSeconds: timed.reduce((sum, row) => sum + row.durationSeconds, 0),
    durationSpec: "20–35 seconds",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    composition: "Vertical 9:16, 1080×1920. The opening line must be readable in the first three seconds. Leave the lower third clear for captions. No logo sting.",
    scenes,
    narration: timed,
    referenceImages: input.script.referenceImages.map((image) => ({ ...image, generated: false, status: "not-generated" as const })),
    caption: input.script.caption,
    title: input.script.title,
    engagementQuestion: input.script.engagementQuestion,
    cta: input.script.cta,
    assembly: "Generate one separate Muse clip for each scene, in scene order. Repeat the character description every time. This OS has not verified Muse character lock, clip length, or reference-image upload. The FFmpeg worker does not join these Muse clips yet. Keep every file with this content ID.",
    checklist,
    negativePrompt: NEGATIVE_PROMPT,
  };
}

export function handoffMarkdown(body: ResearchHandoff): string {
  const lines = [
    `# Muse instructions — ${body.contentId}`,
    "",
    body.notice,
    "",
    `Page: ${body.pageName}`,
    `Publishing: ${body.publishing}`,
    `Duration: ${body.durationSeconds} seconds (${body.durationSpec})`,
    `Frame: ${body.aspectRatio}, ${body.width}×${body.height}`,
    `Composition: ${body.composition}`,
    "",
    "## What to do",
    ...body.checklist.map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Approved topic",
    body.approvedConcept.title,
    body.approvedConcept.insight,
    `Uncertainty: ${body.approvedConcept.uncertainty}`,
    "",
    "## Sources saved with this package",
  ];
  for (const source of body.sources) {
    lines.push(`- Source ${source.index + 1}: ${source.theme} (${source.sourceDate ?? "date not recorded"}) ${source.url}`);
  }
  lines.push("", "## Confirmed from those sources");
  for (const item of body.confirmed) lines.push(`- Source ${item.sourceIndex + 1}: ${item.statement}`);
  lines.push("", "## Interpretation, not source evidence");
  for (const item of body.interpretation) lines.push(`- ${item}`);
  lines.push("", "## Not established");
  for (const item of body.notEstablished) lines.push(`- ${item}`);
  lines.push(
    "",
    "## Reel",
    `Title: ${body.title}`,
    `Audience: ${body.audience}`,
    `Topic: ${body.topic}`,
    `Insight: ${body.insight}`,
    `Hook: ${body.hook}`,
    "",
    body.script,
    "",
    "### Narration timing",
  );
  for (const row of body.narration) {
    lines.push(`- Scene ${row.scene} at ${stamp(row.startSecond)} for ${row.durationSeconds}s: ${row.voiceover}`);
  }
  lines.push("", "### Clips to generate");
  for (const scene of body.scenes) {
    lines.push("", `#### Scene ${scene.number} (${scene.timestamp})`, scene.prompt);
  }
  lines.push("", "### Reference images — not generated");
  for (const image of body.referenceImages) {
    lines.push("", `#### ${image.id}`, image.purpose, image.prompt, "Status: not generated. No image file exists.");
  }
  lines.push(
    "",
    `Assembly: ${body.assembly}`,
    `Avoid: ${body.negativePrompt}`,
    "",
    "## Facebook caption",
    body.caption,
    "",
    `Question: ${body.engagementQuestion}`,
    `CTA: ${body.cta}`,
  );
  return lines.join("\n");
}

function clipPrompt(page: PageIdentity, script: ReelScript, scene: ReelScript["scenes"][number], character: string): string {
  return [
    `Vertical 9:16 clip. Scene ${scene.number} of ${script.scenes.length}. Duration ${scene.durationSeconds} seconds. This is one shot, not the finished Reel.`,
    `Page: ${page.name}. Tone: ${page.tone}`,
    `Look: ${page.visual}`,
    `Character, keep identical in every scene: ${character}`,
    `Environment: ${scene.environment}`,
    `Show: ${scene.visual}`,
    `Camera: ${scene.camera}`,
    `Lighting: ${scene.lighting}`,
    `Motion: ${scene.motion}`,
    `Continuity: ${scene.continuity}`,
    `Voiceover for this clip: ${scene.voiceover}`,
    `On-screen text: ${scene.onScreenText || "None."}`,
    `Subtitle: ${scene.subtitle}`,
    `Avoid: ${NEGATIVE_PROMPT}`,
    "No watermark. No affiliate offer. No claim that this person is a real customer or is waiting on a dating site.",
  ].join("\n");
}

function operatorChecklist(contentId: string, sceneCount: number): string[] {
  return [
    "Open the Muse website yourself. This screen does not send anything to Muse.",
    `Generate ${sceneCount} separate vertical clips. Copy one scene prompt at a time. Do not rewrite it.`,
    "Set each clip to 9:16. Use the duration written on that scene.",
    "Paste the same character description into every clip. Do not attach a reference image unless you have made one from the prompt marked not generated.",
    `Save the files as ${contentId}-scene-1.mp4 and the following scene numbers.`,
    "Do not post the clips to Facebook from this page. Publishing in this OS stays off.",
    "Bring the saved files back to the owner. The existing finishing tool does not join Muse clips yet.",
  ];
}

function stamp(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const SCORE_KEYS = new Set(["score"]);
const NUMERIC_KEYS = new Set(["number", "durationSeconds", "rank", "sourceIndex"]);

export function prepareModelObject(value: unknown): unknown {
  const unwrapped = unwrapModelObject(value);
  return coerceModelValue(normaliseResearchShape(unwrapped));
}

function numberedObjectToArray(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 0 || !keys.every((key) => /^\d+$/.test(key))) return value;
  return keys.sort((left, right) => Number(left) - Number(right)).map((key) => record[key]);
}

function textField(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function normaliseResearchShape(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = { ...(value as Record<string, unknown>) };
  if ("confirmed" in record) {
    const items = numberedObjectToArray(record.confirmed);
    if (Array.isArray(items)) {
      record.confirmed = items.map((item, index) => {
        if (typeof item === "string") return { sourceIndex: index, statement: item };
        if (!item || typeof item !== "object") return item;
        const row = item as Record<string, unknown>;
        const statement = textField(row.statement) ?? textField(row.summary) ?? textField(row.text);
        return { sourceIndex: row.sourceIndex ?? index, statement: statement ?? row.statement };
      });
      if (Array.isArray(record.confirmed) && record.confirmed.length > 8) record.confirmed = record.confirmed.slice(0, 8);
    }
  }
  for (const key of ["interpretation", "notEstablished"] as const) {
    if (!(key in record)) continue;
    const items = numberedObjectToArray(record[key]);
    if (typeof record[key] === "string") record[key] = [record[key]];
    else if (Array.isArray(items)) {
      record[key] = items.map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return item;
        const row = item as Record<string, unknown>;
        return textField(row.summary) ?? textField(row.statement) ?? textField(row.text) ?? Object.values(row).find((entry) => typeof entry === "string") ?? item;
      });
    }
  }
  if (Array.isArray(record.interpretation) && record.interpretation.length > 6) record.interpretation = record.interpretation.slice(0, 6);
  if (Array.isArray(record.notEstablished) && record.notEstablished.length > 6) record.notEstablished = record.notEstablished.slice(0, 6);
  if (Array.isArray(record.candidates) && record.candidates.length > 4) record.candidates = record.candidates.slice(0, 4);
  for (const key of ["scenes", "referenceImages", "evidenceUsed"] as const) {
    if (key in record) {
      const items = numberedObjectToArray(record[key]);
      if (Array.isArray(items)) record[key] = items;
    }
  }
  if (Array.isArray(record.referenceImages)) {
    record.referenceImages = record.referenceImages.map((image) => {
      if (!image || typeof image !== "object") return image;
      const row = { ...(image as Record<string, unknown>) };
      if (row.generated === undefined) row.generated = false;
      return row;
    });
  }
  if (Array.isArray(record.scenes)) {
    const scenes = record.scenes.map((scene, index) => {
      if (!scene || typeof scene !== "object") return scene;
      const row = { ...(scene as Record<string, unknown>) };
      if (row.number === undefined) row.number = index + 1;
      const character = textField(row.character) ?? "";
      const continuity = textField(row.continuity) ?? "";
      if (character.length < 12 && continuity.length >= 12) row.character = `${character ? `${character}. ` : ""}${continuity}`.slice(0, 400);
      return row;
    });
    record.scenes = scenes;
    const narration = scenes
      .map((scene) => (scene && typeof scene === "object" ? textField((scene as Record<string, unknown>).voiceover) : null))
      .filter((line): line is string => Boolean(line))
      .join(" ");
    if ((typeof record.voiceover !== "string" || record.voiceover.trim().length < 40) && narration.length >= 40) {
      record.voiceover = narration;
    }
    const title = textField(record.title);
    if ((typeof record.topic !== "string" || record.topic.trim().length < 8) && title && title.length >= 8) record.topic = title;
    if (typeof record.uncertainty !== "string" || record.uncertainty.trim().length < 12) {
      const marked = textField(record.uncertainty) ?? "unspecified";
      record.uncertainty = `The model marked uncertainty as ${marked} and did not explain it further.`;
    }
    if (!Array.isArray(record.referenceImages) || record.referenceImages.length === 0) {
      const first = scenes.find((scene) => scene && typeof scene === "object") as Record<string, unknown> | undefined;
      const prompt = [
        "Vertical 9:16 still.",
        textField(first?.character),
        textField(first?.environment),
        textField(first?.visual),
        "No text, no logo, no captions.",
      ].filter(Boolean).join(" ");
      if (prompt.length >= 20) {
        record.referenceImages = [{
          id: "scene-reference",
          purpose: "Optional continuity still. This image has not been generated.",
          prompt,
          generated: false,
        }];
      }
    }
  }
  if (Array.isArray(record.candidates)) {
    record.candidates = record.candidates.map((candidate) => {
      if (!candidate || typeof candidate !== "object") return candidate;
      const row = { ...(candidate as Record<string, unknown>) };
      if (typeof row.uncertainty === "string" && row.uncertainty.trim().length < 12) {
        row.uncertainty = `The model marked uncertainty as ${row.uncertainty.trim()} and did not explain it further.`;
      }
      if (row.evidenceStrength && typeof row.evidenceStrength === "object") {
        const strength = { ...(row.evidenceStrength as Record<string, unknown>) };
        if (typeof strength.reason !== "string") strength.reason = "The reply cited source indexes and did not add a separate evidence-strength reason.";
        if (typeof strength.score !== "string") strength.score = "medium";
        row.evidenceStrength = strength;
      }
      return row;
    });
  }
  return record;
}

function unwrapModelObject(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if ("candidates" in record || "scenes" in record) return value;
  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const child = nested as Record<string, unknown>;
      if ("candidates" in child || "scenes" in child) return nested;
    }
  }
  return value;
}

function coerceModelValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => coerceModelValue(item));
  if (!value || typeof value !== "object") return value;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (SCORE_KEYS.has(key) && typeof item === "string") next[key] = item.trim().toLowerCase();
    else if (key === "generated" && (item === "false" || item === false)) next[key] = false;
    else if (NUMERIC_KEYS.has(key) && typeof item === "string" && /^\d+$/.test(item.trim())) next[key] = Number(item.trim());
    else if (key === "sourceIndexes" && Array.isArray(item)) {
      next[key] = item.map((entry) => (typeof entry === "string" && /^\d+$/.test(entry.trim()) ? Number(entry.trim()) : entry));
    } else next[key] = coerceModelValue(item);
  }
  return next;
}

export const EVALUATION_SYSTEM = [
  "You evaluate only the numbered sources in the user message.",
  "You have not searched the web. Do not claim that you did.",
  "Do not invent posts, usernames, quotations, upvotes, views, shares, or dates.",
  "confirmed statements restate only what a numbered source says, with that sourceIndex.",
  "sourceIndex and sourceIndexes may use only the SOURCE numbers printed in the user message. Those numbers start at 0. Do not cite any other number.",
  "interpretation is your reading and is not a fact from the source.",
  "notEstablished lists things the sources do not prove, including audience size and virality.",
  "candidates are original fictional Reel ideas for the named Facebook Page. They are not testimonials and not real people.",
  "Give two to four candidates. Rank 1 is the strongest for this Page. Scores are low, medium, or high, each with a reason. They are not probabilities.",
  "repetition.score is unknown when you cannot tell. Do not copy an existing planned hook.",
  "Do not use quotation marks unless the words appear exactly in a source.",
  "Reply with one JSON object and no markdown.",
  "Keys: confirmed, interpretation, notEstablished, candidates.",
  "Each candidate keys: id (c1, c2, c3, or c4), title, audience, insight, relevance, evidenceStrength, emotionalOrPractical, reelPotential, discussionMotivation, pageAlignment, repetition, uncertainty, rank.",
  "relevance, emotionalOrPractical, reelPotential, discussionMotivation, and pageAlignment are objects with score and reason.",
  "evidenceStrength also has sourceIndexes, an array of source numbers starting at 0.",
  "repetition has score (low, medium, high, or unknown) and reason.",
].join(" ");

export const SCRIPT_SYSTEM = [
  "Write one original fictional vertical Reel for the approved concept.",
  "Use only the saved sources as background. Do not add statistics, quotations, or URLs.",
  "British English. No American spelling. No affiliate offer, price, or tracking link.",
  "The characters are fictional. Do not present them as real customers or real community members.",
  "Use 4 to 6 scenes. durationSeconds is an integer from 3 to 12. The sum must be from 20 to 35 inclusive.",
  "The first scene carries the hook and lasts long enough to read it.",
  "Keep one character, one wardrobe, and one setting unless a scene names a move to a new place.",
  "referenceImages.generated must be false. These are instructions for a later image, not a finished file.",
  "evidenceUsed lists only the SOURCE numbers printed in the user message. Those numbers start at 0.",
  "Do not use quotation marks.",
  "Reply with one JSON object and no markdown.",
  "Keys: title, audience, topic, insight, hook, script, voiceover, caption, engagementQuestion, cta, scenes, referenceImages, uncertainty, evidenceUsed.",
  "Each scene keys: number, durationSeconds, voiceover, onScreenText, subtitle, visual, camera, lighting, environment, motion, continuity, character.",
  "The caption is the Facebook caption. End it with the engagement question. Do not add a link.",
].join(" ");
