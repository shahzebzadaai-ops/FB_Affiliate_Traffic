export const NOVITA_DEFAULT_BASE = "https://api.novita.ai/openai";

export type EngineId = "intelligence" | "creative" | "video_editing" | "publishing";
export type EngineState = "PAUSED" | "STARTED" | "OFF";

const MODEL_ID = /^[A-Za-z0-9._:/-]{1,120}$/;

export function novitaPublicStatus(env: Record<string, string | undefined> = process.env) {
  const missing: string[] = [];
  if (!env.NOVITA_API_KEY?.trim()) missing.push("NOVITA_API_KEY");
  const model = env.NOVITA_MODEL?.trim() ?? "";
  if (!model) missing.push("NOVITA_MODEL");
  else if (!MODEL_ID.test(model)) missing.push("NOVITA_MODEL");
  return {
    configured: missing.length === 0,
    missing,
    model: model && MODEL_ID.test(model) ? model : null,
    baseUrl: novitaBaseUrl(env),
  };
}

export function novitaBaseUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.NOVITA_BASE_URL?.trim() || NOVITA_DEFAULT_BASE;
  try {
    const url = new URL(raw);
    const local = url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
    const official = url.protocol === "https:" && url.hostname === "api.novita.ai";
    if (url.username || url.password || (!local && !official)) return NOVITA_DEFAULT_BASE;
    return url.toString().replace(/\/$/, "");
  } catch {
    return NOVITA_DEFAULT_BASE;
  }
}

export function researchPublicStatus(env: Record<string, string | undefined> = process.env) {
  const provider = (env.RESEARCH_PROVIDER ?? "").trim();
  const named = /^[a-z0-9_-]{1,40}$/i.test(provider) ? provider : "";
  const hasKey = Boolean(env.RESEARCH_API_KEY?.trim());
  if (!named || !hasKey) {
    return {
      available: false,
      message: "Live research is unavailable. No authorised search API is configured.",
    };
  }
  return {
    available: false,
    message: `Live research is unavailable. ${named} is named, and this build has no adapter for it yet.`,
  };
}

export function storagePublicStatus() {
  return {
    permanent: {
      configured: false,
      kind: null,
      message:
        "Permanent storage is not connected. The 5 TB destination has not been confirmed, so nothing is copied there.",
    },
    staging: {
      kind: "application-host",
      message: "Uploaded files stay in the private media directory on the application host until a permanent store is confirmed.",
    },
    layout: [
      "AffiGrove/Brands/BrandName/Series/SeriesName/Season-01/Episode-001/Originals",
      "AffiGrove/Brands/BrandName/Series/SeriesName/Season-01/Episode-001/Character-References",
      "AffiGrove/Brands/BrandName/Series/SeriesName/Season-01/Episode-001/Audio",
      "AffiGrove/Brands/BrandName/Series/SeriesName/Season-01/Episode-001/Subtitles",
      "AffiGrove/Brands/BrandName/Series/SeriesName/Season-01/Episode-001/Edited",
      "AffiGrove/Brands/BrandName/Series/SeriesName/Season-01/Episode-001/Thumbnails",
      "AffiGrove/Brands/BrandName/Series/SeriesName/Season-01/Episode-001/Project-Files",
      "AffiGrove/Shared-Assets",
      "AffiGrove/Production-Exports",
    ],
  };
}

export function editingPublicStatus() {
  return {
    selected: "worker/atos_worker",
    externalRepositoryUrl: null,
    tool: "FFmpeg",
    moneyPrinterTurbo: "not used",
    vpsServiceInstalled: false,
    videoEditingControl: "PAUSED" as const,
    message:
      "The repository's selected editor is the FFmpeg assembler in worker/atos_worker. No separate editing repository URL is recorded. Money Printer Turbo is not part of this architecture. The VPS editing service is not installed.",
  };
}
