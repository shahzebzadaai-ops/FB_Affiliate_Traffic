import { connection } from "next/server";
import { enqueueMediaJob, mediaQueue } from "@/server/media-worker";
import { getCurrentUser } from "@/server/current-user";

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const result = await mediaQueue(user);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({
    jobs: result.jobs,
    buffer: result.buffer,
    heartbeat: result.heartbeat,
    approvedCount: result.approvedCount,
    drive: result.drive,
  });
}

export async function POST(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { contentId?: string } | null;
  const result = await enqueueMediaJob(user, body?.contentId ?? "");
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ job: result.job, created: result.created });
}
