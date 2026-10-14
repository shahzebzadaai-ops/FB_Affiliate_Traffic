import { freellmapiBaseUrl, freellmapiPublicStatus, languagePublicStatus } from "@/domain/intelligence";
import { novitaChat } from "@/server/novita";
import { openAiCompatibleChat, type ChatResult } from "@/server/openai-chat";

export type LanguageProvider = "freellmapi" | "novita";
export type LanguageResult = ChatResult & { provider: LanguageProvider | null };

const ROUTER_TIMEOUT_MS = 180_000;
const COOLDOWN_LIMIT_MS = 12_000;

function blankFailure(error: string, model: string | null, provider: LanguageProvider | null): LanguageResult {
  return {
    ok: false,
    error,
    model,
    provider,
    usage: null,
    finishReason: null,
    truncated: false,
    status: null,
    retryAfterMs: null,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function languageChat(
  input: { system: string; user: string; maxTokens?: number; models?: string[]; reasoningEffort?: "low" | "medium" | "high" },
  fetchImpl: typeof fetch = fetch,
): Promise<LanguageResult> {
  const selected = languagePublicStatus();
  if (!selected.configured || !selected.active) {
    return blankFailure(
      `No language model is configured. Missing ${selected.missing.join(", ")}.`,
      null,
      selected.provider,
    );
  }
  const configured = selected.active === "freellmapi"
    ? [selected.model, selected.fallbackModel].filter((model): model is string => Boolean(model))
    : [selected.model].filter((model): model is string => Boolean(model));
  const requested = input.models?.map((model) => model.trim()).filter(Boolean);
  const models = [...new Set(requested && requested.length > 0 ? requested : configured)];
  const router = freellmapiPublicStatus();
  let last: LanguageResult = blankFailure(
    `${selected.active === "novita" ? "Novita" : "FreeLLMAPI"} returned status 0 without a usable reply.`,
    models[0] ?? null,
    selected.active,
  );
  for (const model of models) {
    const call = () => selected.active === "novita"
      ? novitaChat({ system: input.system, user: input.user, maxTokens: input.maxTokens }, fetchImpl)
      : openAiCompatibleChat(
          {
            endpoint: `${freellmapiBaseUrl()}/chat/completions`,
            apiKey: process.env.FREELLMAPI_API_KEY?.trim() ?? "",
            model,
            system: input.system,
            user: input.user,
            providerName: "FreeLLMAPI",
            maxTokens: input.maxTokens ?? 1024,
            timeoutMs: ROUTER_TIMEOUT_MS,
            reasoningEffort: input.reasoningEffort,
          },
          fetchImpl,
        );
    let chat = await call();
    if (!chat.ok && chat.status === 429 && chat.retryAfterMs !== null && chat.retryAfterMs <= COOLDOWN_LIMIT_MS) {
      if (chat.retryAfterMs > 0) await delay(chat.retryAfterMs);
      chat = await call();
    }
    last = { ...chat, provider: selected.active };
    if (chat.ok) return last;
    if (selected.active === "novita") return last;
  }
  if (selected.active === "freellmapi" && !router.configured) {
    return blankFailure(`No language model is configured. Missing ${router.missing.join(", ")}.`, null, "freellmapi");
  }
  return last;
}
