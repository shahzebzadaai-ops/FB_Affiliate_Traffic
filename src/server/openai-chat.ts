import { acceptedModelId } from "@/domain/intelligence";

export type ChatUsage = { promptTokens: number | null; completionTokens: number | null };

export type ChatResult =
  | {
      ok: true;
      text: string;
      model: string;
      usage: ChatUsage | null;
      finishReason: string | null;
      truncated: boolean;
      status: number;
      retryAfterMs: null;
    }
  | {
      ok: false;
      error: string;
      model: string | null;
      usage: null;
      finishReason: null;
      truncated: false;
      status: number | null;
      retryAfterMs: number | null;
    };

export function retryAfterMs(header: string | null, now = Date.now()): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Math.round(Number(trimmed) * 1000);
  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed)) return Math.max(0, parsed - now);
  return null;
}

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
    reasoningEffort?: "low" | "medium" | "high";
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
        ...(input.reasoningEffort ? { reasoning_effort: input.reasoningEffort } : {}),
      }),
      signal: AbortSignal.timeout(input.timeoutMs ?? 90_000),
    });
  } catch {
    return {
      ok: false,
      error: `${input.providerName} could not be reached.`,
      model: input.model,
      usage: null,
      finishReason: null,
      truncated: false,
      status: null,
      retryAfterMs: null,
    };
  }
  const payload = (await response.json().catch(() => null)) as {
    model?: unknown;
    choices?: Array<{ message?: { content?: unknown }; finish_reason?: unknown }>;
    usage?: { prompt_tokens?: unknown; completion_tokens?: unknown };
  } | null;
  const choice = payload?.choices?.[0];
  const text = choice?.message?.content;
  const reported = typeof payload?.model === "string" ? acceptedModelId(payload.model) : null;
  const model = reported ?? input.model;
  const retryAfter = retryAfterMs(response.headers.get("retry-after"));
  if (!response.ok || typeof text !== "string" || !text.trim()) {
    return {
      ok: false,
      error: `${input.providerName} returned status ${response.status} without a usable reply.`,
      model,
      usage: null,
      finishReason: null,
      truncated: false,
      status: response.status,
      retryAfterMs: retryAfter,
    };
  }
  if (text.length > 200_000) {
    return {
      ok: false,
      error: `${input.providerName} reply was too large to store.`,
      model,
      usage: null,
      finishReason: null,
      truncated: false,
      status: response.status,
      retryAfterMs: null,
    };
  }
  const finishReason = typeof choice?.finish_reason === "string" ? choice.finish_reason : null;
  const usage = payload?.usage
    ? {
        promptTokens: typeof payload.usage.prompt_tokens === "number" ? payload.usage.prompt_tokens : null,
        completionTokens: typeof payload.usage.completion_tokens === "number" ? payload.usage.completion_tokens : null,
      }
    : null;
  return {
    ok: true,
    text,
    model,
    usage,
    finishReason,
    truncated: finishReason === "length" || finishReason === "max_tokens",
    status: response.status,
    retryAfterMs: null,
  };
}
