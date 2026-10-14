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

export function episodeDurationOk(episode: PilotEpisode): boolean {
  const total = episode.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
  return total >= 30 && total <= 90;
}

export const PILOT_SYSTEM = [
  "You write original short-form romance fiction for a United Kingdom audience.",
  "Reply with one JSON object and no markdown.",
  "Do not copy a published novel, film, series, or protected plot.",
  "Do not invent search interest, views, watch time, shares, or revenue.",
  "Do not claim a fictional character is a real person on a dating service.",
  "Do not add an affiliate call to action.",
  "Write in British English. Set the story in the United Kingdom.",
  "Each episode is a vertical reel made of separate shots, not one continuous generation.",
  "Keep each shot between 2 and 12 seconds, and the episode between 30 and 90 seconds.",
  "The story must be original. Publishing is disabled.",
].join(" ");

export function pilotUserPrompt(): string {
  return [
    "Create a five-episode original romance micro-drama pilot.",
    "No live web results are attached. Say what you are assuming, and do not present it as current trend data.",
    "Do not assign the series to a Facebook page. Brand names are not approved.",
    "Include a story bible and five episodes. Each episode needs a hook, voiceover, dialogue, a closing beat that belongs to the plot, a next-episode reference, and 3 to 8 shots.",
    "Each shot needs a visual prompt, camera, lighting, on-screen text, subtitle, audio, continuity, and a negative prompt.",
    "Characters must keep the same names, appearance, and wardrobe across episodes.",
    "JSON keys: seriesTitle, genre, audience, premise, themes, characters[{name, role, appearance, personality, wardrobe}], relationships, locations, visualStyle, emotionalProgression, seasonArc, reveals, continuityRules, endingDirection, episodes[{number, title, hook, summary, previousEpisode, voiceover, dialogue, closingBeat, nextEpisode, scenes[{number, durationSeconds, visualPrompt, camera, lighting, onScreenText, subtitle, audio, continuity, negativePrompt}], caption, thumbnailPrompt}], whyTest, assumptions.",
  ].join(" ");
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
