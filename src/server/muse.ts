import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pageByCode } from "@/domain/pages";
import {
  CAMPAIGN_ID,
  MUSE_PROVIDER_ID,
  type MusePackageBody,
  type MusePresetId,
  type MuseStage,
  prepareMusePackage,
  presetById,
  safeExtension,
  tokenSummary,
} from "@/domain/muse";
import { contentRecordSchema } from "@/domain/types";
import { can } from "@/domain/permissions";
import { getSql } from "@/db/client";
import { getCurrentUser } from "@/server/current-user";

type Planner = { id: string; role: string };

export async function requirePlanner(): Promise<{ ok: true; user: Planner } | { ok: false; status: number; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, error: "Sign in required." };
  if (!can(user.role, "manage_plan")) return { ok: false, status: 403, error: "Plan access is required to prepare Muse packages." };
  return { ok: true, user };
}

export function mediaRoot(): string {
  return process.env.AFFIGROVE_MEDIA_DIR || path.join(process.cwd(), "data", "media-library");
}

function insideMediaRoot(absolute: string): boolean {
  const root = path.resolve(/*turbopackIgnore: true*/ mediaRoot());
  return absolute === root || absolute.startsWith(`${root}${path.sep}`);
}

function asIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function jsonbText(sql: ReturnType<typeof getSql>, value: unknown) {
  // Send JSON as text. The server's jsonb binder rejects a plain object.
  return (sql as ReturnType<typeof getSql> & { typed: (text: string, type: number) => unknown }).typed(JSON.stringify(value), 25);
}

const FILE_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function museOverview() {
  const sql = getSql();
  const [provider] = await sql<{ id: string; name: string; provider_type: string; website_url: string | null; notes: string }[]>`
    select id, name, provider_type, website_url, notes from creative_providers where id = ${MUSE_PROVIDER_ID}
  `;
  const capabilities = await sql<{ capability: string; label: string; status: string }[]>`
    select capability, label, status from provider_capabilities where provider_id = ${MUSE_PROVIDER_ID} order by capability
  `;
  const packages = await sql<{ id: string; content_id: string; preset: string; stage: string; prompt_version: number; package: MusePackageBody }[]>`
    select id, content_id, preset, stage, prompt_version, package
    from creative_packages where provider_id = ${MUSE_PROVIDER_ID} and campaign_id = ${CAMPAIGN_ID}
    order by updated_at desc
  `;
  const assets = await sql<{
    id: string;
    package_id: string;
    content_id: string;
    offer_id: string | null;
    scene_number: number | null;
    prompt: string;
    prompt_version: number;
    content_type: string;
    aspect_ratio: string | null;
    duration_seconds: string | null;
    width: number | null;
    height: number | null;
    storage_path: string;
    approval_status: string;
    review_notes: string;
    original_filename: string;
    generated_on: Date | string;
    created_at: Date | string;
  }[]>`
    select id, package_id, content_id, offer_id, scene_number, prompt, prompt_version, content_type,
      aspect_ratio, duration_seconds::text, width, height, storage_path, approval_status, review_notes,
      original_filename, generated_on, created_at
    from creative_assets where provider_id = ${MUSE_PROVIDER_ID} and campaign_id = ${CAMPAIGN_ID}
    order by created_at desc
  `;
  const balances = await sql<{ recorded_balance: string; tokens_spent: string | null; recorded_at: Date | string; note: string }[]>`
    select recorded_balance::text, tokens_spent::text, recorded_at, note
    from provider_balances where provider_id = ${MUSE_PROVIDER_ID}
    order by recorded_at desc limit 12
  `;
  const events = await sql<{ kind: "FINISHED_VIDEO" | "FINISHED_IMAGE" | "REJECTED"; tokens_spent: string | null }[]>`
    select kind, tokens_spent::text from provider_usage_events where provider_id = ${MUSE_PROVIDER_ID}
  `;
  const summary = tokenSummary(
    balances.map((row) => ({
      recordedBalance: Number(row.recorded_balance),
      tokensSpent: row.tokens_spent === null ? null : Number(row.tokens_spent),
      recordedAt: asIso(row.recorded_at),
    })),
    events.map((row) => ({ kind: row.kind, tokensSpent: row.tokens_spent === null ? null : Number(row.tokens_spent) })),
  );
  const [campaign] = await sql<{ status: string; not_started: boolean }[]>`
    select status, started_at is null as not_started from campaigns where id = ${CAMPAIGN_ID}
  `;
  return { provider, capabilities, packages, assets, balances, summary, campaign: campaign ?? null };
}

export async function createPackages(contentId: string, presets: MusePresetId[]) {
  const sql = getSql();
  const [row] = await sql<{ record: unknown }[]>`select record from content_items where content_id = ${contentId}`;
  if (!row) return { ok: false as const, status: 404, error: "That content row is not in the campaign." };
  const parsed = contentRecordSchema.safeParse(row.record);
  if (!parsed.success) return { ok: false as const, status: 400, error: "The plan row could not be read." };
  const page = pageByCode(parsed.data.pageCode);
  const chosen = presets.filter((preset) => presetById(preset));
  if (chosen.length === 0) return { ok: false as const, status: 400, error: "Choose a creative preset." };
  const ids: string[] = [];
  for (const preset of chosen) {
    const id = randomUUID();
    const body = prepareMusePackage(parsed.data, page, preset);
    await sql`
      insert into creative_packages (id, campaign_id, content_id, provider_id, preset, stage, prompt_version, package)
      values (${id}, ${CAMPAIGN_ID}, ${contentId}, ${MUSE_PROVIDER_ID}, ${preset}, 'PROMPTS_READY', 1, ${jsonbText(sql, body)}::jsonb)
    `;
    ids.push(id);
  }
  return { ok: true as const, ids };
}

export async function updatePackage(id: string, input: { stage?: MuseStage; package?: MusePackageBody; bump?: boolean }) {
  const sql = getSql();
  const [existing] = await sql<{ id: string; prompt_version: number }[]>`
    select id, prompt_version from creative_packages where id = ${id} and provider_id = ${MUSE_PROVIDER_ID}
  `;
  if (!existing) return { ok: false as const, status: 404, error: "Package not found." };
  const version = input.bump ? existing.prompt_version + 1 : existing.prompt_version;
  if (input.stage && input.package) {
    await sql`
      update creative_packages set stage = ${input.stage}, package = ${jsonbText(sql, input.package)}::jsonb, prompt_version = ${version}, updated_at = now()
      where id = ${id}
    `;
  } else if (input.package) {
    await sql`
      update creative_packages set package = ${jsonbText(sql, input.package)}::jsonb, prompt_version = ${version}, updated_at = now()
      where id = ${id}
    `;
  } else if (input.stage) {
    await sql`
      update creative_packages set stage = ${input.stage}, prompt_version = ${version}, updated_at = now()
      where id = ${id}
    `;
  } else if (input.bump) {
    await sql`update creative_packages set prompt_version = ${version}, updated_at = now() where id = ${id}`;
  }
  return { ok: true as const, promptVersion: version };
}

export async function markSceneGenerated(id: string, sceneNumber: number) {
  const sql = getSql();
  const [existing] = await sql<{ stage: MuseStage; package: MusePackageBody }[]>`
    select stage, package from creative_packages where id = ${id} and provider_id = ${MUSE_PROVIDER_ID}
  `;
  if (!existing) return { ok: false as const, status: 404, error: "Package not found." };
  const scene = existing.package.reel?.scenes.find((item) => item.number === sceneNumber);
  if (!scene) return { ok: false as const, status: 400, error: "That scene is not in this package." };
  scene.generated = true;
  const stage = existing.stage === "IDEA" || existing.stage === "SCRIPT_READY" || existing.stage === "PROMPTS_READY"
    ? "EXTERNAL_GENERATION"
    : existing.stage;
  await sql`
    update creative_packages set stage = ${stage}, package = ${jsonbText(sql, existing.package)}::jsonb, updated_at = now()
    where id = ${id}
  `;
  return { ok: true as const, stage };
}

export async function regeneratePackage(id: string) {
  const sql = getSql();
  const [existing] = await sql<{ content_id: string; preset: MusePresetId; stage: MuseStage; prompt_version: number }[]>`
    select content_id, preset, stage, prompt_version from creative_packages where id = ${id} and provider_id = ${MUSE_PROVIDER_ID}
  `;
  if (!existing || !presetById(existing.preset)) return { ok: false as const, status: 404, error: "Package not found." };
  const [row] = await sql<{ record: unknown }[]>`select record from content_items where content_id = ${existing.content_id}`;
  if (!row) return { ok: false as const, status: 404, error: "That content row is not in the campaign." };
  const parsed = contentRecordSchema.safeParse(row.record);
  if (!parsed.success) return { ok: false as const, status: 400, error: "The plan row could not be read." };
  const body = prepareMusePackage(parsed.data, pageByCode(parsed.data.pageCode), existing.preset);
  const stage = existing.stage === "IDEA" || existing.stage === "SCRIPT_READY" ? "PROMPTS_READY" : existing.stage;
  const version = existing.prompt_version + 1;
  await sql`
    update creative_packages set stage = ${stage}, package = ${jsonbText(sql, body)}::jsonb, prompt_version = ${version}, updated_at = now()
    where id = ${id}
  `;
  return { ok: true as const, promptVersion: version, package: body };
}

export async function setWebsite(url: string | null) {
  await getSql()`update creative_providers set website_url = ${url} where id = ${MUSE_PROVIDER_ID}`;
}

export async function recordBalance(userId: string, balance: number, spent: number | null, note: string) {
  await getSql()`
    insert into provider_balances (id, provider_id, recorded_balance, tokens_spent, note, recorded_by)
    values (${randomUUID()}, ${MUSE_PROVIDER_ID}, ${balance}, ${spent}, ${note}, ${userId})
  `;
}

export async function recordUsage(userId: string, kind: "FINISHED_VIDEO" | "FINISHED_IMAGE" | "REJECTED", spent: number | null, note: string) {
  await getSql()`
    insert into provider_usage_events (id, provider_id, kind, tokens_spent, note, recorded_by)
    values (${randomUUID()}, ${MUSE_PROVIDER_ID}, ${kind}, ${spent}, ${note}, ${userId})
  `;
}

export async function saveAsset(input: {
  packageId: string;
  sceneNumber: number | null;
  imageId: string | null;
  bytes: Buffer;
  filename: string;
  aspectRatio: string;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  reviewNotes: string;
}) {
  const sql = getSql();
  const [pkg] = await sql<{ content_id: string; prompt_version: number; package: MusePackageBody }[]>`
    select content_id, prompt_version, package from creative_packages where id = ${input.packageId} and provider_id = ${MUSE_PROVIDER_ID}
  `;
  if (!pkg) return { ok: false as const, status: 404, error: "Package not found." };
  const ext = safeExtension(input.filename);
  if (!ext) return { ok: false as const, status: 400, error: "Upload an mp4, webm, mov, jpg, png, or webp file." };
  if (input.bytes.length === 0) return { ok: false as const, status: 400, error: "The file is empty." };
  if (input.bytes.length > 40 * 1024 * 1024) return { ok: false as const, status: 400, error: "The file is larger than 40 MB." };
  const id = randomUUID();
  const relative = path.join(/*turbopackIgnore: true*/ MUSE_PROVIDER_ID, `${id}.${ext}`);
  const absolute = path.resolve(mediaRoot(), relative);
  if (!insideMediaRoot(absolute)) return { ok: false as const, status: 400, error: "The file path was rejected." };
  await mkdir(/*turbopackIgnore: true*/ path.dirname(absolute), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ absolute, input.bytes);
  const scenePromptText = input.sceneNumber
    ? pkg.package.reel?.scenes.find((scene) => scene.number === input.sceneNumber)?.prompt
    : undefined;
  const imagePromptText = input.imageId ? pkg.package.images.find((image) => image.id === input.imageId)?.prompt : undefined;
  const prompt = scenePromptText ?? imagePromptText ?? pkg.package.strategy.style;
  await sql`
    insert into creative_assets (
      id, package_id, campaign_id, content_id, offer_id, provider_id, scene_number, prompt, prompt_version,
      content_type, aspect_ratio, duration_seconds, width, height, storage_path, original_filename, review_notes, approval_status, generated_on
    ) values (
      ${id}, ${input.packageId}, ${CAMPAIGN_ID}, ${pkg.content_id}, ${null}, ${MUSE_PROVIDER_ID}, ${input.sceneNumber},
      ${prompt}, ${pkg.prompt_version}, ${FILE_TYPES[ext] ?? "application/octet-stream"}, ${input.aspectRatio}, ${input.durationSeconds},
      ${input.width}, ${input.height},
      ${relative}, ${path.basename(input.filename).slice(0, 180)}, ${input.reviewNotes}, 'UPLOADED', current_date
    )
  `;
  await sql`
    update creative_packages
    set stage = case
      when stage in ('IDEA', 'SCRIPT_READY', 'PROMPTS_READY', 'EXTERNAL_GENERATION') then 'ASSETS_UPLOADED'
      else stage
    end,
    updated_at = now()
    where id = ${input.packageId}
  `;
  return { ok: true as const, id, storagePath: relative };
}

export async function reviewAsset(id: string, status: "UPLOADED" | "REVIEW" | "APPROVED" | "REJECTED", notes: string) {
  const sql = getSql();
  const [asset] = await sql<{ package_id: string }[]>`select package_id from creative_assets where id = ${id}`;
  if (!asset) return { ok: false as const, status: 404, error: "Asset not found." };
  await sql`update creative_assets set approval_status = ${status}, review_notes = ${notes} where id = ${id}`;
  if (status === "APPROVED" || status === "REVIEW") {
    await sql`update creative_packages set stage = ${status === "APPROVED" ? "APPROVED" : "REVIEW"}, updated_at = now() where id = ${asset.package_id}`;
  }
  const [campaign] = await sql<{ status: string; not_started: boolean }[]>`
    select status, started_at is null as not_started from campaigns where id = ${CAMPAIGN_ID}
  `;
  return { ok: true as const, campaign };
}

export async function readAssetFile(id: string) {
  const [asset] = await getSql()<{ storage_path: string; original_filename: string; content_type: string }[]>`
    select storage_path, original_filename, content_type from creative_assets where id = ${id}
  `;
  if (!asset) return null;
  const absolute = path.resolve(mediaRoot(), asset.storage_path);
  if (!insideMediaRoot(absolute)) return null;
  const bytes = await readFile(/*turbopackIgnore: true*/ absolute);
  return { bytes, name: asset.original_filename, type: asset.content_type };
}
