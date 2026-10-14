import { connection } from "next/server";
import { authenticateWorker, failMediaJob } from "@/server/media-worker";

export async function POST(request: Request) {
  await connection();
  const worker = await authenticateWorker(bearer(request));
  if (!worker) return Response.json({ error: "Worker credential was rejected." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { jobId?: string; error?: unknown } | null;
  if (!body?.jobId) return Response.json({ error: "Name the job." }, { status: 400 });
  const result = await failMediaJob(worker, body.jobId, body.error);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true });
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/.exec(header);
  return match?.[1] ?? null;
}
