import { z } from "zod";

export const LAUNCH_STATES = [
  "RESEARCHING",
  "PREPARING",
  "READY_FOR_PILOT",
  "TESTING",
  "RECOMMENDED_TO_LAUNCH",
  "PAUSED_FOR_IMPROVEMENT",
] as const;

export type LaunchState = (typeof LAUNCH_STATES)[number];

const sceneSchema = z.object({
  number: z.number().int().min(1).max(12),
  durationSeconds: z.number().int().min(2).max(12),
  visualPrompt: z.string().min(40).max(2000),
  camera: z.string().min(3).max(400),
  lighting: z.string().min(3).max(400),
  onScreenText: z.string().min(1).max(160),
  subtitle: z.string().min(1).max(240),
  audio: z.string().min(3).max(400),
  continuity: z.string().min(3).max(600),
  negativePrompt: z.string().min(3).max(600),
});

const episodeSchema = z.object({
  number: z.number().int().min(1).max(5),
  title: z.string().min(3).max(120),
  hook: z.string().min(10).max(400),
  summary: z.string().min(20).max(900),
  previousEpisode: z.string().max(400),
  voiceover: z.string().min(20).max(2500),
  dialogue: z.string().min(1).max(2500),
  closingBeat: z.string().min(10).max(500),
  nextEpisode: z.string().min(10).max(400),
  scenes: z.array(sceneSchema).min(3).max(8),
  caption: z.string().min(10).max(500),
  thumbnailPrompt: z.string().min(20).max(800),
});

export const pilotSchema = z.object({
  seriesTitle: z.string().min(3).max(120),
  genre: z.string().min(3).max(120),
  audience: z.string().min(10).max(400),
  premise: z.string().min(20).max(1200),
  themes: z.array(z.string().min(2).max(80)).min(2).max(6),
  characters: z.array(z.object({
    name: z.string().min(2).max(80),
    role: z.string().min(2).max(160),
    appearance: z.string().min(10).max(600),
    personality: z.string().min(10).max(600),
    wardrobe: z.string().min(5).max(300),
  })).min(2).max(4),
  relationships: z.string().min(10).max(800),
  locations: z.array(z.string().min(2).max(120)).min(1).max(6),
  visualStyle: z.string().min(10).max(600),
  emotionalProgression: z.string().min(10).max(600),
  seasonArc: z.string().min(20).max(1200),
  reveals: z.array(z.string().min(5).max(240)).min(1).max(6),
  continuityRules: z.array(z.string().min(5).max(240)).min(2).max(8),
  endingDirection: z.string().min(10).max(600),
  episodes: z.array(episodeSchema).length(5),
  whyTest: z.string().min(20).max(800),
  assumptions: z.array(z.string().min(5).max(300)).min(1).max(8),
});

export type PilotBody = z.infer<typeof pilotSchema>;
export type PilotEpisode = PilotBody["episodes"][number];

export const conceptSchema = pilotSchema.pick({
  seriesTitle: true,
  genre: true,
  audience: true,
  premise: true,
  themes: true,
  whyTest: true,
  assumptions: true,
});

export const bibleSchema = pilotSchema.pick({
  characters: true,
  relationships: true,
  locations: true,
  visualStyle: true,
  emotionalProgression: true,
  continuityRules: true,
});

const outlineEpisodeSchema = episodeSchema.pick({
  number: true,
  title: true,
  hook: true,
  summary: true,
  previousEpisode: true,
  closingBeat: true,
  nextEpisode: true,
});

export const outlineSchema = z.object({
  seasonArc: pilotSchema.shape.seasonArc,
  reveals: pilotSchema.shape.reveals,
  endingDirection: pilotSchema.shape.endingDirection,
  episodes: z.array(outlineEpisodeSchema).length(5),
});

export const episodeScriptSchema = episodeSchema;

export type StoryConcept = z.infer<typeof conceptSchema>;
export type StoryBible = z.infer<typeof bibleSchema>;
export type SeasonOutline = z.infer<typeof outlineSchema>;

const PROSE_KEYS = new Set([
  "seriesTitle", "genre", "audience", "premise", "whyTest", "relationships", "visualStyle",
  "emotionalProgression", "seasonArc", "endingDirection", "name", "role", "appearance",
  "personality", "wardrobe", "title", "hook", "summary", "previousEpisode", "voiceover",
  "dialogue", "closingBeat", "nextEpisode", "caption", "thumbnailPrompt", "visualPrompt",
  "camera", "lighting", "onScreenText", "subtitle", "audio", "continuity", "negativePrompt",
]);

const NUMERIC_KEYS = new Set(["number", "durationSeconds"]);

export function coerceNumericStrings(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => coerceNumericStrings(item));
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (NUMERIC_KEYS.has(key) && typeof item === "string" && /^-?\d+$/.test(item.trim())) next[key] = Number(item.trim());
    else next[key] = coerceNumericStrings(item);
  }
  return next;
}

export function joinStringArrays(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => joinStringArrays(item));
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (PROSE_KEYS.has(key) && Array.isArray(item) && item.every((entry) => typeof entry === "string")) {
      next[key] = item.map((entry) => entry.trim()).filter((entry) => entry.length > 0).join(" ");
    } else {
      next[key] = joinStringArrays(item);
    }
  }
  return next;
}

export function bibleContinuity(bible: StoryBible): string | null {
  const names = bible.characters.map((character) => character.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return "Character names must be unique.";
  return null;
}

export function outlineContinuity(outline: SeasonOutline): string | null {
  const numbers = outline.episodes.map((episode) => episode.number).slice().sort((left, right) => left - right);
  if (numbers.join(",") !== "1,2,3,4,5") return "The season outline must contain episodes numbered 1, 2, 3, 4 and 5 once each.";
  return null;
}

export function episodeText(episode: PilotEpisode): string {
  return [
    episode.title,
    episode.hook,
    episode.summary,
    episode.voiceover,
    episode.dialogue,
    ...episode.scenes.map((scene) => scene.visualPrompt),
  ].join(" ");
}

export function characterMentioned(text: string, name: string): boolean {
  const blob = text.toLowerCase();
  const tokens = name.toLowerCase().replace(/["“”']/g, " ").split(/[^a-z]+/).filter((token) => token.length >= 3);
  const distinctive = tokens.filter((token) => token.length >= 4);
  const usable = distinctive.length > 0 ? distinctive : tokens;
  return usable.some((token) => blob.includes(token));
}

export function episodeContinuity(episode: PilotEpisode, bible: StoryBible, expectedNumber: number): string | null {
  if (episode.number !== expectedNumber) return `The episode number must be ${expectedNumber}.`;
  const total = episode.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
  if (total < 30 || total > 90) return `Episode ${expectedNumber} totals ${total} seconds. The shot durations you wrote must add up to between 30 and 90.`;
  const names = bible.characters.map((character) => character.name.trim()).filter((name) => name.length > 0);
  const blob = episodeText(episode);
  if (!names.some((name) => characterMentioned(blob, name))) {
    return `Episode ${expectedNumber} must include at least one character name from the story bible: ${names.join(", ")}.`;
  }
  return null;
}

export function episodeDurationOk(episode: PilotEpisode): boolean {
  const total = episode.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
  return total >= 30 && total <= 90;
}

export const PILOT_SYSTEM = [
  "You write original short-form romance fiction for a United Kingdom audience.",
  "Reply with one JSON object and no markdown.",
  "Use JSON strings for every prose field. Do not return null or an empty string.",
  "Do not copy a published novel, film, series, or protected plot.",
  "Do not invent search interest, views, watch time, shares, or revenue.",
  "Do not claim a fictional character is a real person on a dating service.",
  "Do not add an affiliate call to action.",
  "Write in British English. Set the story in the United Kingdom.",
  "The story must be original. Publishing is disabled.",
  "No live web results are attached. Do not present assumptions as current trend data.",
  "Do not assign the series to a Facebook page. Brand names are not approved.",
].join(" ");

export function conceptUserPrompt(): string {
  return [
    "STAGE: concept",
    "Write only the series concept for a five-episode original romance micro-drama.",
    "Keep every string short enough to finish inside this reply.",
    "JSON keys: seriesTitle, genre, audience, premise, themes, whyTest, assumptions.",
    "themes is an array of 2 to 4 short strings, each under 40 characters.",
    "assumptions is an array of short strings. Say that no live search results were supplied.",
    "audience is one sentence about adults in the United Kingdom.",
  ].join("\n");
}

export function bibleUserPrompt(concept: StoryConcept): string {
  return [
    "STAGE: story-bible",
    `Series: ${concept.seriesTitle}`,
    `Premise: ${concept.premise}`,
    "Write only the story bible. Keep names, appearance, and wardrobe stable enough to repeat later.",
    "JSON keys: characters, relationships, locations, visualStyle, emotionalProgression, continuityRules.",
    "characters is an array of 2 objects with name, role, appearance, personality, wardrobe.",
    "locations is an array of short place names. continuityRules is an array of 2 to 4 short strings.",
    "relationships, visualStyle, and emotionalProgression are strings.",
  ].join("\n");
}

export function outlineUserPrompt(concept: StoryConcept, bible: StoryBible): string {
  return [
    "STAGE: season-outline",
    `Series: ${concept.seriesTitle}`,
    `Premise: ${concept.premise}`,
    `Characters: ${bible.characters.map((character) => character.name).join(", ")}`,
    "Write only the season shape and five episode outlines. Do not write shot lists.",
    "JSON keys: seasonArc, reveals, endingDirection, episodes.",
    "episodes is an array of exactly 5 objects with number, title, hook, summary, previousEpisode, closingBeat, nextEpisode.",
    "number must be 1, 2, 3, 4 and 5. previousEpisode is an empty string for episode 1.",
    "Each summary, hook, closingBeat, and nextEpisode is one complete sentence of at least 20 characters.",
    "Episode 5 still needs a nextEpisode sentence about what would open the following story. Do not write None.",
    "reveals is an array of 2 sentences. Each sentence is at least 20 characters.",
    "Use the character names in the summaries.",
  ].join("\n");
}

export function episodeUserPrompt(concept: StoryConcept, bible: StoryBible, outline: SeasonOutline, number: number): string {
  const beat = outline.episodes.find((episode) => episode.number === number);
  return [
    "STAGE: episode-script",
    `EPISODE: ${number}`,
    `Series: ${concept.seriesTitle}`,
    `Premise: ${concept.premise}`,
    `Characters: ${bible.characters.map((character) => `${character.name} (${character.role}). Appearance: ${character.appearance}. Wardrobe: ${character.wardrobe}.`).join(" ")}`,
    `Visual style: ${bible.visualStyle}`,
    `Locations: ${bible.locations.join("; ")}`,
    `Outline for this episode only: ${JSON.stringify(beat ?? { number })}`,
    "Write only this episode as one JSON object. Each episode is a vertical reel made of separate shots.",
    "JSON keys: number, title, hook, summary, previousEpisode, voiceover, dialogue, closingBeat, nextEpisode, scenes, caption, thumbnailPrompt.",
    `number must be ${number}.`,
    "scenes is an array of 4 objects with number, durationSeconds, visualPrompt, camera, lighting, onScreenText, subtitle, audio, continuity, negativePrompt.",
    "onScreenText and subtitle must each contain words. Do not leave either one empty.",
    "durationSeconds is an integer from 2 to 12 that you choose. The four durations must add up to between 30 and 90.",
    "Each visualPrompt is one full sentence of at least 40 characters. Mention at least one character name from the bible in the episode text.",
    "previousEpisode is an empty string only for episode 1. nextEpisode is one complete sentence of at least 20 characters, including episode 5.",
  ].join("\n");
}

export function scenePrompt(pilot: PilotBody, episode: PilotEpisode, scene: PilotEpisode["scenes"][number]): string {
  const cast = pilot.characters
    .map((character) => `${character.name}, ${character.role}. Appearance: ${character.appearance}. Wardrobe: ${character.wardrobe}.`)
    .join(" ");
  return [
    `Series: ${pilot.seriesTitle}. Episode ${episode.number}: ${episode.title}.`,
    `Shot ${scene.number} of ${episode.scenes.length}. Duration ${scene.durationSeconds} seconds. Vertical 9:16.`,
    `This is one shot, not a finished episode. A later edit will join the shots.`,
    `Story context: ${episode.summary}`,
    `Characters, keep them consistent: ${cast}`,
    `Visual style: ${pilot.visualStyle}`,
    `Location style: ${pilot.locations.join("; ")}.`,
    `Shot: ${scene.visualPrompt}`,
    `Camera: ${scene.camera}`,
    `Lighting and atmosphere: ${scene.lighting}`,
    `Emotional tone: ${pilot.emotionalProgression}`,
    `On-screen text: ${scene.onScreenText}`,
    `Subtitle: ${scene.subtitle}`,
    `Audio: ${scene.audio}`,
    `Continuity: ${scene.continuity}`,
    `Avoid: ${scene.negativePrompt}`,
    "No watermark, no extra fingers, no costume change, no American spelling on screen, no affiliate offer, no claim that a character is waiting on a dating site.",
    "Reference images have not been uploaded. Do not invent a different face.",
  ].join("\n");
}

export function episodePackage(pilot: PilotBody, episode: PilotEpisode) {
  const prompts = episode.scenes.map((scene) => ({
    id: `e${episode.number}-s${scene.number}`,
    label: `Episode ${episode.number} shot ${scene.number}`,
    text: scenePrompt(pilot, episode, scene),
  }));
  const markdown = [
    `# ${pilot.seriesTitle} — Episode ${episode.number}: ${episode.title}`,
    "",
    "Publishing is off. Generate each shot separately in Muse, then upload the file.",
    "",
    `Hook: ${episode.hook}`,
    "",
    `Voiceover: ${episode.voiceover}`,
    "",
    `Dialogue: ${episode.dialogue}`,
    "",
    `Caption: ${episode.caption}`,
    "",
    `Thumbnail: ${episode.thumbnailPrompt}`,
    "",
    ...prompts.flatMap((prompt) => [`## ${prompt.label}`, "", prompt.text, ""]),
  ].join("\n");
  return { prompts, markdown, publishing: "disabled" as const };
}

export function seriesLaunchAdvice(input: {
  completedEpisodes: number;
  measuredDays: number | null;
  hasPerformance: boolean;
  pageActive: boolean | null;
}) {
  const assumptions = [
    "Seven to fourteen days is a planning reference, not a rule.",
    "A daily series wants at least seven finished episodes before it starts.",
    "Only the owner can approve a launch.",
  ];
  if (!input.hasPerformance || input.measuredDays === null || input.pageActive === null) {
    return {
      state: "RESEARCHING" as const,
      recommendation: "Continue audience testing" as const,
      reason: "No page activity, watch time, or retention has been measured, so a launch is not recommended.",
      assumptions,
    };
  }
  if (input.completedEpisodes < 7) {
    return {
      state: "PREPARING" as const,
      recommendation: "Prepare additional episodes" as const,
      reason: `${input.completedEpisodes} finished episodes are stored. The buffer for a daily series is seven.`,
      assumptions,
    };
  }
  return {
    state: "TESTING" as const,
    recommendation: "Continue audience testing" as const,
    reason: "Measured results exist, and this build does not yet turn those results into a launch score.",
    assumptions,
  };
}

export function monetisationAdvice() {
  return {
    state: "NOT_READY" as const,
    recommendation: "Do not add a dating call to action.",
    evidence: [
      "No affiliate offer is approved in this application.",
      "No landing-page traffic has been measured.",
      "No reel performance has been measured.",
    ],
    revenue: null,
    conversions: null,
  };
}

export function partnerProgressReport(input: { seriesCount: number; publishedVideos: number }) {
  return {
    generatedAt: new Date().toISOString(),
    approvedFacebookBrands: [],
    candidateBrands: [
      "Back in the Game UK",
      "After Hours Singles UK",
      "Single Parent Stories UK",
      "Still Got It UK",
      "Casual By Choice UK",
    ],
    candidateNote: "These names are the existing plan candidates. They are not approved final page names.",
    activeSeries: input.seriesCount,
    publishedVideos: input.publishedVideos,
    audienceGrowth: null,
    reach: null,
    engagement: null,
    watchTime: null,
    websiteTraffic: null,
    landingPageStatus: "Not built",
    plannedAffiliateOpportunities: "None approved",
    distinction: "Null figures are unmeasured. They are not zeroes and they are not forecasts.",
  };
}
