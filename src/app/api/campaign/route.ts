import { connection } from "next/server";
import { getCurrentUser } from "@/server/current-user";
import { readCampaign, startCampaign } from "@/server/work";

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ status: "BUILD", startedAt: null }, { status: 401 });
  return Response.json(await readCampaign());
}

export async function POST(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { confirm?: unknown } | null;
  const result = await startCampaign(user, body?.confirm === true);
  if (!result.ok) {
    return Response.json({ record: "record" in result ? result.record : await readCampaign(), error: result.error }, { status: result.status });
  }
  return Response.json(result.record);
}
