import { connection } from "next/server";
import { z } from "zod";
import { novitaPublicStatus, researchPublicStatus, storagePublicStatus, editingPublicStatus } from "@/domain/intelligence";
import { requirePlanner, readControls } from "@/server/intelligence";
import { generatePilot, listSeries } from "@/server/stories";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

const commandSchema = z.object({ action: z.literal("generate") });

export async function GET() {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  const controls = await readControls();
  return json({
    series: await listSeries(),
    novita: novitaPublicStatus(),
    research: researchPublicStatus(),
    storage: storagePublicStatus(),
    editing: { ...editingPublicStatus(), videoEditingControl: controls.video_editing },
    controls,
  });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  const command = commandSchema.safeParse(await request.json().catch(() => null));
  if (!command.success) return json({ error: "The request was not understood." }, 400);
  const result = await generatePilot();
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ seriesId: result.seriesId });
}
