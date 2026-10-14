import { connection } from "next/server";
import { authenticateWorker, heartbeatMediaJob } from "@/server/media-worker";

export async function POST(request: Request) {
  await connection();
  const worker = await authenticateWorker(bearer(request));
  if (!worker) return Response.json({ error: "Worker credential was rejected." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { jobId?: string; hostLabel?: unknown; phase?: unknown } | null;
  const result = await heartbeatMediaJob(worker, body ?? {});
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, leaseExpiresAt: result.leaseExpiresAt });
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/.exec(header);
  return match?.[1] ?? null;
}
