import { beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase, resetDatabase, seedDatabase } from "@/db/setup";
import { getSql } from "@/db/client";
import { contentRecords } from "@/content/catalog";
import { productionSpec, specIsSafe } from "@/domain/media-job";
import { pageByCode } from "@/domain/pages";
import { createAccount } from "@/server/accounts";
import {
  approveMediaJob,
  authenticateWorker,
  completeMediaJob,
  createMediaWorker,
  enqueueMediaJob,
  heartbeatMediaJob,
  listMediaWorkers,
  mediaQueue,
  pollMediaJob,
  revokeMediaWorker,
  taskAssetReference,
  taskStatus,
} from "@/server/media-worker";

const databaseUrl = process.env.DATABASE_URL ?? "";

const storedResult = {
  sha256: "a".repeat(64),
  durationSeconds: 32,
  width: 1080 as const,
  height: 1920 as const,
  byteSize: 1200,
  assetUrl: null,
  driveFileId: null,
  measurements: {
    renderSeconds: 4,
    peakRssBytes: 128,
    tempDiskBytes: 2048,
    externalApiCostCents: null,
  },
};

beforeAll(async () => {
  await migrateDatabase(databaseUrl);
  await resetDatabase(databaseUrl);
  await seedDatabase(databaseUrl);
}, 120_000);

describe("media worker queue", () => {
  it("keeps the Still Got It proof on the owner queue until an https file is approved", async () => {
    const reel = contentRecords.find((record) => record.contentId === "UK-SGIUK-001");
    expect(reel).toBeTruthy();
    if (!reel) return;
    const spec = productionSpec(reel, pageByCode("SGIUK").name);
    expect("error" in spec).toBe(false);
    if ("error" in spec) return;
    expect(spec.voice).toBe("bf_emma");
    expect(spec.music.mode).toBe("none");
    expect(spec.output).toEqual({ width: 1080, height: 1920, fps: 30, minSeconds: 30, maxSeconds: 40 });
    expect(spec.planDuration).toBe("20–35 seconds");
    expect(spec.fictional).toBe(true);
    expect(JSON.stringify(spec)).not.toContain("masho");
    expect(JSON.stringify(spec)).not.toContain("commission");
    expect(specIsSafe(spec)).toBe(true);

    const owner = await createAccount({
      personKey: "shahzeb",
      email: "owner@example.com",
      name: "Shahzeb",
      role: "SUPER_ADMIN",
      password: "owner-test-password",
    });
    const operator = await createAccount({
      personKey: "op-one",
      email: "operator@example.com",
      name: "Operator",
      role: "PUBLISHING_OPERATOR",
      password: "operator-test-password",
    });
    expect(owner.ok && operator.ok).toBe(true);
    if (!owner.ok || !operator.ok) return;

    expect((await enqueueMediaJob(operator.user, "UK-SGIUK-001")).ok).toBe(false);
    expect((await createMediaWorker(operator.user, "Mac M3 Pro")).ok).toBe(false);

    const issued = await createMediaWorker(owner.user, "Mac M3 Pro");
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    const listed = await listMediaWorkers(owner.user);
    expect(JSON.stringify(listed)).not.toContain(issued.token);
    const worker = await authenticateWorker(issued.token);
    expect(worker?.name).toBe("Mac M3 Pro");
    expect(await authenticateWorker("not-a-real-worker-token")).toBeNull();

    const poll = contentRecords.find((record) => record.format === "POLL");
    const unresolved = contentRecords.find((record) => record.format === "REEL" && record.unresolved.length > 0);
    expect(poll && unresolved).toBeTruthy();
    if (!poll || !unresolved) return;
    expect((await enqueueMediaJob(owner.user, poll.contentId)).ok).toBe(false);
    expect((await enqueueMediaJob(owner.user, unresolved.contentId)).ok).toBe(false);

    const queued = await enqueueMediaJob(owner.user, "UK-SGIUK-001");
    expect(queued.ok && queued.created).toBe(true);
    const again = await enqueueMediaJob(owner.user, "UK-SGIUK-001");
    expect(again.ok && !again.created).toBe(true);

    const queue = await mediaQueue(owner.user);
    expect(queue.ok).toBe(true);
    if (!queue.ok) return;
    expect(queue.buffer).toMatchObject({ due: 20, ready: 0, sufficient: false, window: "plan-days-1-to-3" });
    expect(queue.heartbeat.online).toBe(false);
    expect(queue.drive).toBe("not_connected");
    expect((await mediaQueue(operator.user)).ok).toBe(false);

    const claimed = await pollMediaJob(worker!, "Mac M3 Pro");
    expect(claimed.job?.contentId).toBe("UK-SGIUK-001");
    expect(JSON.stringify(claimed.job?.spec)).not.toContain("masho");
    expect(JSON.stringify(claimed.job?.spec)).not.toContain("commission");
    expect(claimed.job?.spec.storySource).toBe("imported-plan-brief");
    const other = await createMediaWorker(owner.user, "Second Mac");
    expect(other.ok).toBe(true);
    if (!other.ok) return;
    const second = await authenticateWorker(other.token);
    expect(second).toBeTruthy();
    if (!second || !claimed.job) return;
    expect((await pollMediaJob(second, "Second Mac")).job).toBeNull();

    const before = claimed.job.id;
    const beat = await heartbeatMediaJob(worker!, { jobId: before, phase: "ASSEMBLING", hostLabel: "Mac M3 Pro" });
    expect(beat.ok).toBe(true);
    const seen = await mediaQueue(owner.user);
    expect(seen.ok && seen.heartbeat.online).toBe(true);

    const sql = getSql();
    await sql`update production_jobs set lease_expires_at = now() - interval '1 minute' where id = ${before}`;
    const reclaimed = await pollMediaJob(second, "Second Mac");
    expect(reclaimed.job?.id).toBe(before);
    expect(reclaimed.job?.attempt).toBe(2);
    expect((await completeMediaJob(worker!, before, storedResult)).ok).toBe(false);

    const waiting = await completeMediaJob(second, before, storedResult);
    expect(waiting.ok && waiting.status).toBe("AWAITING_STORAGE");
    expect(await taskAssetReference("UK-SGIUK-001")).toBe("");
    expect((await approveMediaJob(owner.user, before)).ok).toBe(false);
    const httpUrl = await completeMediaJob(second, before, { ...storedResult, assetUrl: "http://files.example/reel.mp4" });
    expect(httpUrl.ok).toBe(false);

    const ready = await completeMediaJob(second, before, { ...storedResult, assetUrl: "https://files.example/sgiuk-001.mp4" });
    expect(ready.ok && ready.status).toBe("READY_FOR_APPROVAL");
    const repeated = await completeMediaJob(second, before, { ...storedResult, assetUrl: "https://files.example/sgiuk-001.mp4" });
    expect(repeated.ok && repeated.status).toBe("READY_FOR_APPROVAL");
    const approved = await approveMediaJob(owner.user, before);
    expect(approved.ok).toBe(true);
    expect(await taskAssetReference("UK-SGIUK-001")).toBe("https://files.example/sgiuk-001.mp4");
    expect(await taskStatus("UK-SGIUK-001")).toBe("ASSIGNED");

    const after = await mediaQueue(owner.user);
    expect(after.ok && after.buffer.ready).toBe(1);
    expect(after.ok && after.buffer.sufficient).toBe(false);
    expect(after.ok && after.approvedCount).toBe(1);

    expect((await revokeMediaWorker(owner.user, worker!.id)).ok).toBe(true);
    expect(await authenticateWorker(issued.token)).toBeNull();
    const audits = await sql<{ detail: string }[]>`select detail::text as detail from audit_events`;
    expect(audits.some((row) => row.detail.includes(issued.token))).toBe(false);
    const campaign = await sql<{ status: string; started_at: Date | null }[]>`select status, started_at from campaigns where id = 'uk-month-one'`;
    expect(campaign[0]?.status).toBe("BUILD");
    expect(campaign[0]?.started_at).toBeNull();
  });
});
