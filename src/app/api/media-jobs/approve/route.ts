import { connection } from "next/server";
import { approveMediaJob } from "@/server/media-worker";
import { getCurrentUser } from "@/server/current-user";

export async function POST(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { jobId?: string } | null;
  const result = await approveMediaJob(user, body?.jobId ?? "");
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ job: result.job });
}
