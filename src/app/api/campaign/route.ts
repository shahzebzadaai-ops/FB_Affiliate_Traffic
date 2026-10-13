import { connection } from "next/server";
import { confirmLaunchFile, readCampaign } from "@/campaign/store";

export async function GET() {
  await connection();
  return Response.json(readCampaign());
}

export async function POST(request: Request) {
  await connection();
  const body = (await request.json().catch(() => null)) as { confirm?: unknown } | null;
  const result = confirmLaunchFile(new Date(), body?.confirm === true);
  if (!result.ok) {
    return Response.json({ record: result.record, error: result.reason }, { status: 400 });
  }
  return Response.json(result.record);
}
