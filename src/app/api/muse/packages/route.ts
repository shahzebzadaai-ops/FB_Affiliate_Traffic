import { connection } from "next/server";
import { z } from "zod";
import { createPackages, requirePlanner } from "@/server/muse";

const bodySchema = z.object({
  contentId: z.string().regex(/^UK-(BGUK|AHSUK|SPSUK|SGIUK|CBCUK)-\d{3}$/),
  presets: z.array(z.enum(["ugc", "demo", "problem", "comparison", "educational", "cinematic"])).min(1).max(6),
});

export async function POST(request: Request) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status, headers: { "cache-control": "no-store" } });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose a plan row and at least one preset." }, { status: 400, headers: { "cache-control": "no-store" } });
  const result = await createPackages(parsed.data.contentId, parsed.data.presets);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers: { "cache-control": "no-store" } });
  return Response.json({ ids: result.ids }, { headers: { "cache-control": "no-store" } });
}
