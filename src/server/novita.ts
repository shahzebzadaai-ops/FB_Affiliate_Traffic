import { novitaBaseUrl, novitaPublicStatus } from "@/domain/intelligence";
import { openAiCompatibleChat, type ChatResult } from "@/server/openai-chat";

export type { ChatResult };

export async function novitaChat(
  input: { system: string; user: string },
  fetchImpl: typeof fetch = fetch,
): Promise<ChatResult> {
  const status = novitaPublicStatus();
  if (!status.configured || !status.model) {
    return { ok: false, error: `Novita is not configured. Missing ${status.missing.join(", ")}.`, model: status.model };
  }
  const apiKey = process.env.NOVITA_API_KEY?.trim() ?? "";
  return openAiCompatibleChat(
    {
      endpoint: `${novitaBaseUrl()}/v1/chat/completions`,
      apiKey,
      model: status.model,
      system: input.system,
      user: input.user,
      providerName: "Novita",
    },
    fetchImpl,
  );
}

export function parseModelJson(text: string): unknown {
  const fenced = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(fenced);
  } catch {
    const start = fenced.indexOf("{");
    const end = fenced.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("The model reply was not JSON.");
    return JSON.parse(fenced.slice(start, end + 1));
  }
}
