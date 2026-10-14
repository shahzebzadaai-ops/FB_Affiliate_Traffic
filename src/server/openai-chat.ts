import { acceptedModelId } from "@/domain/intelligence";

export type ChatResult =
  | { ok: true; text: string; model: string; usage: { promptTokens: number | null; completionTokens: number | null } | null }
  | { ok: false; error: string; model: string | null };

export async function openAiCompatibleChat(
  input: {
    endpoint: string;
    apiKey: string;
    model: string;
    system: string;
    user: string;
    providerName: string;
    maxTokens?: number;
    timeoutMs?: number;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<ChatResult> {
  let response: Response;
  try {
    response = await fetchImpl(input.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        temperature: 0.4,
        max_tokens: input.maxTokens ?? 4096,
      }),
      signal: AbortSignal.timeout(input.timeoutMs ?? 90_000),
    });
  } catch {
    return { ok: false, error: `${input.providerName} could not be reached.`, model: input.model };
  }
  const payload = (await response.json().catch(() => null)) as {
    model?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
    usage?: { prompt_tokens?: unknown; completion_tokens?: unknown };
  } | null;
  const text = payload?.choices?.[0]?.message?.content;
  const reported = typeof payload?.model === "string" ? acceptedModelId(payload.model) : null;
  const model = reported ?? input.model;
  if (!response.ok || typeof text !== "string" || !text.trim()) {
    return { ok: false, error: `${input.providerName} returned status ${response.status} without a usable reply.`, model };
  }
  if (text.length > 200_000) return { ok: false, error: `${input.providerName} reply was too large to store.`, model };
  const usage = payload?.usage
    ? {
        promptTokens: typeof payload.usage.prompt_tokens === "number" ? payload.usage.prompt_tokens : null,
        completionTokens: typeof payload.usage.completion_tokens === "number" ? payload.usage.completion_tokens : null,
      }
    : null;
  return { ok: true, text, model, usage };
}
