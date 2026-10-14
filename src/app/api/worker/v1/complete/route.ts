import { connection } from "next/server";
import { authenticateWorker, completeMediaJob } from "@/server/media-worker";

export async function POST(request: Request) {
  await connection();
  const worker = await authenticateWorker(bearer(request));
  if (!worker) return Response.json({ error: "Worker credential was rejected." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { jobId?: string; result?: unknown } | null;
  if (!body?.jobId) return Response.json({ error: "Name the job." }, { status: 400 });
  const result = await completeMediaJob(worker, body.jobId, body.result);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, status: result.status });
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/.exec(header);
  return match?.[1] ?? null;
}
