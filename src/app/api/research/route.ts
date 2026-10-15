import { connection } from "next/server";
import { z } from "zod";
import { languagePublicStatus, researchPublicStatus } from "@/domain/intelligence";
import { requirePlanner, readControls } from "@/server/intelligence";
import { createResearchPackage, evaluateResearchPackage, listResearchPackages } from "@/server/research-package";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

const sourceSchema = z.object({
  url: z.string(),
  sourceDate: z.string().nullable(),
  theme: z.string(),
  evidence: z.string(),
  notes: z.string(),
});

const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), sources: z.array(sourceSchema).min(1).max(4) }),
  z.object({ action: z.literal("evaluate"), contentId: z.string() }),
]);

export async function GET() {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  return json({
    packages: await listResearchPackages(),
    language: languagePublicStatus(),
    research: researchPublicStatus(),
    controls: await readControls(),
    page: { code: "BGUK", name: "Back in the Game UK" },
    publishing: "disabled",
  });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  const command = commandSchema.safeParse(await request.json().catch(() => null));
  if (!command.success) return json({ error: "The request was not understood." }, 400);
  if (command.data.action === "create") {
    const sources = command.data.sources.map((source) => ({
      ...source,
      sourceDate: source.sourceDate?.trim() ? source.sourceDate.trim() : null,
      notes: source.notes.trim(),
    }));
    const result = await createResearchPackage(gate.user.id, sources);
    if (!result.ok) return json({ error: result.error }, result.status);
    return json({ contentId: result.contentId, publishing: "disabled" });
  }
  const result = await evaluateResearchPackage(gate.user.id, command.data.contentId);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ contentId: result.contentId, publishing: "disabled" });
}
