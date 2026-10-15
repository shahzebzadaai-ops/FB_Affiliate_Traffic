import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase, resetDatabase, seedDatabase } from "@/db/setup";
import { getSql } from "@/db/client";
import { pageByCode } from "@/domain/pages";
import {
  alignEvaluationSources,
  alignScriptSources,
  buildResearchHandoff,
  groundEvaluation,
  groundScript,
  handoffMarkdown,
  prepareModelObject,
  researchEvaluationSchema,
  reelScriptSchema,
  type ResearchEvaluation,
  type ResearchSource,
  type ReelScript,
} from "@/domain/research-package";
import { createAccount } from "@/server/accounts";
import { setEngine } from "@/server/intelligence";
import {
  approveResearchCandidate,
  createResearchPackage,
  evaluateResearchPackage,
  generateResearchPackage,
  readResearchPackage,
} from "@/server/research-package";

const databaseUrl = process.env.DATABASE_URL ?? "";
const originalEnv = { ...process.env };

const sources: ResearchSource[] = [
  {
    url: "https://www.independent.co.uk/life-style/first-date-nerves-tips-help-b2621752.html",
    sourceDate: "2024-10-01",
    theme: "First-date nerves and pressure to perform",
    evidence: "Lauren Taylor, 1 October 2024, reports psychologist Dr Lalitaa Suglani saying it is completely normal to struggle to be your true self on a first date. The article says first dates carry pressure to make a good impression and fear of rejection. It also says early dates are often treated as make-or-break auditions.",
    notes: "",
  },
  {
    url: "https://www.theguardian.com/lifeandstyle/2020/mar/09/hope-and-heart-sinks-what-it-is-really-like-to-date-online-as-a-woman-in-your-40s",
    sourceDate: "2020-03-09",
    theme: "Dating again in your forties",
    evidence: "Remona Aly, published 9 March 2020, describes going on her first date in a year at age 41 and hours of swiping that left her unsure whether to feel flattered or fatigued. The article includes Helen James, 49, a single mother in London, who says she had to fit dating between mothering.",
    notes: "",
  },
];

function evaluationFixture(): ResearchEvaluation {
  return {
    confirmed: [
      { sourceIndex: 0, statement: "The Independent article says first dates carry pressure to make a good impression and fear of rejection." },
      { sourceIndex: 1, statement: "The Guardian article describes a 41-year-old going on a first date after a year, and a 49-year-old single mother fitting dating between mothering." },
    ],
    interpretation: ["A short fictional Reel could show the private pep talk before a date without claiming the sources are customers."],
    notEstablished: ["Neither source records views, shares, or how a UK Facebook audience would respond."],
    candidates: [
      {
        id: "c1",
        title: "The coat-check pep talk",
        audience: "UK adults in their forties who are dating again",
        insight: "The saved articles describe first dates as auditions. A fictional scene can show someone lowering that pressure before they leave the house.",
        relevance: { score: "high", reason: "Both sources discuss adults around 40 and older who are dating again in Britain." },
        evidenceStrength: { score: "medium", reason: "Two published articles describe the pressure. They are not a community thread with many speakers.", sourceIndexes: [0, 1] },
        emotionalOrPractical: { score: "high", reason: "The nerves are a feeling a viewer can recognise before a date." },
        reelPotential: { score: "high", reason: "A hallway, a mirror, and a last look at the door can carry a 20 second scene." },
        discussionMotivation: { score: "medium", reason: "Viewers may answer whether they still treat a first date as an audition." },
        pageAlignment: { score: "high", reason: "Back in the Game UK is about dating again after a long relationship, in a warm tone." },
        repetition: { score: "unknown", reason: "The planned hooks were listed, and this idea does not copy one of those sentences." },
        uncertainty: "The articles do not say this situation is the most common one for the Page.",
        rank: 1,
      },
      {
        id: "c2",
        title: "Fitting a date between the school run",
        audience: "UK adults dating again around family life",
        insight: "Helen James describes fitting dating between mothering. A fictional Reel can show the clock, not a real family.",
        relevance: { score: "medium", reason: "One source mentions a 49-year-old parent. The other is about first-date nerves more generally." },
        evidenceStrength: { score: "medium", reason: "The parent detail comes from one named interview in the Guardian piece.", sourceIndexes: [1] },
        emotionalOrPractical: { score: "medium", reason: "Time pressure is practical, and the sources do not measure how often it happens." },
        reelPotential: { score: "medium", reason: "A clock and a front door are enough for a short scene." },
        discussionMotivation: { score: "medium", reason: "Parents may comment on whether a short date is easier." },
        pageAlignment: { score: "medium", reason: "The Page includes second chances, while parenting is not its only pillar." },
        repetition: { score: "unknown", reason: "No saved performance data says this angle has already been posted." },
        uncertainty: "One interview is not evidence that this is typical for the whole Page.",
        rank: 2,
      },
    ],
  };
}

function scriptFixture(): ReelScript {
  return {
    title: "Before the date feels like an audition",
    audience: "UK adults in their forties who are dating again",
    topic: "Lowering the pressure of a first date",
    insight: "The saved articles describe first dates as high-stakes auditions. This fictional Reel shows someone choosing a smaller goal before they leave.",
    hook: "You do not have to win the date.",
    script: "A woman in her forties pauses at the hallway mirror. She says she does not have to win the evening. She buttons her coat, checks the time, and leaves for a short coffee. The last line asks whether a first date still feels like an audition.",
    voiceover: "You do not have to win the date. It can just be a coffee, a conversation, and a way home if it is not for you. Does a first date still feel like an audition?",
    caption: "A first date can feel like an audition before you have even left the house. This is a fictional scene, not a customer story. Does a first date still feel like an audition?",
    engagementQuestion: "Does a first date still feel like an audition?",
    cta: "Comments only",
    scenes: [1, 2, 3, 4].map((number) => ({
      number,
      durationSeconds: 6,
      voiceover: number === 1 ? "You do not have to win the date." : number === 4 ? "Does a first date still feel like an audition?" : "It can just be a coffee and a way home.",
      onScreenText: number === 1 ? "You do not have to win the date." : "",
      subtitle: number === 4 ? "Does a first date still feel like an audition?" : "A fictional first-date pause.",
      visual: "A British hallway with a coat, a mirror, and warm evening light. One adult, no logo.",
      camera: "Steady close shot, readable in the first seconds.",
      lighting: "Warm practical lamp, no studio advert look.",
      environment: "A lived-in UK hallway, coat hooks, and a front door.",
      motion: "A small pause, then a hand on the coat.",
      continuity: "Same person, same navy coat, same hallway as the other scenes.",
      character: "One fictional woman in her forties, natural hair, navy coat, no celebrity likeness.",
    })),
    referenceImages: [
      {
        id: "hallway-reference",
        purpose: "Optional still of the hallway and coat, if a reference is needed later.",
        prompt: "Vertical 9:16 still of a lived-in British hallway, navy coat on a hook, warm lamp, no people, no logo, no text.",
        generated: false,
      },
    ],
    uncertainty: "The sources do not prove that this scene will start a conversation.",
    evidenceUsed: [0, 1],
  };
}

function chat(content: unknown) {
  return new Response(JSON.stringify({
    model: "openai/gpt-oss-120b",
    choices: [{ message: { content: JSON.stringify(content) }, finish_reason: "stop" }],
    usage: { prompt_tokens: 11, completion_tokens: 22 },
  }), { status: 200, headers: { "content-type": "application/json" } });
}

beforeAll(async () => {
  await migrateDatabase(databaseUrl);
  await resetDatabase(databaseUrl);
  await seedDatabase(databaseUrl);
}, 120_000);

afterAll(() => {
  for (const key of ["LANGUAGE_PROVIDER", "FREELLMAPI_API_KEY", "FREELLMAPI_MODEL", "FREELLMAPI_FALLBACK_MODEL", "FREELLMAPI_BASE_URL", "NOVITA_API_KEY", "NOVITA_MODEL"]) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

describe("research package grounding", () => {
  it("rejects engagement counts and urls that were not saved", () => {
    const evaluation = evaluationFixture();
    expect(researchEvaluationSchema.safeParse(evaluation).success).toBe(true);
    expect(groundEvaluation(evaluation, sources)).toBeNull();
    evaluation.confirmed[0].statement = "The thread has 1200 upvotes and agrees with the article.";
    expect(groundEvaluation(evaluation, sources)).toMatch(/engagement count/);
    evaluation.confirmed[0].statement = "See https://example.com/invented for the trend.";
    expect(groundEvaluation(evaluation, sources)).toMatch(/URL/);
  });

  it("accepts the numbered-object shape the language model returns", () => {
    const prepared = prepareModelObject({
      confirmed: {
        0: { summary: "The saved article says first dates carry pressure to make a good impression." },
        1: { summary: "The second article describes a forty-one-year-old going on a first date after a year." },
      },
      interpretation: { 0: "A fictional Reel can show the pressure without claiming a real customer." },
      notEstablished: ["The source does not record views or shares."],
      candidates: [
        {
          id: "c1",
          title: "The audition-free first date",
          audience: "UK adults dating again in their forties",
          insight: "The saved article describes first dates as auditions, so a fictional scene can lower that pressure.",
          relevance: { score: "High", reason: "The source is about first-date pressure for adults." },
          evidenceStrength: { sourceIndexes: ["0"] },
          emotionalOrPractical: { score: "high", reason: "The nerves are a feeling a viewer can recognise." },
          reelPotential: { score: "high", reason: "A hallway and a coat can carry a short scene." },
          discussionMotivation: { score: "medium", reason: "Viewers may say whether a date still feels like a test." },
          pageAlignment: { score: "high", reason: "The Page is about dating again after a long relationship." },
          repetition: { score: "unknown", reason: "No saved performance says this hook was already posted." },
          uncertainty: "low",
          rank: "1",
        },
        {
          id: "c2",
          title: "One conversation, not a hundred profiles",
          audience: "UK adults dating again in their forties",
          insight: "The second source describes swiping fatigue, which can become a fictional pause before a date.",
          relevance: { score: "medium", reason: "One source describes fatigue from many profiles." },
          evidenceStrength: { sourceIndexes: [1] },
          emotionalOrPractical: { score: "medium", reason: "The fatigue is practical and the source does not measure it." },
          reelPotential: { score: "medium", reason: "A phone put face down is enough for one scene." },
          discussionMotivation: { score: "medium", reason: "Viewers may mention their own limit." },
          pageAlignment: { score: "medium", reason: "The Page is warmer than an app tutorial." },
          repetition: { score: "unknown", reason: "No post history says this angle has shipped." },
          uncertainty: "One interview is not a trend.",
          rank: 2,
        },
      ],
    });
    const parsed = researchEvaluationSchema.safeParse(prepared);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.confirmed[0]?.sourceIndex).toBe(0);
    expect(parsed.data.candidates[0]?.evidenceStrength.score).toBe("medium");
    expect(parsed.data.candidates[0]?.uncertainty.length).toBeGreaterThan(11);
  });

  it("repairs a script that names the topic as an id and omits image instructions", () => {
    const prepared = prepareModelObject({
      title: "From the sofa to the cafe",
      audience: "UK adults dating again in their forties",
      topic: "c1",
      insight: "A fictional scene can show leaving the sofa for a short coffee.",
      hook: "You do not have to win the date.",
      script: "A woman in her forties pauses at home, puts on a navy sweater, and leaves for a short coffee. The last line asks whether a first date still feels like an audition.",
      voiceover: "Warm and hopeful",
      caption: "A first date can feel like an audition before you have left the house. Does a first date still feel like an audition?",
      engagementQuestion: "Does a first date still feel like an audition?",
      cta: "Comments only",
      scenes: [1, 2, 3, 4].map((number) => ({
        number,
        durationSeconds: 6,
        voiceover: number === 1 ? "You do not have to win the date." : "It can just be a coffee and a way home.",
        onScreenText: "",
        subtitle: "A fictional first-date pause.",
        visual: "A British hallway with a navy coat and warm evening light.",
        camera: "Steady close shot.",
        lighting: "Warm practical lamp.",
        environment: "A lived-in UK hallway.",
        motion: "A small pause.",
        continuity: "Same fictional woman, same navy sweater, same hallway.",
        character: number === 1 ? "Fictional woman in her forties" : "Same woman",
      })),
      referenceImages: false,
      uncertainty: "none",
      evidenceUsed: [0, 1],
    });
    const parsed = reelScriptSchema.safeParse(prepared);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.topic).toBe("From the sofa to the cafe");
    expect(parsed.data.voiceover).toContain("You do not have to win the date.");
    expect(parsed.data.referenceImages[0]?.generated).toBe(false);
    expect(parsed.data.referenceImages[0]?.prompt).toContain("9:16");
    expect(parsed.data.scenes[1]?.character.length).toBeGreaterThanOrEqual(12);
    expect(groundScript(parsed.data, sources)).toBeNull();
  });

  it("drops source numbers that were not saved and keeps one-based indexes", () => {
    const evaluation = evaluationFixture();
    evaluation.confirmed.push(
      { sourceIndex: 6, statement: "This cites a source that was never saved." },
      { sourceIndex: 7, statement: "This cites another missing source." },
    );
    evaluation.candidates[0].evidenceStrength.sourceIndexes = [1, 2, 8];
    const aligned = alignEvaluationSources(evaluation, sources.length);
    expect(aligned.confirmed).toHaveLength(2);
    expect(aligned.confirmed.map((item) => item.sourceIndex)).toEqual([0, 1]);
    expect(aligned.candidates[0]?.evidenceStrength.sourceIndexes).toEqual([1]);
    expect(groundEvaluation(aligned, sources)).toBeNull();
    const oneBased = evaluationFixture();
    oneBased.confirmed = oneBased.confirmed.map((item) => ({ ...item, sourceIndex: item.sourceIndex + 1 }));
    oneBased.candidates = oneBased.candidates.map((candidate) => ({
      ...candidate,
      evidenceStrength: {
        ...candidate.evidenceStrength,
        sourceIndexes: candidate.evidenceStrength.sourceIndexes.map((index) => index + 1),
      },
    }));
    const shifted = alignEvaluationSources(oneBased, sources.length);
    expect(shifted.confirmed.map((item) => item.sourceIndex)).toEqual([0, 1]);
    expect(alignScriptSources({ ...scriptFixture(), evidenceUsed: [1, 2, 9] }, sources.length).evidenceUsed).toEqual([0, 1]);
  });

  it("builds a copyable package only when the reel is 20 to 35 seconds", () => {
    const script = scriptFixture();
    expect(reelScriptSchema.safeParse(script).success).toBe(true);
    expect(groundScript(script, sources)).toBeNull();
    const short = { ...script, scenes: script.scenes.map((scene) => ({ ...scene, durationSeconds: 4 })) };
    expect(groundScript(short, sources)).toMatch(/20–35/);
    const handoff = buildResearchHandoff({
      contentId: "RI-BGUK-001",
      page: pageByCode("BGUK"),
      sources,
      evaluation: evaluationFixture(),
      candidateId: "c1",
      script,
      model: "test-model",
    });
    expect(handoff.publishing).toBe("disabled");
    expect(handoff.liveResearch).toBe(false);
    expect(handoff.durationSeconds).toBe(24);
    expect(handoff.scenes).toHaveLength(4);
    expect(handoff.referenceImages[0]?.status).toBe("not-generated");
    expect(handoff.checklist.length).toBeGreaterThan(4);
    const markdown = handoffMarkdown(handoff);
    expect(handoff.scenes[1]?.prompt).toContain(script.scenes[0]?.character ?? "");
    expect(handoff.scenes[1]?.prompt).toContain(script.scenes[0]?.continuity ?? "");
    expect(markdown).toContain("Scene 1");
    expect(markdown).toContain("Copy one scene prompt");
    expect(markdown).not.toMatch(/password|apiKey|credential/i);
  });
});

describe("research package workflow", () => {
  it("stores evidence, explains topics, and writes a Muse package without publishing", async () => {
    const owner = await createAccount({
      personKey: "owner",
      email: "owner-research@example.com",
      name: "Owner",
      role: "SUPER_ADMIN",
      password: "owner-test-password",
    });
    expect(owner.ok).toBe(true);
    if (!owner.ok) return;
    const created = await createResearchPackage(owner.user.id, sources);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.contentId).toBe("RI-BGUK-001");
    let calls = 0;
    const paused = await evaluateResearchPackage(owner.user.id, created.contentId, async () => {
      calls += 1;
      return chat(evaluationFixture());
    });
    expect(paused.ok).toBe(false);
    if (paused.ok) return;
    expect(paused.status).toBe(409);
    expect(calls).toBe(0);
    process.env.LANGUAGE_PROVIDER = "freellmapi";
    process.env.FREELLMAPI_API_KEY = "router-test-key";
    process.env.FREELLMAPI_MODEL = "openai/gpt-oss-120b";
    process.env.FREELLMAPI_BASE_URL = "http://127.0.0.1:3001/v1";
    await setEngine("intelligence", "STARTED");
    const evaluated = await evaluateResearchPackage(owner.user.id, created.contentId, async (_url, init) => {
      calls += 1;
      const body = JSON.parse(String(init?.body ?? "{}")) as { messages?: Array<{ content?: string }> };
      const user = body.messages?.map((message) => message.content ?? "").join("\n") ?? "";
      expect(user).toContain("SOURCE 0");
      expect(user).not.toContain("router-test-key");
      return chat(user.includes("Approved topic") ? scriptFixture() : evaluationFixture());
    });
    expect(evaluated.ok).toBe(true);
    expect(calls).toBe(1);
    const early = await generateResearchPackage(owner.user.id, created.contentId, async () => chat(scriptFixture()));
    expect(early.ok).toBe(false);
    const approved = await approveResearchCandidate(owner.user.id, created.contentId, "c1");
    expect(approved.ok).toBe(true);
    const generated = await generateResearchPackage(owner.user.id, created.contentId, async () => chat(scriptFixture()));
    expect(generated.ok).toBe(true);
    const saved = await readResearchPackage(created.contentId);
    expect(saved?.status).toBe("PACKAGE_READY");
    expect(saved?.publishing).toBe("disabled");
    expect(saved?.muse_package?.scenes).toHaveLength(4);
    expect(saved?.markdown).toContain("RI-BGUK-001");
    expect(saved?.evidence[0]?.url).toContain("independent.co.uk");
    expect(JSON.stringify(saved)).not.toContain("router-test-key");
    const sql = getSql();
    const [items] = await sql<{ n: number }[]>`select count(*)::int as n from content_items`;
    const [stories] = await sql<{ n: number }[]>`select count(*)::int as n from story_series`;
    const [campaign] = await sql<{ status: string; not_started: boolean }[]>`
      select status, started_at is null as not_started from campaigns where id = 'uk-month-one'
    `;
    const [publishing] = await sql<{ state: string }[]>`select state from operating_controls where id = 'publishing'`;
    expect(items?.n).toBe(180);
    expect(stories?.n).toBe(0);
    expect(campaign).toMatchObject({ status: "BUILD", not_started: true });
    expect(publishing?.state).toBe("OFF");
    expect((await setEngine("publishing", "STARTED")).ok).toBe(false);
  });
});
