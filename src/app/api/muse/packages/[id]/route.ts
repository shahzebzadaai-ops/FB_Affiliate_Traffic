import { connection } from "next/server";
import { z } from "zod";
import { MUSE_STAGES, musePackageSchema } from "@/domain/muse";
import { markSceneGenerated, regeneratePackage, requirePlanner, updatePackage } from "@/server/muse";

const bodySchema = z.object({
  stage: z.enum(MUSE_STAGES).optional(),
  package: musePackageSchema.optional(),
  bump: z.boolean().optional(),
  markScene: z.number().int().min(1).max(12).optional(),
  regenerate: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status, headers: { "cache-control": "no-store" } });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Package not found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "The edited package could not be saved." }, { status: 400, headers: { "cache-control": "no-store" } });
  if (parsed.data.regenerate) {
    const result = await regeneratePackage(id);
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers: { "cache-control": "no-store" } });
    return Response.json({ promptVersion: result.promptVersion, package: result.package }, { headers: { "cache-control": "no-store" } });
  }
  if (parsed.data.markScene) {
    const result = await markSceneGenerated(id, parsed.data.markScene);
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers: { "cache-control": "no-store" } });
    return Response.json({ stage: result.stage }, { headers: { "cache-control": "no-store" } });
  }
  const result = await updatePackage(id, {
    stage: parsed.data.stage,
    package: parsed.data.package,
    bump: parsed.data.bump,
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers: { "cache-control": "no-store" } });
  return Response.json({ promptVersion: result.promptVersion }, { headers: { "cache-control": "no-store" } });
}
