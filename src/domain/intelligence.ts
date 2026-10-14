import { z } from "zod";

export const NOVITA_DEFAULT_BASE = "https://api.novita.ai/openai";
export const FREELLMAPI_DEFAULT_BASE = "http://127.0.0.1:3001/v1";

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

export function acceptedModelId(value: string | undefined): string | null {
  const model = value?.trim() ?? "";
  return MODEL_ID.test(model) ? model : null;
}

export function freellmapiPublicStatus(env: Record<string, string | undefined> = process.env) {
  const missing: string[] = [];
  if (!env.FREELLMAPI_API_KEY?.trim()) missing.push("FREELLMAPI_API_KEY");
  const model = acceptedModelId(env.FREELLMAPI_MODEL);
  if (!model) missing.push("FREELLMAPI_MODEL");
  return {
    configured: missing.length === 0,
    missing,
    model,
    fallbackModel: acceptedModelId(env.FREELLMAPI_FALLBACK_MODEL),
    baseUrl: freellmapiBaseUrl(env),
  };
}

export function freellmapiBaseUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.FREELLMAPI_BASE_URL?.trim() || FREELLMAPI_DEFAULT_BASE;
  try {
    const url = new URL(raw);
    const local = url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
    const path = url.pathname.replace(/\/$/, "") || "/v1";
    if (url.username || url.password || !local || path !== "/v1") return FREELLMAPI_DEFAULT_BASE;
    return `${url.origin}/v1`;
  } catch {
    return FREELLMAPI_DEFAULT_BASE;
  }
}

export function languagePublicStatus(env: Record<string, string | undefined> = process.env) {
  const router = freellmapiPublicStatus(env);
  const novita = novitaPublicStatus(env);
  if (router.configured) {
    return {
      active: "freellmapi" as const,
      configured: true,
      model: router.model,
      fallbackModel: router.fallbackModel,
      missing: [] as string[],
      novitaConfigured: novita.configured,
    };
  }
  if (novita.configured) {
    return {
      active: "novita" as const,
      configured: true,
      model: novita.model,
      fallbackModel: null,
      missing: [] as string[],
      novitaConfigured: true,
    };
  }
  return {
    active: null,
    configured: false,
    model: null,
    fallbackModel: null,
    missing: [...router.missing, ...novita.missing],
    novitaConfigured: false,
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

export const suppliedEvidenceSchema = z.object({
  observations: z.array(z.string().trim().min(3).max(500)).min(1).max(8),
  assumptions: z.array(z.string().trim().min(3).max(500)).min(1).max(8),
  storyImplications: z.array(z.string().trim().min(3).max(500)).min(1).max(8),
});

export const SUPPLIED_EVIDENCE_SYSTEM = [
  "You analyse only the evidence in the user message.",
  "You have not searched the web. Do not claim that you did, and do not add facts from outside the evidence.",
  "Do not invent views, reach, watch time, revenue, or dates.",
  "Reply with one JSON object and no markdown.",
  "Keys: observations, assumptions, storyImplications. Each is an array of short strings.",
  "observations are statements present in the evidence. assumptions are things the evidence does not establish. storyImplications are possible fiction uses, labelled as writing ideas.",
].join(" ");
