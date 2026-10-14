import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, getSql } from "@/db/client";
import { contentItems, mediaWorkers, productionJobs, socialPages, taskStates } from "@/db/schema";
import { isLiveDate } from "@/domain/campaign";
import {
  GLOBAL_RENDER_SLOTS,
  LEASE_MS,
  OPEN_JOB_STATUSES,
  httpsAssetUrl,
  productionSpec,
  readyBuffer,
  specIsSafe,
  workerOnline,
  type ProductionResult,
  type ProductionSpec,
} from "@/domain/media-job";
import { can } from "@/domain/permissions";
import { hashToken, writeAudit, type PublicUser } from "@/server/accounts";

const RENDER_LOCK = 8142026;
const HOST_LABEL = /^[\w .()-]{1,80}$/;

const resultSchema = z.object({
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  durationSeconds: z.number().min(0).max(120).nullable(),
  width: z.literal(1080),
  height: z.literal(1920),
  byteSize: z.number().int().positive().max(250_000_000),
  assetUrl: z.string().max(2000).nullable(),
  driveFileId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/).nullable(),
  measurements: z.object({
    renderSeconds: z.number().min(0).max(86_400),
    peakRssBytes: z.number().int().min(0),
    tempDiskBytes: z.number().int().min(0),
    externalApiCostCents: z.number().int().min(0).nullable(),
  }),
});

export type WorkerPrincipal = {
  id: string;
  name: string;
  createdBy: string;
  revokedAt: Date | null;
  lastHeartbeatAt: Date | null;
  hostLabel: string | null;
};

type Failure = { ok: false; status: number; error: string };

function denied(actor: PublicUser): Failure | null {
  if (!can(actor.role, "manage_plan")) return { ok: false, status: 403, error: "The media queue is owner-only." };
  return null;
}

function cleanHost(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !HOST_LABEL.test(value)) return null;
  return value;
}

export async function authenticateWorker(token: string | null): Promise<WorkerPrincipal | null> {
  if (!token || token.length < 20 || token.length > 200) return null;
  const [row] = await getDb().select().from(mediaWorkers).where(eq(mediaWorkers.tokenHash, hashToken(token)));
  if (!row || row.revokedAt) return null;
  return {
    id: row.id,
    name: row.name,
    createdBy: row.createdBy,
    revokedAt: row.revokedAt,
    lastHeartbeatAt: row.lastHeartbeatAt,
    hostLabel: row.hostLabel,
  };
}

export async function createMediaWorker(actor: PublicUser, name: string): Promise<
  { ok: true; worker: { id: string; name: string }; token: string } | Failure
> {
  const block = denied(actor);
  if (block) return block;
  const label = name.trim();
  if (label.length < 2 || label.length > 80) return { ok: false, status: 400, error: "Name the Mac this credential belongs to." };
  const token = randomBytes(32).toString("base64url");
  const id = randomUUID();
  await getDb().insert(mediaWorkers).values({
    id,
    name: label,
    tokenHash: hashToken(token),
    createdBy: actor.id,
    createdAt: new Date(),
    revokedAt: null,
    lastHeartbeatAt: null,
    hostLabel: null,
    maxConcurrent: 1,
  });
  await writeAudit(actor.id, "CREATE_MEDIA_WORKER", "media_worker", id, { name: label });
  return { ok: true, worker: { id, name: label }, token };
}

export async function revokeMediaWorker(actor: PublicUser, workerId: string): Promise<{ ok: true } | Failure> {
  const block = denied(actor);
  if (block) return block;
  const [row] = await getDb().select().from(mediaWorkers).where(eq(mediaWorkers.id, workerId));
  if (!row) return { ok: false, status: 404, error: "That worker does not exist." };
  await getDb().update(mediaWorkers).set({ revokedAt: new Date() }).where(eq(mediaWorkers.id, workerId));
  await writeAudit(actor.id, "REVOKE_MEDIA_WORKER", "media_worker", workerId, {});
  return { ok: true };
}

export async function listMediaWorkers(actor: PublicUser) {
  const block = denied(actor);
  if (block) return block;
  const rows = await getDb().select().from(mediaWorkers);
  const now = Date.now();
  return {
    ok: true as const,
    workers: rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
      revokedAt: row.revokedAt?.toISOString() ?? null,
      lastHeartbeatAt: row.lastHeartbeatAt?.toISOString() ?? null,
      hostLabel: row.hostLabel,
      online: !row.revokedAt && workerOnline(row.lastHeartbeatAt, now),
    })),
  };
}

export async function enqueueMediaJob(actor: PublicUser, contentId: string): Promise<
  { ok: true; job: PublicJob; created: boolean } | Failure
> {
  const block = denied(actor);
  if (block) return block;
  if (!/^UK-(BGUK|AHSUK|SPSUK|SGIUK|CBCUK)-\d{3}$/.test(contentId)) {
    return { ok: false, status: 400, error: "That content ID is not in the UK plan." };
  }
  const db = getDb();
  const [item] = await db.select().from(contentItems).where(eq(contentItems.contentId, contentId));
  if (!item) return { ok: false, status: 404, error: "That post is not in the database." };
  const [page] = await db.select().from(socialPages).where(eq(socialPages.code, item.pageCode));
  const spec = productionSpec(item.record, page?.name ?? item.pageCode);
  if ("error" in spec) return { ok: false, status: 400, error: spec.error };
  const sql = getSql();
  const open = await sql<{ id: string }[]>`
    select id from production_jobs
    where content_id = ${contentId}
      and status in ${sql(OPEN_JOB_STATUSES)}
    order by created_at
    limit 1
  `;
  if (open[0]) {
    const existing = await readJob(open[0].id);
    if (!existing) return { ok: false, status: 500, error: "The existing job could not be read." };
    return { ok: true, job: existing, created: false };
  }
  const [countRow] = await sql<{ n: number }[]>`select count(*)::int as n from production_jobs where content_id = ${contentId}`;
  const attempt = Number(countRow?.n ?? 0) + 1;
  const id = randomUUID();
  try {
    await db.insert(productionJobs).values({
      id,
      contentId,
      idempotencyKey: `content:${contentId}:attempt:${attempt}`,
      status: "QUEUED",
      spec,
      workerId: null,
      leaseExpiresAt: null,
      attempt: 0,
      result: null,
      error: null,
      createdBy: actor.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch {
    const [again] = await sql<{ id: string }[]>`
      select id from production_jobs
      where content_id = ${contentId} and status in ${sql(OPEN_JOB_STATUSES)}
      order by created_at
      limit 1
    `;
    if (!again) return { ok: false, status: 409, error: "A job for this post already exists." };
    const existing = await readJob(again.id);
    if (!existing) return { ok: false, status: 500, error: "The existing job could not be read." };
    return { ok: true, job: existing, created: false };
  }
  await writeAudit(actor.id, "ENQUEUE_MEDIA_JOB", "production_job", id, { contentId });
  const job = await readJob(id);
  if (!job) return { ok: false, status: 500, error: "The job was not stored." };
  return { ok: true, job, created: true };
}

export async function mediaQueue(actor: PublicUser) {
  const block = denied(actor);
  if (block) return block;
  const jobs = await getDb().select().from(productionJobs);
  const buffer = await bufferSnapshot();
  const workers = await listMediaWorkers(actor);
  if (!workers.ok) return workers;
  const heartbeats = workers.workers.filter((worker) => !worker.revokedAt).map((worker) => worker.lastHeartbeatAt);
  const latest = heartbeats.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
  return {
    ok: true as const,
    jobs: jobs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((row) => toPublic(row)),
    buffer,
    heartbeat: {
      lastHeartbeatAt: latest,
      online: workers.workers.some((worker) => worker.online),
    },
    approvedCount: jobs.filter((job) => job.status === "APPROVED").length,
    drive: "not_connected" as const,
  };
}

export async function approveMediaJob(actor: PublicUser, jobId: string): Promise<{ ok: true; job: PublicJob } | Failure> {
  const block = denied(actor);
  if (block) return block;
  const [row] = await getDb().select().from(productionJobs).where(eq(productionJobs.id, jobId));
  if (!row) return { ok: false, status: 404, error: "That job does not exist." };
  if (row.status === "APPROVED") {
    const job = toPublic(row);
    return { ok: true, job };
  }
  if (row.status !== "READY_FOR_APPROVAL") {
    return { ok: false, status: 400, error: "Approve a job only after it has an https file URL." };
  }
  const assetUrl = httpsAssetUrl(row.result?.assetUrl);
  if (!assetUrl) return { ok: false, status: 400, error: "This job has no https file URL." };
  const sql = getSql();
  const [task] = await sql<{ state: { status?: string; assetReference?: string } }[]>`
    select state from task_states where content_id = ${row.contentId}
  `;
  const current = task?.state.assetReference?.trim() ?? "";
  if (current.startsWith("https://") && current !== assetUrl) {
    return { ok: false, status: 409, error: "This post already has a different file URL." };
  }
  const patch = JSON.stringify({ assetReference: assetUrl });
  await sql`
    update task_states
    set state = state || ${patch}::jsonb, updated_at = now()
    where content_id = ${row.contentId}
  `;
  await getDb().update(productionJobs).set({ status: "APPROVED", updatedAt: new Date() }).where(eq(productionJobs.id, jobId));
  await writeAudit(actor.id, "APPROVE_MEDIA_JOB", "production_job", jobId, { contentId: row.contentId });
  const job = await readJob(jobId);
  if (!job) return { ok: false, status: 500, error: "The approved job could not be read." };
  return { ok: true, job };
}

export async function pollMediaJob(worker: WorkerPrincipal, hostLabel: unknown) {
  const host = cleanHost(hostLabel) ?? worker.hostLabel;
  const sql = getSql();
  const claimed = await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${RENDER_LOCK})`;
    await tx`
      update media_workers
      set last_heartbeat_at = now(), host_label = coalesce(${host}, host_label)
      where id = ${worker.id} and revoked_at is null
    `;
    const [busy] = await tx<{ n: number }[]>`
      select count(*)::int as n from production_jobs
      where status in ('LEASED', 'ASSEMBLING', 'UPLOADING')
        and lease_expires_at > now()
    `;
    if (Number(busy?.n ?? 0) >= GLOBAL_RENDER_SLOTS) return { job: null as null, waiting: "render-slot" as const };
    const [next] = await tx<{ id: string }[]>`
      select id from production_jobs
      where status = 'QUEUED'
         or (
           status in ('LEASED', 'ASSEMBLING', 'UPLOADING')
           and (lease_expires_at is null or lease_expires_at <= now())
         )
      order by created_at
      for update skip locked
      limit 1
    `;
    if (!next) return { job: null as null, waiting: "empty" as const };
    const [updated] = await tx<{ id: string; content_id: string; spec: ProductionSpec; attempt: number }[]>`
      update production_jobs
      set status = 'LEASED',
          worker_id = ${worker.id},
          lease_expires_at = now() + (${LEASE_MS} * interval '1 millisecond'),
          attempt = attempt + 1,
          error = null,
          updated_at = now()
      where id = ${next.id}
      returning id, content_id, spec, attempt
    `;
    return { job: updated ?? null, waiting: "empty" as const };
  });
  if (!claimed.job) return { job: null, waiting: claimed.waiting };
  if (!specIsSafe(claimed.job.spec)) {
    await getDb().update(productionJobs).set({
      status: "FAILED",
      error: "The job spec was rejected before it left the server.",
      leaseExpiresAt: null,
      updatedAt: new Date(),
    }).where(eq(productionJobs.id, claimed.job.id));
    await writeAudit(worker.createdBy, "FAIL_MEDIA_JOB", "production_job", claimed.job.id, { workerId: worker.id, reason: "unsafe-spec" });
    return { job: null, waiting: "empty" as const };
  }
  return {
    job: {
      id: claimed.job.id,
      contentId: claimed.job.content_id,
      attempt: claimed.job.attempt,
      spec: claimed.job.spec,
    },
    waiting: null,
  };
}

export async function heartbeatMediaJob(worker: WorkerPrincipal, input: { jobId?: string; hostLabel?: unknown; phase?: unknown }) {
  const host = cleanHost(input.hostLabel);
  const sql = getSql();
  await sql`
    update media_workers
    set last_heartbeat_at = now(), host_label = coalesce(${host}, host_label)
    where id = ${worker.id} and revoked_at is null
  `;
  if (!input.jobId) return { ok: true as const, leaseExpiresAt: null };
  const phase = input.phase === "UPLOADING" || input.phase === "ASSEMBLING" ? input.phase : null;
  const [row] = await sql<{ id: string; lease_expires_at: Date | string }[]>`
    update production_jobs
    set lease_expires_at = now() + (${LEASE_MS} * interval '1 millisecond'),
        status = coalesce(${phase}, status),
        updated_at = now()
    where id = ${input.jobId}
      and worker_id = ${worker.id}
      and status in ('LEASED', 'ASSEMBLING', 'UPLOADING')
      and lease_expires_at > now()
    returning id, lease_expires_at
  `;
  if (!row) return { ok: false as const, status: 409, error: "This lease is no longer yours." };
  const leaseExpiresAt = row.lease_expires_at instanceof Date ? row.lease_expires_at.toISOString() : new Date(row.lease_expires_at).toISOString();
  return { ok: true as const, leaseExpiresAt };
}

export async function completeMediaJob(
  worker: WorkerPrincipal,
  jobId: string,
  result: unknown,
): Promise<{ ok: true; status: string } | Failure> {
  if (!specIsSafe(result)) return { ok: false, status: 400, error: "The result was rejected." };
  const parsed = resultSchema.safeParse(result);
  if (!parsed.success) return { ok: false, status: 400, error: "The result does not match the media contract." };
  const [row] = await getDb().select().from(productionJobs).where(eq(productionJobs.id, jobId));
  if (!row || row.workerId !== worker.id) return { ok: false, status: 404, error: "That job is not leased to this worker." };
  const value = parsed.data;
  const assetUrl = httpsAssetUrl(value.assetUrl);
  if (value.assetUrl && !assetUrl) return { ok: false, status: 400, error: "The file URL must be https." };
  if (row.spec.format === "REEL") {
    const duration = value.durationSeconds;
    if (duration == null || duration < row.spec.output.minSeconds || duration > row.spec.output.maxSeconds) {
      return { ok: false, status: 400, error: "A Reel result must be between 30 and 40 seconds." };
    }
  }
  if (
    row.result?.sha256 === value.sha256 &&
    row.result.assetUrl === assetUrl &&
    (row.status === "READY_FOR_APPROVAL" || row.status === "AWAITING_STORAGE" || row.status === "APPROVED")
  ) {
    return { ok: true, status: row.status };
  }
  if (!["LEASED", "ASSEMBLING", "UPLOADING", "AWAITING_STORAGE"].includes(row.status)) {
    return { ok: false, status: 409, error: "This job is not open for a result." };
  }
  const stored: ProductionResult = {
    ...value,
    assetUrl,
    measurements: {
      ...value.measurements,
      externalApiCostCents: value.measurements.externalApiCostCents,
    },
  };
  const status = assetUrl ? "READY_FOR_APPROVAL" : "AWAITING_STORAGE";
  await getDb().update(productionJobs).set({
    status,
    result: stored,
    error: null,
    leaseExpiresAt: null,
    updatedAt: new Date(),
  }).where(eq(productionJobs.id, jobId));
  await writeAudit(worker.createdBy, "COMPLETE_MEDIA_JOB", "production_job", jobId, {
    workerId: worker.id,
    contentId: row.contentId,
    status,
    hasAsset: Boolean(assetUrl),
  });
  return { ok: true, status };
}

export async function failMediaJob(worker: WorkerPrincipal, jobId: string, error: unknown): Promise<{ ok: true } | Failure> {
  const message = typeof error === "string" ? error.replace(/\s+/g, " ").trim().slice(0, 400) : "";
  if (message.length < 3) return { ok: false, status: 400, error: "Say why the job failed." };
  const [row] = await getDb().select().from(productionJobs).where(eq(productionJobs.id, jobId));
  if (!row || row.workerId !== worker.id) return { ok: false, status: 404, error: "That job is not leased to this worker." };
  if (row.status === "FAILED") return { ok: true };
  if (!["LEASED", "ASSEMBLING", "UPLOADING", "AWAITING_STORAGE"].includes(row.status)) {
    return { ok: false, status: 409, error: "This job can no longer be failed by the worker." };
  }
  await getDb().update(productionJobs).set({
    status: "FAILED",
    error: message,
    leaseExpiresAt: null,
    updatedAt: new Date(),
  }).where(eq(productionJobs.id, jobId));
  await writeAudit(worker.createdBy, "FAIL_MEDIA_JOB", "production_job", jobId, { workerId: worker.id, contentId: row.contentId });
  return { ok: true };
}

async function bufferSnapshot() {
  const sql = getSql();
  const [campaign] = await sql<{ status: string; started_at: Date | null }[]>`
    select status, started_at from campaigns where id = 'uk-month-one'
  `;
  const rows = await sql<{ publish_at: string; asset_reference: string }[]>`
    select record->>'publishAt' as publish_at, coalesce(state->>'assetReference', '') as asset_reference
    from content_items
    join task_states on task_states.content_id = content_items.content_id
  `;
  const live = isLiveDate({
    status: campaign?.status === "ACTIVE" ? "ACTIVE" : "BUILD",
    startedAt: campaign?.started_at ? campaign.started_at.toISOString() : null,
  });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return readyBuffer(
    rows.map((row) => ({ publishAt: row.publish_at, assetReference: row.asset_reference })),
    live,
    today,
  );
}

async function readJob(id: string): Promise<PublicJob | null> {
  const [row] = await getDb().select().from(productionJobs).where(eq(productionJobs.id, id));
  return row ? toPublic(row) : null;
}

type PublicJob = ReturnType<typeof toPublic>;

function toPublic(row: typeof productionJobs.$inferSelect) {
  const assetUrl = httpsAssetUrl(row.result?.assetUrl);
  return {
    id: row.id,
    contentId: row.contentId,
    status: row.status,
    attempt: row.attempt,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    leaseExpiresAt: row.leaseExpiresAt?.toISOString() ?? null,
    workerId: row.workerId,
    pageCode: row.spec.pageCode,
    format: row.spec.format,
    voice: row.spec.voice,
    planDuration: row.spec.planDuration,
    output: row.spec.output,
    music: row.spec.music,
    assetUrl,
    driveFileId: row.result?.driveFileId ?? null,
    measurements: row.result?.measurements ?? null,
  };
}

export async function taskAssetReference(contentId: string): Promise<string> {
  const [row] = await getDb().select().from(taskStates).where(eq(taskStates.contentId, contentId));
  return row?.state.assetReference ?? "";
}

export async function taskStatus(contentId: string): Promise<string> {
  const [row] = await getDb().select().from(taskStates).where(eq(taskStates.contentId, contentId));
  return row?.state.status ?? "";
}
