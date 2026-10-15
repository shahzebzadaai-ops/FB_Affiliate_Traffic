import { randomUUID } from "node:crypto";
import { getSql } from "@/db/client";
import { languagePublicStatus } from "@/domain/intelligence";
import { pageByCode } from "@/domain/pages";
import {
  CONTENT_ID_PATTERN,
  EVALUATION_SYSTEM,
  RESEARCH_PAGE_CODE,
  SCRIPT_SYSTEM,
  alignEvaluationSources,
  alignScriptSources,
  buildResearchHandoff,
  groundEvaluation,
  groundScript,
  handoffMarkdown,
  prepareModelObject,
  reelScriptSchema,
  researchEvaluationSchema,
  researchSourceSchema,
  type ResearchEvaluation,
  type ResearchHandoff,
  type ResearchSource,
  type ReelScript,
} from "@/domain/research-package";
import { readControls } from "@/server/intelligence";
import { languageChat } from "@/server/language";
import { parseModelJson } from "@/server/novita";
import { writeAudit } from "@/server/accounts";
import type { ZodType } from "zod";

type Failure = { ok: false; status: number; error: string };
type Usage = { promptTokens: number; completionTokens: number };

function jsonbText(sql: ReturnType<typeof getSql>, value: unknown) {
  return (sql as ReturnType<typeof getSql> & { typed: (text: string, type: number) => unknown }).typed(JSON.stringify(value), 25);
}

type PackageRow = {
  id: string;
  content_id: string;
  page_code: string;
  status: "EVIDENCE" | "CANDIDATES" | "APPROVED" | "PACKAGE_READY";
  evidence: ResearchSource[];
  evaluation: ResearchEvaluation | null;
  approved_candidate_id: string | null;
  script: ReelScript | null;
  muse_package: ResearchHandoff | null;
  model: string | null;
  usage: Usage | null;
  publishing: "disabled";
  created_at: Date | string;
  updated_at: Date | string;
};

function asIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function present(row: PackageRow) {
  return {
    ...row,
    created_at: asIso(row.created_at),
    updated_at: asIso(row.updated_at),
    publishing: "disabled" as const,
    markdown: row.muse_package ? handoffMarkdown(row.muse_package) : null,
  };
}

async function requireLanguage() {
  const controls = await readControls();
  if (controls.intelligence !== "STARTED") {
    return { ok: false as const, status: 409, error: "The AI intelligence engine is paused. Starting it does not publish and does not start the 30-day clock." };
  }
  const language = languagePublicStatus();
  if (!language.configured) {
    return { ok: false as const, status: 409, error: `No language model is configured. Missing ${language.missing.join(", ")}.` };
  }
  return { ok: true as const, provider: language.provider };
}

export async function listResearchPackages() {
  const rows = await getSql()<PackageRow[]>`
    select id, content_id, page_code, status, evidence, evaluation, approved_candidate_id, script, muse_package, model, usage, publishing, created_at, updated_at
    from research_packages
    order by created_at desc
  `;
  return rows.map((row) => ({
    contentId: row.content_id,
    status: row.status,
    publishing: "disabled" as const,
    theme: row.evidence[0]?.theme ?? "",
    title: row.muse_package?.title ?? row.evaluation?.candidates.find((item) => item.id === row.approved_candidate_id)?.title ?? null,
    createdAt: asIso(row.created_at),
  }));
}

export async function readResearchPackage(contentId: string) {
  if (!CONTENT_ID_PATTERN.test(contentId)) return null;
  const [row] = await getSql()<PackageRow[]>`
    select id, content_id, page_code, status, evidence, evaluation, approved_candidate_id, script, muse_package, model, usage, publishing, created_at, updated_at
    from research_packages
    where content_id = ${contentId}
  `;
  return row ? present(row) : null;
}

export async function createResearchPackage(userId: string, sources: unknown): Promise<{ ok: true; contentId: string } | Failure> {
  const parsed = researchSourceSchema.array().min(1).max(4).safeParse(sources);
  if (!parsed.success) return { ok: false, status: 400, error: "Add one to four https sources, each with a theme and the evidence you actually read." };
  const sql = getSql();
  const id = randomUUID();
  const contentId = await sql.begin(async (tx) => {
    const [latest] = await tx<{ content_id: string }[]>`
      select content_id from research_packages order by content_id desc limit 1 for update
    `;
    const next = latest ? Number(latest.content_id.slice(-3)) + 1 : 1;
    if (next > 999) throw new Error("The research content IDs are full.");
    const allocated = `RI-BGUK-${String(next).padStart(3, "0")}`;
    await tx`
      insert into research_packages (id, content_id, page_code, status, evidence, publishing, created_by)
      values (${id}, ${allocated}, ${RESEARCH_PAGE_CODE}, 'EVIDENCE', ${jsonbText(sql, parsed.data)}::jsonb, 'disabled', ${userId})
    `;
    return allocated;
  });
  await writeAudit(userId, "CREATE_RESEARCH_PACKAGE", "research_package", contentId, { sources: parsed.data.length, publishing: "disabled" });
  return { ok: true, contentId };
}

export async function evaluateResearchPackage(userId: string, contentId: string, fetchImpl: typeof fetch = fetch) {
  const row = await readResearchPackage(contentId);
  if (!row) return { ok: false as const, status: 404, error: "That research package was not found." };
  if (row.status !== "EVIDENCE" && row.status !== "CANDIDATES") {
    return { ok: false as const, status: 409, error: "Topics can be suggested only before a topic is approved." };
  }
  const gate = await requireLanguage();
  if (!gate.ok) return gate;
  const page = pageByCode(RESEARCH_PAGE_CODE);
  const hooks = await getSql()<{ hook: string }[]>`
    select record->>'hook' as hook from content_items where page_code = ${RESEARCH_PAGE_CODE} order by content_id limit 8
  `;
  const user = [
    `Page: ${page.name}. Audience: ${page.persona} Age range: ${page.ageRange}. United Kingdom.`,
    `Tone: ${page.tone}`,
    `Editorial identity: ${page.visual}`,
    "Existing planned hooks, for repetition only. Do not copy them:",
    ...hooks.map((hook) => `- ${hook.hook}`),
    "",
    ...row.evidence.map((source, index) => [
      `SOURCE ${index}`,
      `URL: ${source.url}`,
      `Date: ${source.sourceDate ?? "unknown"}`,
      `Theme: ${source.theme}`,
      `Evidence: ${source.evidence}`,
      source.notes ? `Notes: ${source.notes}` : "",
    ].filter(Boolean).join("\n")),
  ].join("\n");
  const completed = await completeJson(EVALUATION_SYSTEM, user, researchEvaluationSchema, (value) => {
    const aligned = alignEvaluationSources(value, row.evidence.length);
    value.confirmed = aligned.confirmed;
    value.candidates = aligned.candidates;
    if (value.confirmed.length < 2) return "Not enough confirmed statements stayed attached to the saved sources.";
    if (value.candidates.length < 2) return "Not enough topics stayed attached to the saved sources.";
    return groundEvaluation(value, row.evidence);
  }, 2200, fetchImpl);
  if (!completed.ok) return { ok: false as const, status: completed.status, error: completed.error };
  const sql = getSql();
  await sql`
    update research_packages
    set status = 'CANDIDATES',
        evaluation = ${jsonbText(sql, completed.data)}::jsonb,
        model = ${completed.model},
        usage = ${jsonbText(sql, completed.usage)}::jsonb,
        updated_at = now()
    where content_id = ${contentId} and status in ('EVIDENCE', 'CANDIDATES')
  `;
  await writeAudit(userId, "EVALUATE_RESEARCH_PACKAGE", "research_package", contentId, {
    model: completed.model,
    candidates: completed.data.candidates.length,
    publishing: "disabled",
  });
  return { ok: true as const, contentId };
}

export async function approveResearchCandidate(userId: string, contentId: string, candidateId: string) {
  const row = await readResearchPackage(contentId);
  if (!row) return { ok: false as const, status: 404, error: "That research package was not found." };
  if (row.status !== "CANDIDATES" || !row.evaluation) {
    return { ok: false as const, status: 409, error: "Suggest topics before approving one." };
  }
  if (!row.evaluation.candidates.some((candidate) => candidate.id === candidateId)) {
    return { ok: false as const, status: 400, error: "That topic is not in this package." };
  }
  await getSql()`
    update research_packages
    set status = 'APPROVED', approved_candidate_id = ${candidateId}, updated_at = now()
    where content_id = ${contentId} and status = 'CANDIDATES'
  `;
  await writeAudit(userId, "APPROVE_RESEARCH_TOPIC", "research_package", contentId, { candidateId, publishing: "disabled" });
  return { ok: true as const, contentId };
}

export async function generateResearchPackage(userId: string, contentId: string, fetchImpl: typeof fetch = fetch) {
  const row = await readResearchPackage(contentId);
  if (!row) return { ok: false as const, status: 404, error: "That research package was not found." };
  if (row.status !== "APPROVED" || !row.evaluation || !row.approved_candidate_id) {
    return { ok: false as const, status: 409, error: "Approve one topic before writing the Muse instructions." };
  }
  const gate = await requireLanguage();
  if (!gate.ok) return gate;
  const candidate = row.evaluation.candidates.find((item) => item.id === row.approved_candidate_id);
  if (!candidate) return { ok: false as const, status: 409, error: "The approved topic is missing." };
  const page = pageByCode(RESEARCH_PAGE_CODE);
  const user = [
    `Content ID: ${contentId}`,
    `Page: ${page.name}. ${page.persona} Age range: ${page.ageRange}.`,
    `Tone: ${page.tone}`,
    `Visual: ${page.visual}`,
    `Approved topic ${candidate.id}: ${candidate.title}`,
    `Insight: ${candidate.insight}`,
    `Uncertainty already recorded: ${candidate.uncertainty}`,
    "",
    ...row.evidence.map((source, index) => `SOURCE ${index} (${source.sourceDate ?? "date unknown"}) ${source.url}\n${source.evidence}`),
  ].join("\n");
  const completed = await completeJson(SCRIPT_SYSTEM, user, reelScriptSchema, (value) => {
    const aligned = alignScriptSources(value, row.evidence.length);
    value.evidenceUsed = aligned.evidenceUsed;
    if (value.evidenceUsed.length === 0) return "The script did not stay attached to the saved sources.";
    return groundScript(value, row.evidence);
  }, 2800, fetchImpl);
  if (!completed.ok) return { ok: false as const, status: completed.status, error: completed.error };
  let handoff: ResearchHandoff;
  try {
    handoff = buildResearchHandoff({
      contentId,
      page,
      sources: row.evidence,
      evaluation: row.evaluation,
      candidateId: row.approved_candidate_id,
      script: completed.data,
      model: completed.model,
    });
  } catch (error) {
    return { ok: false as const, status: 502, error: error instanceof Error ? error.message : "The Muse package could not be assembled." };
  }
  const sql = getSql();
  const usage = addUsage(row.usage, completed.usage);
  await sql`
    update research_packages
    set status = 'PACKAGE_READY',
        script = ${jsonbText(sql, completed.data)}::jsonb,
        muse_package = ${jsonbText(sql, handoff)}::jsonb,
        model = ${completed.model},
        usage = ${jsonbText(sql, usage)}::jsonb,
        publishing = 'disabled',
        updated_at = now()
    where content_id = ${contentId} and status = 'APPROVED'
  `;
  await writeAudit(userId, "GENERATE_RESEARCH_PACKAGE", "research_package", contentId, {
    model: completed.model,
    publishing: "disabled",
    scenes: handoff.scenes.length,
  });
  return { ok: true as const, contentId };
}

async function completeJson<T>(
  system: string,
  user: string,
  schema: ZodType<T>,
  ground: (value: T) => string | null,
  maxTokens: number,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; data: T; model: string; usage: Usage | null } | { ok: false; status: number; error: string }> {
  let attemptUser = user;
  let lastError = "The language model reply could not be used.";
  let model: string | null = null;
  const total: Usage = { promptTokens: 0, completionTokens: 0 };
  let counted = false;
  const primary = languagePublicStatus().model;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const chat = await languageChat({
      system,
      user: attemptUser,
      maxTokens,
      reasoningEffort: "low",
      ...(attempt === 0 && primary ? { models: [primary] } : {}),
    }, fetchImpl);
    model = chat.model;
    if (chat.usage?.promptTokens) {
      total.promptTokens += chat.usage.promptTokens;
      counted = true;
    }
    if (chat.usage?.completionTokens) {
      total.completionTokens += chat.usage.completionTokens;
      counted = true;
    }
    if (!chat.ok) {
      lastError = chat.error;
      continue;
    }
    if (chat.truncated) {
      lastError = "The language model reply was cut off. Nothing was saved as ready.";
      attemptUser = `${user}\n\nThe previous reply was cut off. Reply with one complete JSON object only.`;
      continue;
    }
    let parsed: unknown;
    try {
      parsed = prepareModelObject(parseModelJson(chat.text));
    } catch {
      lastError = "The language model replied, but it was not usable JSON. Nothing was saved as ready.";
      attemptUser = `${user}\n\nThe previous reply was not JSON. Reply with one JSON object only.`;
      continue;
    }
    const checked = schema.safeParse(parsed);
    if (!checked.success) {
      const detail = checked.error.issues.slice(0, 6).map((issue) => `${issue.path.map(String).join(".") || "body"}: ${issue.message}`).join("; ");
      lastError = `The language model reply was missing required fields (${detail}). Nothing was saved as ready.`;
      attemptUser = `${user}\n\nThe previous reply failed validation: ${detail}. Include every required field. Reply with one JSON object only.`;
      continue;
    }
    const grounded = ground(checked.data);
    if (grounded) {
      lastError = grounded;
      attemptUser = `${user}\n\nThe previous reply was rejected: ${grounded} Use only the saved sources. Reply with one JSON object only.`;
      continue;
    }
    return { ok: true, data: checked.data, model: chat.model, usage: counted ? total : null };
  }
  return { ok: false, status: 502, error: model ? `${lastError} Model: ${model}.` : lastError };
}

function addUsage(existing: Usage | null, added: Usage | null): Usage | null {
  if (!existing && !added) return null;
  return {
    promptTokens: (existing?.promptTokens ?? 0) + (added?.promptTokens ?? 0),
    completionTokens: (existing?.completionTokens ?? 0) + (added?.completionTokens ?? 0),
  };
}
