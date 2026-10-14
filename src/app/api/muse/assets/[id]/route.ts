import { connection } from "next/server";
import { z } from "zod";
import { readAssetFile, requirePlanner, reviewAsset } from "@/server/muse";

const reviewSchema = z.object({
  status: z.enum(["UPLOADED", "REVIEW", "APPROVED", "REJECTED"]),
  notes: z.string().max(1000),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status, headers: { "cache-control": "no-store" } });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const file = await readAssetFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  const type = file.type.startsWith("video/") || file.type.startsWith("image/") ? file.type : "application/octet-stream";
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "content-type": type,
      "content-disposition": `attachment; filename="${file.name.replace(/["\r\n]/g, "")}"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status, headers: { "cache-control": "no-store" } });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Asset not found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "The review could not be saved." }, { status: 400, headers: { "cache-control": "no-store" } });
  const result = await reviewAsset(id, parsed.data.status, parsed.data.notes.trim());
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers: { "cache-control": "no-store" } });
  return Response.json(
    { campaignStatus: result.campaign?.status ?? null, publishingStarted: result.campaign ? !result.campaign.not_started : null },
    { headers: { "cache-control": "no-store" } },
  );
}
