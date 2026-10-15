import { createServer, type Server } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase, resetDatabase, seedDatabase } from "@/db/setup";
import { getSql } from "@/db/client";
import { freellmapiPublicStatus, languagePublicStatus, novitaPublicStatus, researchPublicStatus, storagePublicStatus } from "@/domain/intelligence";
import { analyseSuppliedEvidence } from "@/server/intelligence";
import { characterMentioned, coerceNumericStrings, episodePackage, joinStringArrays, monetisationAdvice, pilotSchema, seriesLaunchAdvice, type PilotBody } from "@/domain/stories";
import { setEngine } from "@/server/intelligence";
import { approveSeries, generatePilot, saveStoryClip } from "@/server/stories";

const databaseUrl = process.env.DATABASE_URL ?? "";
let server: Server;
let baseUrl = "";
type PlannedReply = { status?: number; finishReason?: string | null; content?: unknown; headers?: Record<string, string> };

let requests = 0;
let reply: unknown = { broken: true };
let failRemaining = 0;
let planned: PlannedReply[] = [];
let forcedFinish: string | null = null;
let failModelPrefix = "";
let seenAuth: string[] = [];

function stagePayload(body: string, fixture: PilotBody): unknown {
  if (body.includes("STAGE: concept")) {
    return {
      seriesTitle: fixture.seriesTitle,
      genre: fixture.genre,
      audience: fixture.audience,
      premise: fixture.premise,
      themes: fixture.themes,
      whyTest: fixture.whyTest,
      assumptions: fixture.assumptions,
    };
  }
  if (body.includes("STAGE: story-bible")) {
    return {
      characters: fixture.characters,
      relationships: fixture.relationships,
      locations: fixture.locations,
      visualStyle: fixture.visualStyle,
      emotionalProgression: fixture.emotionalProgression,
      continuityRules: fixture.continuityRules,
    };
  }
  if (body.includes("STAGE: season-outline")) {
    return {
      seasonArc: fixture.seasonArc,
      reveals: fixture.reveals,
      endingDirection: fixture.endingDirection,
      episodes: fixture.episodes.map((episode) => ({
        number: episode.number,
        title: episode.title,
        hook: episode.hook,
        summary: episode.summary,
        previousEpisode: episode.previousEpisode,
        closingBeat: episode.closingBeat,
        nextEpisode: episode.nextEpisode,
      })),
    };
  }
  if (body.includes("STAGE: episode-script")) {
    const match = body.match(/EPISODE: (\d)/);
    const number = Number(match?.[1] ?? "1");
    return fixture.episodes.find((episode) => episode.number === number) ?? { broken: true };
  }
  return { broken: true };
}

function pilotFixture(): PilotBody {
  const scene = (number: number) => ({
    number,
    durationSeconds: 8,
    visualPrompt: "A natural British street at dusk, two adults in consistent wardrobe, vertical frame, no crowd looking at the camera.",
    camera: "Slow handheld at eye level.",
    lighting: "Warm shop light and cool evening air.",
    onScreenText: "She knew his name.",
    subtitle: "She knew his name, and she still stopped.",
    audio: "Quiet room tone. No music bed.",
    continuity: "Same coat, same hair, same street as the story bible.",
    negativePrompt: "No watermark, no extra people, no costume change.",
  });
  const episode = (number: number, title: string) => ({
    number,
    title,
    hook: "A familiar face appears where she did not expect anyone.",
    summary: "Mara Quinn and Owen Blake meet again in a British coastal town, and the meeting becomes harder to explain.",
    previousEpisode: number === 1 ? "" : "The previous episode ended on the unanswered question.",
    voiceover: "Mara Quinn had rehearsed a quiet evening, and Owen Blake was already on the platform.",
    dialogue: "Mara Quinn: I was not looking for you, Owen Blake.",
    closingBeat: "He answers a question she did not ask.",
    nextEpisode: "The next episode has to explain what he was holding.",
    scenes: [scene(1), scene(2), scene(3), scene(4)],
    caption: "An original story. Not a real dating profile.",
    thumbnailPrompt: "Two adults on a British seafront at dusk, consistent faces, no logo.",
  });
  return {
    seriesTitle: "The Last Train Home",
    genre: "Original romantic mystery",
    audience: "Adults in the United Kingdom who like short romantic stories.",
    premise: "Two people keep meeting on the same coastal line, and neither will say why they are there.",
    themes: ["second chances", "withheld truth"],
    characters: [
      { name: "Mara Quinn", role: "Station cafe owner", appearance: "Early forties, dark curls, a small scar at the eyebrow.", personality: "Direct, private, funny when tired.", wardrobe: "Navy wool coat and a cream scarf." },
      { name: "Owen Blake", role: "Returning engineer", appearance: "Late forties, short greying hair, weathered hands.", personality: "Careful, warm, slow to explain himself.", wardrobe: "Charcoal jacket and a faded blue shirt." },
    ],
    relationships: "They knew each other years ago and have not agreed what that meant.",
    locations: ["A coastal station in northern England"],
    visualStyle: "Natural evening light, ordinary clothes, no glossy advertisement look.",
    emotionalProgression: "Curiosity, then doubt, then a choice that costs something.",
    seasonArc: "Ten episodes can follow this pilot. The secret is personal, not criminal spectacle.",
    reveals: ["Owen still has a key to a house Mara sold."],
    continuityRules: ["Mara's scarf stays cream.", "Owen does not grow a beard between episodes."],
    endingDirection: "They tell the truth before either of them leaves the town.",
    episodes: [
      episode(1, "The platform"),
      episode(2, "The key"),
      episode(3, "The wrong name"),
      episode(4, "The house"),
      episode(5, "The answer"),
    ],
    whyTest: "A short mystery gives a reason to watch the next episode. This is a writing judgement, not a measured trend.",
    assumptions: ["No live search results were supplied."],
  };
}

beforeAll(async () => {
  delete process.env.LANGUAGE_PROVIDER;
  delete process.env.FREELLMAPI_API_KEY;
  delete process.env.FREELLMAPI_MODEL;
  delete process.env.FREELLMAPI_FALLBACK_MODEL;
  delete process.env.FREELLMAPI_BASE_URL;
  process.env.AFFIGROVE_MEDIA_DIR = mkdtempSync(path.join(tmpdir(), "affigrove-stories-"));
  await migrateDatabase(databaseUrl);
  await resetDatabase(databaseUrl);
  await seedDatabase(databaseUrl);
  server = createServer((req, res) => {
    requests += 1;
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      (server as Server & { lastBody?: string; lastAuth?: string | null }).lastBody = body;
      const authorization = req.headers.authorization ?? "";
      seenAuth.push(authorization);
      (server as Server & { lastAuth?: string | null }).lastAuth = authorization || null;
      res.setHeader("content-type", "application/json");
      const modelMatch = body.match(/"model":"([^"]+)"/);
      if (failModelPrefix && modelMatch?.[1]?.startsWith(failModelPrefix)) {
        res.statusCode = 503;
        res.end(JSON.stringify({ error: { message: "temporary" } }));
        return;
      }
      const next = planned.shift();
      if (next) {
        res.statusCode = next.status ?? 200;
        for (const [key, value] of Object.entries(next.headers ?? {})) res.setHeader(key, value);
        const finish = next.finishReason === undefined ? (forcedFinish ?? "stop") : next.finishReason;
        const content = typeof next.content === "string" ? next.content : JSON.stringify(next.content ?? {});
        res.end(JSON.stringify({
          choices: [{ message: { content }, finish_reason: finish }],
          usage: { prompt_tokens: 11, completion_tokens: 22 },
        }));
        return;
      }
      if (failRemaining > 0) {
        failRemaining -= 1;
        res.statusCode = 503;
        res.end(JSON.stringify({ error: { message: "temporary" } }));
        return;
      }
      const produced = typeof reply === "function" ? (reply as (text: string) => unknown)(body) : reply;
      const content = typeof produced === "string" ? produced : JSON.stringify(produced);
      res.end(JSON.stringify({
        choices: [{ message: { content }, finish_reason: forcedFinish ?? "stop" }],
        usage: { prompt_tokens: 11, completion_tokens: 22 },
      }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind.");
  baseUrl = `http://127.0.0.1:${address.port}`;
}, 120_000);

afterAll(async () => {
  delete process.env.NOVITA_API_KEY;
  delete process.env.NOVITA_MODEL;
  delete process.env.NOVITA_BASE_URL;
  delete process.env.FREELLMAPI_API_KEY;
  delete process.env.FREELLMAPI_MODEL;
  delete process.env.FREELLMAPI_FALLBACK_MODEL;
  delete process.env.FREELLMAPI_BASE_URL;
  delete process.env.LANGUAGE_PROVIDER;
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("intelligence status", () => {
  it("does not treat a missing search API as a live result", () => {
    expect(storagePublicStatus().permanent.configured).toBe(false);
    expect(storagePublicStatus().permanent.message).toContain("5 TB Google Drive");
    expect(storagePublicStatus().permanent.message).toContain("No automatic deletion");
    expect(researchPublicStatus({}).available).toBe(false);
    expect(researchPublicStatus({}).message).toContain("Live research is unavailable");
    expect(researchPublicStatus({ RESEARCH_PROVIDER: "example", RESEARCH_API_KEY: "secret" }).message).toContain("no adapter");
  });

  it("requires both a Novita key and a model id", () => {
    expect(novitaPublicStatus({}).configured).toBe(false);
    expect(novitaPublicStatus({ NOVITA_API_KEY: "present" }).missing).toContain("NOVITA_MODEL");
  });

  it("keeps FreeLLMAPI on loopback and prefers it over Novita", () => {
    expect(freellmapiPublicStatus({}).configured).toBe(false);
    expect(freellmapiPublicStatus({ FREELLMAPI_BASE_URL: "https://example.com/v1", FREELLMAPI_API_KEY: "router", FREELLMAPI_MODEL: "openai/gpt-oss-120b" }).baseUrl).toBe("http://127.0.0.1:3001/v1");
    const both = languagePublicStatus({
      FREELLMAPI_API_KEY: "router",
      FREELLMAPI_MODEL: "openai/gpt-oss-120b",
      FREELLMAPI_FALLBACK_MODEL: "openai/gpt-oss-20b",
      NOVITA_API_KEY: "novita",
      NOVITA_MODEL: "novita-model",
    });
    expect(both.active).toBe("freellmapi");
    expect(both.provider).toBe("freellmapi");
    expect(both.fallbackModel).toBe("openai/gpt-oss-20b");
    const novitaOnly = languagePublicStatus({ NOVITA_API_KEY: "novita", NOVITA_MODEL: "novita-model" });
    expect(novitaOnly.active).toBeNull();
    expect(novitaOnly.provider).toBe("freellmapi");
    expect(novitaOnly.configured).toBe(false);
    expect(languagePublicStatus({ NOVITA_API_KEY: "novita", NOVITA_MODEL: "novita-model", LANGUAGE_PROVIDER: "novita" }).active).toBe("novita");
    expect(languagePublicStatus({
      LANGUAGE_PROVIDER: "freellmapi",
      NOVITA_API_KEY: "novita",
      NOVITA_MODEL: "novita-model",
    }).configured).toBe(false);
  });

  it("does not recommend a launch or a dating offer without measurements", () => {
    const launch = seriesLaunchAdvice({ completedEpisodes: 5, measuredDays: null, hasPerformance: false, pageActive: null });
    expect(launch.state).toBe("RESEARCHING");
    expect(launch.recommendation).not.toBe("Launch now");
    expect(monetisationAdvice().revenue).toBeNull();
    expect(monetisationAdvice().conversions).toBeNull();
  });
});

function useStagedFixture() {
  reply = (body: string) => stagePayload(body, pilotFixture());
}

function resetRoute() {
  requests = 0;
  failRemaining = 0;
  planned = [];
  forcedFinish = null;
  failModelPrefix = "";
  seenAuth = [];
  delete process.env.LANGUAGE_PROVIDER;
  delete process.env.NOVITA_API_KEY;
  delete process.env.NOVITA_MODEL;
  delete process.env.NOVITA_BASE_URL;
  delete process.env.FREELLMAPI_API_KEY;
  delete process.env.FREELLMAPI_MODEL;
  delete process.env.FREELLMAPI_FALLBACK_MODEL;
  delete process.env.FREELLMAPI_BASE_URL;
}

function useRouter() {
  process.env.FREELLMAPI_API_KEY = "router-test-key";
  process.env.FREELLMAPI_MODEL = "openai/gpt-oss-120b";
  process.env.FREELLMAPI_FALLBACK_MODEL = "openai/gpt-oss-20b";
  process.env.FREELLMAPI_BASE_URL = `${baseUrl}/v1`;
}

describe("romance pilot", () => {
  it("refuses to invent a series when the selected provider is not configured", async () => {
    resetRoute();
    process.env.NOVITA_API_KEY = "test-key-not-real";
    process.env.NOVITA_MODEL = "test/mock-model";
    let called = 0;
    const paused = await generatePilot(async () => {
      called += 1;
      return new Response("no");
    });
    expect(paused.status).toBe(409);
    expect(called).toBe(0);
    await setEngine("intelligence", "STARTED");
    const missing = await generatePilot(async () => {
      called += 1;
      return new Response("no");
    });
    expect(missing.ok).toBe(false);
    if (missing.ok) return;
    expect(missing.status).toBe(409);
    expect(missing.error).toContain("FREELLMAPI_API_KEY");
    expect(missing.error).not.toContain("NOVITA_API_KEY");
    expect(called).toBe(0);
    process.env.LANGUAGE_PROVIDER = "novita";
    delete process.env.NOVITA_API_KEY;
    delete process.env.NOVITA_MODEL;
    const novitaMissing = await generatePilot(async () => {
      called += 1;
      return new Response("no");
    });
    expect(novitaMissing.ok).toBe(false);
    if (novitaMissing.ok) return;
    expect(novitaMissing.error).toContain("NOVITA_API_KEY");
    expect(called).toBe(0);
    const publishing = await setEngine("publishing", "STARTED");
    expect(publishing.ok).toBe(false);
  });

  it("stores a contract-test pilot and does not publish it", async () => {
    resetRoute();
    useStagedFixture();
    expect(pilotSchema.safeParse(pilotFixture()).success).toBe(true);
    const sample = episodePackage(pilotFixture(), pilotFixture().episodes[0]);
    expect(sample.prompts).toHaveLength(4);
    expect(sample.publishing).toBe("disabled");
    process.env.LANGUAGE_PROVIDER = "novita";
    process.env.NOVITA_API_KEY = "test-key-not-real";
    process.env.NOVITA_MODEL = "test/mock-model";
    process.env.NOVITA_BASE_URL = baseUrl;
    const created = await generatePilot();
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const probe = server as Server & { lastAuth?: string | null; lastBody?: string };
    expect(requests).toBe(8);
    expect(probe.lastAuth).toBe("Bearer test-key-not-real");
    expect(probe.lastBody).toContain("test/mock-model");
    expect(probe.lastBody).toContain("STAGE: episode-script");
    expect(probe.lastBody).toContain("\"max_tokens\":2000");
    expect(probe.lastBody).not.toContain("reasoning_effort");
    expect(probe.lastBody).not.toContain("test-key-not-real");
    const sql = getSql();
    const [series] = await sql<{ live_research: boolean; model: string; bible: string }[]>`
      select live_research, model, bible::text as bible from story_series where id = ${created.seriesId}
    `;
    expect(series.live_research).toBe(false);
    expect(series.model).toBe("test/mock-model");
    expect(series.bible).not.toContain("test-key-not-real");
    expect(series.bible).toContain("disabled");
    const episodes = await sql<{ n: number }[]>`
      select count(*)::int as n from story_episodes where series_id = ${created.seriesId}
    `;
    expect(episodes[0]?.n).toBe(5);
    const [episode] = await sql<{ id: string }[]>`
      select id from story_episodes where series_id = ${created.seriesId} and episode_number = 1
    `;
    const clip = await saveStoryClip({
      episodeId: episode.id,
      sceneNumber: 1,
      bytes: Buffer.from("not-a-playable-video"),
      filename: "shot.mp4",
    });
    expect(clip.ok).toBe(true);
    if (!clip.ok) return;
    expect(clip.assembled).toBe(false);
    expect(clip.storagePath.includes("..")).toBe(false);
    const approved = await approveSeries(created.seriesId);
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(approved.campaign).toMatchObject({ status: "BUILD", not_started: true });
    const [campaign] = await sql<{ status: string; started_at: Date | null }[]>`
      select status, started_at from campaigns where id = 'uk-month-one'
    `;
    expect(campaign).toMatchObject({ status: "BUILD", started_at: null });
    const [stored] = await sql<{ source: string }[]>`
      select bible->>'source' as source from story_series where id = ${created.seriesId}
    `;
    expect(stored.source).toBe("novita");
  });

  it("uses the FreeLLMAPI fallback model and still marks live research unused", async () => {
    resetRoute();
    useStagedFixture();
    useRouter();
    failModelPrefix = "openai/gpt-oss-120b";
    const created = await generatePilot();
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(requests).toBe(16);
    const probe = server as Server & { lastBody?: string; lastAuth?: string | null };
    expect(probe.lastAuth).toBe("Bearer router-test-key");
    expect(probe.lastBody).toContain("openai/gpt-oss-20b");
    expect(probe.lastBody).toContain("\"reasoning_effort\":\"low\"");
    expect(probe.lastBody).not.toContain("router-test-key");
    const sql = getSql();
    const [series] = await sql<{ live_research: boolean; model: string; source: string }[]>`
      select live_research, model, bible->>'source' as source from story_series where id = ${created.seriesId}
    `;
    expect(series.live_research).toBe(false);
    expect(series.model).toBe("openai/gpt-oss-20b");
    expect(series.source).toBe("freellmapi");
    const episodes = await sql<{ n: number }[]>`
      select count(*)::int as n from story_episodes where series_id = ${created.seriesId}
    `;
    expect(episodes[0]?.n).toBe(5);
  });

  it("stores supplied-evidence analysis without claiming a web search", async () => {
    resetRoute();
    reply = {
      observations: ["The note says the cafe is in Camden."],
      assumptions: ["No viewing figures were supplied."],
      storyImplications: ["A ten-episode romance could stay inside that cafe."],
    };
    useRouter();
    process.env.FREELLMAPI_MODEL = "openai/gpt-oss-20b";
    delete process.env.FREELLMAPI_FALLBACK_MODEL;
    await setEngine("intelligence", "PAUSED");
    const paused = await analyseSuppliedEvidence("A handwritten note about a Camden cafe and two regulars.");
    expect(paused.ok).toBe(false);
    await setEngine("intelligence", "STARTED");
    const saved = await analyseSuppliedEvidence("A handwritten note about a Camden cafe and two regulars.");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.analysis.webSearchPerformed).toBe(false);
    expect(saved.analysis.liveResearch).toBe(false);
    const sql = getSql();
    const [report] = await sql<{ live_research: boolean; kind: string }[]>`
      select live_research, kind from intelligence_reports where id = ${saved.reportId}
    `;
    expect(report).toMatchObject({ live_research: false, kind: "supplied-evidence" });
  });

  it("keeps model words and refuses to invent the rest of a story", async () => {
    const joined = joinStringArrays({
      relationships: ["They knew each other years ago.", "They have not agreed what that meant."],
      audience: "Adults",
      themes: "Trust, Secrets",
      locations: [{ name: "A coastal station in northern England" }],
    }) as { relationships: string; audience: string; themes: string; locations: unknown[] };
    expect(joined.relationships).toBe("They knew each other years ago. They have not agreed what that meant.");
    expect(characterMentioned("Ellie waits for Finch.", 'Eleanor "Ellie" Finch')).toBe(true);
    expect(characterMentioned("A woman waits at the station.", 'Eleanor "Ellie" Finch')).toBe(false);
    expect(joined.audience).toBe("Adults");
    expect(joined.themes).toBe("Trust, Secrets");
    expect(joined.locations).toEqual([{ name: "A coastal station in northern England" }]);
    expect(coerceNumericStrings({ number: "1", scenes: [{ durationSeconds: "8", number: "eight" }] })).toEqual({
      number: 1,
      scenes: [{ durationSeconds: 8, number: "eight" }],
    });
    resetRoute();
    useRouter();
    reply = (body: string) => {
      const payload = stagePayload(body, pilotFixture());
      if (body.includes("STAGE: story-bible") && payload && typeof payload === "object") {
        return {
          ...(payload as Record<string, unknown>),
          locations: [{ name: "A coastal station in northern England" }],
          continuityRules: "Mara's scarf stays cream. Owen does not grow a beard between episodes.",
        };
      }
      return payload;
    };
    const sql = getSql();
    const [before] = await sql<{ n: number }[]>`select count(*)::int as n from story_series`;
    const created = await generatePilot();
    expect(created.ok).toBe(false);
    if (created.ok) return;
    expect(created.error).toContain("story-bible");
    expect(created.error).not.toContain("Adults in the United Kingdom.");
    const [after] = await sql<{ n: number }[]>`select count(*)::int as n from story_series`;
    expect(after.n).toBe(before.n);
  });

  it("retries a cut-off reply and does not save the fragment", async () => {
    resetRoute();
    useRouter();
    delete process.env.FREELLMAPI_FALLBACK_MODEL;
    planned = [{ status: 200, finishReason: "length", content: "{\"seriesTitle\":\"Cut off" }];
    useStagedFixture();
    const created = await generatePilot();
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(requests).toBe(9);
    const sql = getSql();
    const [series] = await sql<{ title: string; bible: string; concept: string }[]>`
      select title, bible::text as bible, bible->'finishReasons'->>'concept' as concept
      from story_series where id = ${created.seriesId}
    `;
    expect(series.title).toBe("The Last Train Home");
    expect(series.bible).not.toContain("Cut off");
    expect(series.concept).toBe("stop");
  });

  it("does not save a story when every reply is truncated", async () => {
    resetRoute();
    useRouter();
    delete process.env.FREELLMAPI_FALLBACK_MODEL;
    forcedFinish = "length";
    useStagedFixture();
    const sql = getSql();
    const [before] = await sql<{ n: number }[]>`select count(*)::int as n from story_series`;
    const created = await generatePilot();
    expect(created.ok).toBe(false);
    expect(requests).toBe(2);
    const [after] = await sql<{ n: number }[]>`select count(*)::int as n from story_series`;
    expect(after.n).toBe(before.n);
  });

  it("retries an episode that drops its characters", async () => {
    resetRoute();
    useRouter();
    delete process.env.FREELLMAPI_FALLBACK_MODEL;
    let bare = 0;
    reply = (body: string) => {
      const payload = stagePayload(body, pilotFixture());
      if (!body.includes("STAGE: episode-script") || !body.includes("EPISODE: 1") || !payload || typeof payload !== "object") return payload;
      bare += 1;
      if (bare > 1) return payload;
      const episode = payload as PilotBody["episodes"][number];
      return {
        ...episode,
        summary: "An original meeting in a British coastal town becomes harder to explain.",
        voiceover: "She had rehearsed a quiet evening, and the evening refused to stay quiet.",
        dialogue: "I was not looking for you.",
        hook: "A familiar face appears where she did not expect anyone.",
      };
    };
    const created = await generatePilot();
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(requests).toBe(9);
    expect(bare).toBe(2);
  });

  it("retries a short rate-limit cooldown and skips a long one", async () => {
    resetRoute();
    useRouter();
    planned = [{ status: 429, headers: { "retry-after": "0" } }];
    useStagedFixture();
    const cooled = await generatePilot();
    expect(cooled.ok).toBe(true);
    if (!cooled.ok) return;
    expect(requests).toBe(9);
    const sql = getSql();
    const [cooledSeries] = await sql<{ model: string }[]>`select model from story_series where id = ${cooled.seriesId}`;
    expect(cooledSeries.model).toBe("openai/gpt-oss-120b");

    resetRoute();
    useRouter();
    planned = [{ status: 429, headers: { "retry-after": "30" } }];
    useStagedFixture();
    const started = Date.now();
    const skipped = await generatePilot();
    expect(Date.now() - started).toBeLessThan(10_000);
    expect(skipped.ok).toBe(true);
    if (!skipped.ok) return;
    expect(requests).toBe(9);
    const [skippedSeries] = await sql<{ model: string }[]>`select model from story_series where id = ${skipped.seriesId}`;
    expect(skippedSeries.model).toBe("openai/gpt-oss-20b, openai/gpt-oss-120b");
  });

  it("does not call Novita when the router fails", async () => {
    resetRoute();
    useRouter();
    process.env.NOVITA_API_KEY = "test-key-not-real";
    process.env.NOVITA_MODEL = "test/mock-model";
    process.env.NOVITA_BASE_URL = baseUrl;
    failModelPrefix = "openai/gpt-oss-";
    useStagedFixture();
    const sql = getSql();
    const [before] = await sql<{ n: number }[]>`select count(*)::int as n from story_series`;
    const created = await generatePilot();
    expect(created.ok).toBe(false);
    if (created.ok) return;
    expect(created.error).toContain("status 503");
    expect(requests).toBe(2);
    expect(seenAuth.every((value) => value === "Bearer router-test-key")).toBe(true);
    expect(seenAuth).not.toContain("Bearer test-key-not-real");
    const [after] = await sql<{ n: number }[]>`select count(*)::int as n from story_series`;
    expect(after.n).toBe(before.n);
  });
});
