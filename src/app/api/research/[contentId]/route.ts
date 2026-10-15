import { connection } from "next/server";
import { z } from "zod";
import { requirePlanner } from "@/server/intelligence";
import { approveResearchCandidate, generateResearchPackage, readResearchPackage } from "@/server/research-package";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), candidateId: z.string() }),
  z.object({ action: z.literal("generate") }),
]);

export async function GET(_request: Request, context: { params: Promise<{ contentId: string }> }) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  const { contentId } = await context.params;
  const row = await readResearchPackage(contentId);
  if (!row) return json({ error: "That research package was not found." }, 404);
  return json({ package: row, publishing: "disabled" });
}

export async function POST(request: Request, context: { params: Promise<{ contentId: string }> }) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  const { contentId } = await context.params;
  const command = commandSchema.safeParse(await request.json().catch(() => null));
  if (!command.success) return json({ error: "The request was not understood." }, 400);
  const result = command.data.action === "approve"
    ? await approveResearchCandidate(gate.user.id, contentId, command.data.candidateId)
    : await generateResearchPackage(gate.user.id, contentId);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ contentId: result.contentId, publishing: "disabled" });
}
