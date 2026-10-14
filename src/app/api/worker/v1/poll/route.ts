import { connection } from "next/server";
import { authenticateWorker, pollMediaJob } from "@/server/media-worker";

export async function POST(request: Request) {
  await connection();
  const worker = await authenticateWorker(bearer(request));
  if (!worker) return Response.json({ error: "Worker credential was rejected." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { hostLabel?: unknown } | null;
  const result = await pollMediaJob(worker, body?.hostLabel);
  return Response.json(result);
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/.exec(header);
  return match?.[1] ?? null;
}
