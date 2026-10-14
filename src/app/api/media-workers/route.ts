import { connection } from "next/server";
import { createMediaWorker, listMediaWorkers } from "@/server/media-worker";
import { getCurrentUser } from "@/server/current-user";

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const result = await listMediaWorkers(user);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ workers: result.workers });
}

export async function POST(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const result = await createMediaWorker(user, body?.name ?? "");
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ worker: result.worker, token: result.token });
}
