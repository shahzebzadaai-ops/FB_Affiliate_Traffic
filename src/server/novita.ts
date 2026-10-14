import { novitaBaseUrl, novitaPublicStatus } from "@/domain/intelligence";

type ChatResult =
  | { ok: true; text: string; model: string; usage: { promptTokens: number | null; completionTokens: number | null } | null }
  | { ok: false; error: string; model: string | null };

export async function novitaChat(
  input: { system: string; user: string },
  fetchImpl: typeof fetch = fetch,
): Promise<ChatResult> {
  const status = novitaPublicStatus();
  if (!status.configured || !status.model) {
    return { ok: false, error: `Novita is not configured. Missing ${status.missing.join(", ")}.`, model: status.model };
  }
  const apiKey = process.env.NOVITA_API_KEY?.trim() ?? "";
  const endpoint = `${novitaBaseUrl()}/v1/chat/completions`;
  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: status.model,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        temperature: 0.4,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    return { ok: false, error: "Novita could not be reached.", model: status.model };
  }
  const payload = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: unknown } }>;
    usage?: { prompt_tokens?: unknown; completion_tokens?: unknown };
  } | null;
  const text = payload?.choices?.[0]?.message?.content;
  if (!response.ok || typeof text !== "string" || !text.trim()) {
    return { ok: false, error: `Novita returned status ${response.status} without a usable reply.`, model: status.model };
  }
  if (text.length > 200_000) return { ok: false, error: "Novita reply was too large to store.", model: status.model };
  const usage = payload?.usage
    ? {
        promptTokens: typeof payload.usage.prompt_tokens === "number" ? payload.usage.prompt_tokens : null,
        completionTokens: typeof payload.usage.completion_tokens === "number" ? payload.usage.completion_tokens : null,
      }
    : null;
  return { ok: true, text, model: status.model, usage };
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
