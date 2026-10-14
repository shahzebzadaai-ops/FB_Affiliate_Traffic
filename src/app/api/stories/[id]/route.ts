import { connection } from "next/server";
import { z } from "zod";
import { requirePlanner } from "@/server/intelligence";
import { approveSeries, saveStoryClip } from "@/server/stories";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

const approvalSchema = z.object({ action: z.literal("approve") });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "That series was not found." }, 404);
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    const episodeId = String(form?.get("episodeId") ?? "");
    const sceneNumber = Number(form?.get("sceneNumber"));
    if (!(file instanceof File) || !/^[0-9a-f-]{36}$/i.test(episodeId) || !Number.isInteger(sceneNumber)) {
      return json({ error: "Choose an episode, a shot, and a video file." }, 400);
    }
    const saved = await saveStoryClip({
      episodeId,
      sceneNumber,
      bytes: Buffer.from(await file.arrayBuffer()),
      filename: file.name,
    });
    if (!saved.ok) return json({ error: saved.error }, saved.status);
    return json({ id: saved.id, assembled: saved.assembled, storagePath: saved.storagePath });
  }
  const command = approvalSchema.safeParse(await request.json().catch(() => null));
  if (!command.success) return json({ error: "The request was not understood." }, 400);
  const result = await approveSeries(id);
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ campaign: result.campaign, publishing: "disabled" });
}
