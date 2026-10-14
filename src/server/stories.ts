import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSql } from "@/db/client";
import { episodePackage, type PilotBody } from "@/domain/stories";
import { languagePublicStatus, researchPublicStatus } from "@/domain/intelligence";
import { mediaRoot } from "@/server/muse";
import { runPilot } from "@/server/pilot-run";
import { readControls, storeFailedReport } from "@/server/intelligence";

function jsonbText(sql: ReturnType<typeof getSql>, value: unknown) {
  return (sql as ReturnType<typeof getSql> & { typed: (text: string, type: number) => unknown }).typed(JSON.stringify(value), 25);
}

export async function listSeries() {
  const sql = getSql();
  const series = await sql<{
    id: string;
    title: string;
    approval: string;
    model: string | null;
    live_research: boolean;
    bible: PilotBody;
    created_at: Date | string;
  }[]>`
    select id, title, approval, model, live_research, bible, created_at
    from story_series
    order by created_at desc
  `;
  const episodes = await sql<{
    id: string;
    series_id: string;
    episode_number: number;
    title: string;
    body: PilotBody["episodes"][number];
    muse_package: ReturnType<typeof episodePackage>;
  }[]>`
    select id, series_id, episode_number, title, body, muse_package
    from story_episodes
    order by episode_number
  `;
  const clips = await sql<{ id: string; episode_id: string; scene_number: number; original_filename: string; bytes: number; assembled: boolean }[]>`
    select id, episode_id, scene_number, original_filename, bytes, assembled from story_clips order by scene_number
  `;
  return series.map((item) => ({
    ...item,
    created_at: item.created_at instanceof Date ? item.created_at.toISOString() : new Date(item.created_at).toISOString(),
    episodes: episodes
      .filter((episode) => episode.series_id === item.id)
      .map((episode) => ({
        ...episode,
        clips: clips.filter((clip) => clip.episode_id === episode.id),
      })),
  }));
}

export async function generatePilot(fetchImpl: typeof fetch = fetch) {
  const controls = await readControls();
  if (controls.intelligence !== "STARTED") {
    return { ok: false as const, status: 409, error: "The AI intelligence engine is paused." };
  }
  const language = languagePublicStatus();
  if (!language.configured) {
    return { ok: false as const, status: 409, error: `No language model is configured. Missing ${language.missing.join(", ")}.` };
  }
  const research = researchPublicStatus();
  const pilot = await runPilot(fetchImpl);
  if (!pilot.ok) {
    await storeFailedReport("romance-pilot", pilot.model, `${pilot.stage}: ${pilot.error}`);
    const providerLabel = language.provider === "novita" ? "Novita" : "FreeLLMAPI";
    const transport = pilot.error.includes("could not be reached") || pilot.error.includes("without a usable reply");
    return {
      ok: false as const,
      status: 502,
      error: transport ? pilot.error : `${providerLabel} replied, but the ${pilot.stage} was incomplete. Nothing was saved as a series.`,
    };
  }
  const story = pilot.story;
  const sql = getSql();
  const reportId = randomUUID();
  const seriesId = randomUUID();
  const body = {
    ...story,
    publishing: "disabled",
    liveResearch: false,
    researchMessage: research.message,
    usage: pilot.usage,
    source: pilot.provider,
    modelsByStage: pilot.modelsByStage,
    finishReasons: pilot.finishReasons,
  };
  await sql`
    insert into intelligence_reports (id, kind, status, model, live_research, body)
    values (${reportId}, 'romance-pilot', 'COMPLETE', ${pilot.model}, false, ${jsonbText(sql, body)}::jsonb)
  `;
  await sql`
    insert into story_series (id, report_id, title, model, live_research, bible)
    values (${seriesId}, ${reportId}, ${story.seriesTitle}, ${pilot.model}, false, ${jsonbText(sql, body)}::jsonb)
  `;
  for (const episode of story.episodes) {
    const pack = episodePackage(story, episode);
    await sql`
      insert into story_episodes (id, series_id, episode_number, title, body, muse_package)
      values (
        ${randomUUID()},
        ${seriesId},
        ${episode.number},
        ${episode.title},
        ${jsonbText(sql, episode)}::jsonb,
        ${jsonbText(sql, pack)}::jsonb
      )
    `;
  }
  return { ok: true as const, seriesId };
}

export async function approveSeries(seriesId: string) {
  const sql = getSql();
  const [row] = await sql<{ id: string }[]>`select id from story_series where id = ${seriesId}`;
  if (!row) return { ok: false as const, status: 404, error: "That series was not found." };
  await sql`update story_series set approval = 'APPROVED' where id = ${seriesId}`;
  const [campaign] = await sql<{ status: string; not_started: boolean }[]>`
    select status, started_at is null as not_started from campaigns where id = 'uk-month-one'
  `;
  return { ok: true as const, campaign };
}

const CLIP_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export async function saveStoryClip(input: {
  episodeId: string;
  sceneNumber: number;
  bytes: Buffer;
  filename: string;
}) {
  if (input.bytes.length === 0 || input.bytes.length > 40 * 1024 * 1024) {
    return { ok: false as const, status: 400, error: "The clip must be under 40 MB." };
  }
  const extension = path.extname(input.filename).replace(".", "").toLowerCase();
  const type = CLIP_TYPES[extension];
  if (!type) return { ok: false as const, status: 400, error: "Upload an mp4, webm, or mov file." };
  const sql = getSql();
  const [episode] = await sql<{ id: string }[]>`select id from story_episodes where id = ${input.episodeId}`;
  if (!episode) return { ok: false as const, status: 404, error: "That episode was not found." };
  const id = randomUUID();
  const relative = path.join("story-clips", `${id}.${extension}`);
  const root = path.resolve(/*turbopackIgnore: true*/ mediaRoot());
  const absolute = path.resolve(/*turbopackIgnore: true*/ root, relative);
  if (!absolute.startsWith(`${root}${path.sep}`)) return { ok: false as const, status: 400, error: "The file path was rejected." };
  await mkdir(/*turbopackIgnore: true*/ path.dirname(absolute), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ absolute, input.bytes);
  await sql`
    insert into story_clips (id, episode_id, scene_number, storage_path, original_filename, content_type, bytes, assembled)
    values (${id}, ${input.episodeId}, ${input.sceneNumber}, ${relative}, ${path.basename(input.filename).slice(0, 180)}, ${type}, ${input.bytes.length}, false)
  `;
  return { ok: true as const, id, storagePath: relative, assembled: false };
}
