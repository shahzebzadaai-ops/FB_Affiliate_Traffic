import { connection } from "next/server";
import { z } from "zod";
import { analyseSuppliedEvidence, intelligenceOverview, requirePlanner, setEngine } from "@/server/intelligence";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

const commandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("control"),
    id: z.enum(["intelligence", "creative", "video_editing", "publishing"]),
    state: z.enum(["PAUSED", "STARTED", "OFF"]),
  }),
  z.object({
    action: z.literal("analyse"),
    evidence: z.string().trim().min(20).max(8000),
  }),
]);

export async function GET() {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  return json(await intelligenceOverview());
}

export async function POST(request: Request) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  const command = commandSchema.safeParse(await request.json().catch(() => null));
  if (!command.success) return json({ error: "The request was not understood." }, 400);
  if (command.data.action === "analyse") {
    const result = await analyseSuppliedEvidence(command.data.evidence);
    if (!result.ok) return json({ error: result.error }, result.status);
    return json({
      reportId: result.reportId,
      model: result.model,
      provider: result.provider,
      analysis: result.analysis,
    });
  }
  if (command.data.id === "publishing" || command.data.state === "OFF") {
    return json({ error: "Publishing stays off. Starting an engine does not publish." }, 409);
  }
  const result = await setEngine(command.data.id, command.data.state);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ controls: result.controls });
}
