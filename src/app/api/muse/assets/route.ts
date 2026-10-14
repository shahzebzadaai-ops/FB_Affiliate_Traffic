import { connection } from "next/server";
import { requirePlanner, saveAsset } from "@/server/muse";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: "The upload could not be read." }, 400);
  const file = form.get("file");
  const packageId = String(form.get("packageId") ?? "");
  if (!(file instanceof File) || !/^[0-9a-f-]{36}$/i.test(packageId)) return json({ error: "Choose a package and a finished file." }, 400);
  const sceneRaw = String(form.get("sceneNumber") ?? "").trim();
  const sceneNumber = sceneRaw ? Number(sceneRaw) : null;
  if (sceneNumber !== null && (!Number.isInteger(sceneNumber) || sceneNumber < 1 || sceneNumber > 12)) {
    return json({ error: "Scene number is not valid." }, 400);
  }
  const imageId = String(form.get("imageId") ?? "").trim();
  const aspectRatio = String(form.get("aspectRatio") ?? "").trim();
  if (!/^\d{1,2}:\d{1,2}$/.test(aspectRatio)) return json({ error: "Aspect ratio must look like 9:16." }, 400);
  const durationRaw = String(form.get("durationSeconds") ?? "").trim();
  const durationSeconds = durationRaw ? Number(durationRaw) : null;
  if (durationSeconds !== null && (!Number.isFinite(durationSeconds) || durationSeconds < 0 || durationSeconds > 3600)) {
    return json({ error: "Duration is not valid." }, 400);
  }
  const width = optionalPixel(form.get("width"));
  const height = optionalPixel(form.get("height"));
  if (width === "invalid" || height === "invalid") return json({ error: "Width and height must be pixel counts." }, 400);
  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await saveAsset({
    packageId,
    sceneNumber,
    imageId: imageId || null,
    bytes,
    filename: file.name,
    aspectRatio,
    durationSeconds,
    width,
    height,
    reviewNotes: String(form.get("reviewNotes") ?? "").slice(0, 1000),
  });
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ id: result.id });
}

function optionalPixel(value: FormDataEntryValue | null): number | null | "invalid" {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  if (!Number.isInteger(number) || number < 1 || number > 8000) return "invalid";
  return number;
}
