import { randomUUID } from "node:crypto";
import { getSql } from "@/db/client";
import {
  SUPPLIED_EVIDENCE_SYSTEM,
  editingPublicStatus,
  freellmapiPublicStatus,
  languagePublicStatus,
  novitaPublicStatus,
  researchPublicStatus,
  storagePublicStatus,
  suppliedEvidenceSchema,
  type EngineId,
} from "@/domain/intelligence";
import { languageChat } from "@/server/language";
import { parseModelJson } from "@/server/novita";
import { monetisationAdvice, partnerProgressReport, seriesLaunchAdvice } from "@/domain/stories";
import { can } from "@/domain/permissions";
import { PAGE_IDENTITIES } from "@/domain/pages";
import { getCurrentUser } from "@/server/current-user";

const SWITCHABLE = new Set<EngineId>(["intelligence", "creative", "video_editing"]);

export async function requirePlanner() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in required." };
  if (!can(user.role, "manage_plan")) return { ok: false as const, status: 403, error: "Plan access is required." };
  return { ok: true as const, user };
}

function jsonbText(sql: ReturnType<typeof getSql>, value: unknown) {
  return (sql as ReturnType<typeof getSql> & { typed: (text: string, type: number) => unknown }).typed(JSON.stringify(value), 25);
}

export async function readControls() {
  const sql = getSql();
  const rows = await sql<{ id: EngineId; state: string }[]>`select id, state from operating_controls order by id`;
  const controls = { intelligence: "PAUSED", creative: "PAUSED", video_editing: "PAUSED", publishing: "OFF" };
  for (const row of rows) {
    if (row.id in controls) controls[row.id] = row.state;
  }
  return controls;
}

export async function setEngine(id: EngineId, state: "PAUSED" | "STARTED") {
  if (!SWITCHABLE.has(id)) {
    return { ok: false as const, status: 409, error: "Publishing stays off. Starting an engine does not publish." };
  }
  const sql = getSql();
  await sql`
    update operating_controls
    set state = ${state}, updated_at = now()
    where id = ${id}
  `;
  return { ok: true as const, controls: await readControls() };
}

export async function intelligenceOverview() {
  const sql = getSql();
  const controls = await readControls();
  const [campaign] = await sql<{ status: string; not_started: boolean }[]>`
    select status, started_at is null as not_started from campaigns where id = 'uk-month-one'
  `;
  const [published] = await sql<{ n: number }[]>`
    select count(*)::int as n from content_items where publication_status = 'PUBLISHED'
  `;
  const [seriesCount] = await sql<{ n: number }[]>`select count(*)::int as n from story_series`;
  const [episodes] = await sql<{ n: number }[]>`select count(*)::int as n from story_episodes`;
  const reports = await sql<{ id: string; kind: string; status: string; model: string | null; live_research: boolean; created_at: Date | string }[]>`
    select id, kind, status, model, live_research, created_at
    from intelligence_reports
    order by created_at desc
    limit 8
  `;
  return {
    language: languagePublicStatus(),
    freellmapi: freellmapiPublicStatus(),
    novita: novitaPublicStatus(),
    research: researchPublicStatus(),
    storage: storagePublicStatus(),
    editing: { ...editingPublicStatus(), videoEditingControl: controls.video_editing },
    controls,
    campaign: { status: campaign?.status ?? "missing", notStarted: Boolean(campaign?.not_started) },
    brands: PAGE_IDENTITIES.map((page) => ({
      code: page.code,
      name: page.name,
      status: "candidate" as const,
      note: "Existing plan candidate. Not an approved final Facebook or domain name.",
    })),
    opportunities: [],
    opportunityNote: "No ranked opportunities. Live research is unavailable, so no interest score is shown.",
    launch: seriesLaunchAdvice({
      completedEpisodes: Number(episodes?.n ?? 0),
      measuredDays: null,
      hasPerformance: false,
      pageActive: null,
    }),
    monetisation: monetisationAdvice(),
    partnerReport: partnerProgressReport({
      seriesCount: Number(seriesCount?.n ?? 0),
      publishedVideos: Number(published?.n ?? 0),
    }),
    reports: reports.map((report) => ({
      ...report,
      created_at: report.created_at instanceof Date ? report.created_at.toISOString() : new Date(report.created_at).toISOString(),
    })),
  };
}

export async function analyseSuppliedEvidence(evidence: string, fetchImpl: typeof fetch = fetch) {
  const controls = await readControls();
  if (controls.intelligence !== "STARTED") {
    return { ok: false as const, status: 409, error: "The AI intelligence engine is paused." };
  }
  const language = languagePublicStatus();
  if (!language.configured) {
    return { ok: false as const, status: 409, error: `No language model is configured. Missing ${language.missing.join(", ")}.` };
  }
  const chat = await languageChat({ system: SUPPLIED_EVIDENCE_SYSTEM, user: evidence }, fetchImpl);
  if (!chat.ok) {
    await storeFailedReport("supplied-evidence", chat.model, chat.error);
    return { ok: false as const, status: 502, error: chat.error };
  }
  let parsed: unknown;
  try {
    parsed = parseModelJson(chat.text);
  } catch {
    await storeFailedReport("supplied-evidence", chat.model, "The model reply was not JSON.");
    return { ok: false as const, status: 502, error: "The language model replied, but the analysis was not usable. Nothing was saved." };
  }
  const analysis = suppliedEvidenceSchema.safeParse(parsed);
  if (!analysis.success) {
    await storeFailedReport("supplied-evidence", chat.model, "The model reply did not match the evidence schema.");
    return { ok: false as const, status: 502, error: "The language model replied, but the analysis was incomplete. Nothing was saved." };
  }
  const sql = getSql();
  const id = randomUUID();
  const body = {
    ...analysis.data,
    publishing: "disabled",
    liveResearch: false,
    webSearchPerformed: false,
    source: chat.provider,
    usage: chat.usage,
    evidenceNote: "The model saw only the supplied text. It did not search the web.",
  };
  await sql`
    insert into intelligence_reports (id, kind, status, model, live_research, body)
    values (${id}, 'supplied-evidence', 'COMPLETE', ${chat.model}, false, ${jsonbText(sql, body)}::jsonb)
  `;
  return { ok: true as const, reportId: id, model: chat.model, provider: chat.provider, analysis: body };
}

export async function storeFailedReport(kind: string, model: string | null, error: string) {
  const sql = getSql();
  const id = randomUUID();
  await sql`
    insert into intelligence_reports (id, kind, status, model, live_research, body)
    values (${id}, ${kind}, 'FAILED', ${model}, false, ${jsonbText(sql, { error, publishing: "disabled" })}::jsonb)
  `;
  return id;
}
