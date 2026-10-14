import { freellmapiBaseUrl, freellmapiPublicStatus, languagePublicStatus, novitaPublicStatus } from "@/domain/intelligence";
import { novitaChat } from "@/server/novita";
import { openAiCompatibleChat, type ChatResult } from "@/server/openai-chat";

export type LanguageProvider = "freellmapi" | "novita";
export type LanguageResult = ChatResult & { provider: LanguageProvider | null };

const ROUTER_TIMEOUT_MS = 180_000;
const ROUTER_MAX_TOKENS = 8192;

export async function languageChat(
  input: { system: string; user: string },
  fetchImpl: typeof fetch = fetch,
): Promise<LanguageResult> {
  const selected = languagePublicStatus();
  if (!selected.configured) {
    return {
      ok: false,
      error: `No language model is configured. Missing ${selected.missing.join(", ")}.`,
      model: null,
      provider: null,
    };
  }
  if (selected.active === "freellmapi") {
    const router = freellmapiPublicStatus();
    const models = [router.model, router.fallbackModel].filter((model): model is string => Boolean(model));
    const unique = [...new Set(models)];
    let last: LanguageResult = {
      ok: false,
      error: "FreeLLMAPI returned status 0 without a usable reply.",
      model: router.model,
      provider: "freellmapi",
    };
    for (const model of unique) {
      const chat = await openAiCompatibleChat(
        {
          endpoint: `${freellmapiBaseUrl()}/chat/completions`,
          apiKey: process.env.FREELLMAPI_API_KEY?.trim() ?? "",
          model,
          system: input.system,
          user: input.user,
          providerName: "FreeLLMAPI",
          maxTokens: ROUTER_MAX_TOKENS,
          timeoutMs: ROUTER_TIMEOUT_MS,
        },
        fetchImpl,
      );
      last = { ...chat, provider: "freellmapi" };
      if (chat.ok) return last;
    }
    if (novitaPublicStatus().configured) {
      const novita = await novitaChat(input, fetchImpl);
      return { ...novita, provider: "novita" };
    }
    return last;
  }
  const novita = await novitaChat(input, fetchImpl);
  return { ...novita, provider: "novita" };
}
