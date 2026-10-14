import { languagePublicStatus, type LanguageProviderId } from "@/domain/intelligence";
import {
  bibleContinuity,
  bibleSchema,
  bibleUserPrompt,
  coerceNumericStrings,
  conceptSchema,
  conceptUserPrompt,
  episodeContinuity,
  characterMentioned,
  episodeDurationOk,
  episodeScriptSchema,
  episodeText,
  episodeUserPrompt,
  joinStringArrays,
  outlineContinuity,
  outlineSchema,
  outlineUserPrompt,
  PILOT_SYSTEM,
  pilotSchema,
  type PilotBody,
  type PilotEpisode,
} from "@/domain/stories";
import { languageChat } from "@/server/language";
import { parseModelJson } from "@/server/novita";
import type { ChatUsage } from "@/server/openai-chat";
import type { ZodType } from "zod";

const STAGE_TOKENS = { concept: 1000, bible: 1400, outline: 2000, episode: 2000 } as const;
const CONTENT_ATTEMPTS = 2;
const TOKEN_WINDOW_MS = 60_000;
const TOKEN_PAUSE_AT = 4_500;
const MAX_TOKEN_PAUSE_MS = 45_000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type UsageTotal = { promptTokens: number; completionTokens: number; counted: boolean };

export type PilotRun =
  | {
      ok: true;
      story: PilotBody;
      provider: LanguageProviderId;
      model: string;
      modelsByStage: Record<string, string>;
      usage: { promptTokens: number; completionTokens: number } | null;
      finishReasons: Record<string, string | null>;
    }
  | { ok: false; error: string; model: string | null; stage: string };

function noteUsage(total: UsageTotal, usage: ChatUsage | null) {
  if (!usage) return;
  if (typeof usage.promptTokens === "number") {
    total.promptTokens += usage.promptTokens;
    total.counted = true;
  }
  if (typeof usage.completionTokens === "number") {
    total.completionTokens += usage.completionTokens;
    total.counted = true;
  }
}

function schemaDetail(issues: { path: PropertyKey[]; message: string }[]) {
  return issues.slice(0, 6).map((issue) => `${issue.path.map(String).join(".") || "body"}: ${issue.message}`).join("; ");
}

function providerModels(): string[] {
  const selected = languagePublicStatus();
  if (selected.active === "freellmapi") {
    return [...new Set([selected.model, selected.fallbackModel].filter((model): model is string => Boolean(model)))];
  }
  return selected.model ? [selected.model] : [];
}

async function paceSharedMinute(usage: ChatUsage | null, window: { started: number; tokens: number }) {
  const added = (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0);
  if (!added) return;
  const now = Date.now();
  if (now - window.started >= TOKEN_WINDOW_MS) {
    window.started = now;
    window.tokens = 0;
  }
  window.tokens += added;
  if (window.tokens < TOKEN_PAUSE_AT) return;
  const wait = Math.min(MAX_TOKEN_PAUSE_MS, Math.max(0, TOKEN_WINDOW_MS - (Date.now() - window.started)));
  if (wait > 0) await delay(wait);
  window.started = Date.now();
  window.tokens = 0;
}

async function runStage<T>(
  stage: string,
  schema: ZodType<T>,
  user: string,
  maxTokens: number,
  continuity: (value: T) => string | null,
  fetchImpl: typeof fetch,
  total: UsageTotal,
  window: { started: number; tokens: number },
): Promise<{ ok: true; value: T; model: string; finishReason: string | null } | { ok: false; error: string; model: string | null }> {
  const models = providerModels();
  let lastError = "The model did not return a usable reply.";
  let lastModel: string | null = models[0] ?? null;
  for (const model of models) {
    for (let attempt = 1; attempt <= CONTENT_ATTEMPTS; attempt += 1) {
      const prompt = attempt === 1
        ? user
        : `${user}\n\nThe previous reply was not accepted. ${lastError}\nReply with one complete JSON object for this stage only. Do not continue a fragment. Rewrite every field named in the error as a complete sentence of your own. Do not copy one field into another.`;
      const chat = await languageChat({
        system: PILOT_SYSTEM,
        user: prompt,
        maxTokens,
        models: [model],
        reasoningEffort: "low",
      }, fetchImpl);
      noteUsage(total, chat.usage);
      await paceSharedMinute(chat.usage, window);
      lastModel = chat.model ?? model;
      if (!chat.ok) {
        lastError = chat.error;
        break;
      }
      if (chat.truncated) {
        lastError = "The reply was cut off before it finished.";
        continue;
      }
      let parsed: unknown;
      try {
        parsed = parseModelJson(chat.text);
      } catch {
        lastError = "The model reply was not JSON.";
        continue;
      }
      const checked = schema.safeParse(coerceNumericStrings(joinStringArrays(parsed)));
      if (!checked.success) {
        lastError = `The reply did not match the ${stage} schema. ${schemaDetail(checked.error.issues)}`;
        continue;
      }
      const problem = continuity(checked.data);
      if (problem) {
        lastError = problem;
        continue;
      }
      return { ok: true, value: checked.data, model: chat.model, finishReason: chat.finishReason };
    }
  }
  return { ok: false, error: lastError, model: lastModel };
}

function seriesModel(modelsByStage: Record<string, string>) {
  const ordered: string[] = [];
  for (const model of Object.values(modelsByStage)) {
    if (!ordered.includes(model)) ordered.push(model);
  }
  return ordered.join(", ");
}

function storyContinuity(story: PilotBody): string | null {
  const names = story.characters.map((character) => character.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return "Character names must be unique.";
  const numbers = story.episodes.map((episode) => episode.number).slice().sort((left, right) => left - right);
  if (numbers.join(",") !== "1,2,3,4,5") return "Episodes must be numbered 1 to 5.";
  for (const episode of story.episodes) {
    if (!episodeDurationOk(episode)) return `Episode ${episode.number} is outside 30 to 90 seconds.`;
    const blob = episodeText(episode).toLowerCase();
    if (!names.some((name) => characterMentioned(blob, name))) return `Episode ${episode.number} does not name a story character.`;
  }
  return null;
}

export async function runPilot(fetchImpl: typeof fetch = fetch): Promise<PilotRun> {
  const selected = languagePublicStatus();
  if (!selected.configured || !selected.active || !selected.provider) {
    return { ok: false, error: `No language model is configured. Missing ${selected.missing.join(", ")}.`, model: null, stage: "provider" };
  }
  const total: UsageTotal = { promptTokens: 0, completionTokens: 0, counted: false };
  const window = { started: Date.now(), tokens: 0 };
  const modelsByStage: Record<string, string> = {};
  const finishReasons: Record<string, string | null> = {};
  const remember = (stage: string, model: string, finishReason: string | null) => {
    modelsByStage[stage] = model;
    finishReasons[stage] = finishReason;
  };

  const concept = await runStage("concept", conceptSchema, conceptUserPrompt(), STAGE_TOKENS.concept, () => null, fetchImpl, total, window);
  if (!concept.ok) return { ok: false, error: concept.error, model: concept.model, stage: "concept" };
  remember("concept", concept.model, concept.finishReason);

  const bible = await runStage("story bible", bibleSchema, bibleUserPrompt(concept.value), STAGE_TOKENS.bible, bibleContinuity, fetchImpl, total, window);
  if (!bible.ok) return { ok: false, error: bible.error, model: bible.model, stage: "story-bible" };
  remember("story-bible", bible.model, bible.finishReason);

  const outline = await runStage(
    "season outline",
    outlineSchema,
    outlineUserPrompt(concept.value, bible.value),
    STAGE_TOKENS.outline,
    outlineContinuity,
    fetchImpl,
    total,
    window,
  );
  if (!outline.ok) return { ok: false, error: outline.error, model: outline.model, stage: "season-outline" };
  remember("season-outline", outline.model, outline.finishReason);

  const episodes: PilotEpisode[] = [];
  for (const number of [1, 2, 3, 4, 5]) {
    const episode = await runStage(
      `episode ${number}`,
      episodeScriptSchema,
      episodeUserPrompt(concept.value, bible.value, outline.value, number),
      STAGE_TOKENS.episode,
      (value) => episodeContinuity(value, bible.value, number),
      fetchImpl,
      total,
      window,
    );
    if (!episode.ok) return { ok: false, error: episode.error, model: episode.model, stage: `episode-${number}` };
    remember(`episode-${number}`, episode.model, episode.finishReason);
    episodes.push(episode.value);
  }

  const assembled = {
    ...concept.value,
    ...bible.value,
    seasonArc: outline.value.seasonArc,
    reveals: outline.value.reveals,
    endingDirection: outline.value.endingDirection,
    episodes: episodes.slice().sort((left, right) => left.number - right.number),
  };
  const story = pilotSchema.safeParse(assembled);
  if (!story.success) {
    return {
      ok: false,
      error: `The finished story did not match the story schema. ${schemaDetail(story.error.issues)}`,
      model: seriesModel(modelsByStage),
      stage: "assemble",
    };
  }
  const problem = storyContinuity(story.data);
  if (problem) return { ok: false, error: problem, model: seriesModel(modelsByStage), stage: "continuity" };
  return {
    ok: true,
    story: story.data,
    provider: selected.provider,
    model: seriesModel(modelsByStage),
    modelsByStage,
    usage: total.counted ? { promptTokens: total.promptTokens, completionTokens: total.completionTokens } : null,
    finishReasons,
  };
}
