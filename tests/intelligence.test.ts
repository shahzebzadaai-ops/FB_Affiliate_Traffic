import { createServer, type Server } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase, resetDatabase, seedDatabase } from "@/db/setup";
import { getSql } from "@/db/client";
import { novitaPublicStatus, researchPublicStatus } from "@/domain/intelligence";
import { episodePackage, monetisationAdvice, pilotSchema, seriesLaunchAdvice, type PilotBody } from "@/domain/stories";
import { setEngine } from "@/server/intelligence";
import { approveSeries, generatePilot, saveStoryClip } from "@/server/stories";

const databaseUrl = process.env.DATABASE_URL ?? "";
let server: Server;
let baseUrl = "";
let requests = 0;
let reply: unknown = { broken: true };

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
    summary: "An original meeting in a British coastal town becomes harder to explain.",
    previousEpisode: number === 1 ? "" : "The previous episode ended on the unanswered question.",
    voiceover: "She had rehearsed a quiet evening, and the evening refused to stay quiet.",
    dialogue: "I was not looking for you.",
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
      (server as Server & { lastAuth?: string | null }).lastAuth = req.headers.authorization ?? null;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(reply) } }],
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
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("intelligence status", () => {
  it("does not treat a missing search API as a live result", () => {
    expect(researchPublicStatus({}).available).toBe(false);
    expect(researchPublicStatus({}).message).toContain("Live research is unavailable");
    expect(researchPublicStatus({ RESEARCH_PROVIDER: "example", RESEARCH_API_KEY: "secret" }).message).toContain("no adapter");
  });

  it("requires both a Novita key and a model id", () => {
    expect(novitaPublicStatus({}).configured).toBe(false);
    expect(novitaPublicStatus({ NOVITA_API_KEY: "present" }).missing).toContain("NOVITA_MODEL");
  });

  it("does not recommend a launch or a dating offer without measurements", () => {
    const launch = seriesLaunchAdvice({ completedEpisodes: 5, measuredDays: null, hasPerformance: false, pageActive: null });
    expect(launch.state).toBe("RESEARCHING");
    expect(launch.recommendation).not.toBe("Launch now");
    expect(monetisationAdvice().revenue).toBeNull();
    expect(monetisationAdvice().conversions).toBeNull();
  });
});

describe("romance pilot", () => {
  it("refuses to invent a series when Novita is not configured", async () => {
    delete process.env.NOVITA_API_KEY;
    delete process.env.NOVITA_MODEL;
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
    expect(missing.error).toContain("NOVITA_API_KEY");
    expect(called).toBe(0);
    const publishing = await setEngine("publishing", "STARTED");
    expect(publishing.ok).toBe(false);
  });

  it("stores a contract-test pilot and does not publish it", async () => {
    reply = pilotFixture();
    expect(pilotSchema.safeParse(reply).success).toBe(true);
    const sample = episodePackage(pilotFixture(), pilotFixture().episodes[0]);
    expect(sample.prompts).toHaveLength(4);
    expect(sample.publishing).toBe("disabled");
    process.env.NOVITA_API_KEY = "test-key-not-real";
    process.env.NOVITA_MODEL = "test/mock-model";
    process.env.NOVITA_BASE_URL = baseUrl;
    requests = 0;
    const created = await generatePilot();
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const probe = server as Server & { lastAuth?: string | null; lastBody?: string };
    expect(requests).toBe(1);
    expect(probe.lastAuth).toBe("Bearer test-key-not-real");
    expect(probe.lastBody).toContain("test/mock-model");
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
  });
});
