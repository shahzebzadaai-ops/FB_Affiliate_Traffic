import { z } from "zod";
import type { ContentRecord } from "@/domain/types";
import type { PageIdentity } from "@/domain/pages";

export const MUSE_PROVIDER_ID = "muse-web-studio";
export const MUSE_ADVERTISED_TOKENS = 1_000_000_000;
export const CAMPAIGN_ID = "uk-month-one";

export const MUSE_STAGES = [
  "IDEA",
  "SCRIPT_READY",
  "PROMPTS_READY",
  "EXTERNAL_GENERATION",
  "ASSETS_UPLOADED",
  "REVIEW",
  "APPROVED",
] as const;

export type MuseStage = (typeof MUSE_STAGES)[number];

export const MUSE_PRESETS = [
  {
    id: "ugc",
    label: "UGC-style recommendation",
    direction: "Handheld phone framing, natural room light, one person speaking as if to a friend. Not a studio advert and not a corporate end card.",
  },
  {
    id: "demo",
    label: "Product demonstration",
    direction: "Show only the action already named in the plan. If the plan names no product, do not add one.",
  },
  {
    id: "problem",
    label: "Problem-to-solution storytelling",
    direction: "Open on the situation in the plan angle. The turn is the plan's own question. Do not add a promise the brief does not make.",
  },
  {
    id: "comparison",
    label: "Comparison explainer",
    direction: "If the brief compares two situations, show both calmly. Do not invent a winner, a price, or a ranking.",
  },
  {
    id: "educational",
    label: "Educational reel",
    direction: "One idea from the plan, explained in calm British English. No sales music and no shouting.",
  },
  {
    id: "cinematic",
    label: "Cinematic product advertisement",
    direction: "Follow the page visual direction. Keep people natural. No glossy logo sting.",
  },
] as const;

export type MusePresetId = (typeof MUSE_PRESETS)[number]["id"];

const IMAGE_FRAMES = [
  { id: "vertical", ratio: "9:16", use: "Vertical advertising visual", width: 1080, height: 1920 },
  { id: "feed", ratio: "4:5", use: "Feed image", width: 1080, height: 1350 },
  { id: "carousel", ratio: "1:1", use: "Carousel image", width: 1080, height: 1080 },
  { id: "hero", ratio: "9:16", use: "Hero still", width: 1080, height: 1920 },
  { id: "thumb", ratio: "9:16", use: "Thumbnail", width: 1080, height: 1920 },
  { id: "comparison", ratio: "1:1", use: "Feature comparison graphic", width: 1080, height: 1080 },
] as const;

export const NEGATIVE_PROMPT =
  "American accent, pity, humiliation, fake testimonial, invented earnings, extra fingers, distorted face, unreadable text, corporate stock-ad lighting, logos that were not supplied, watermark, celebrity likeness.";

export type MuseScene = {
  number: number;
  startSecond: number;
  durationSeconds: number;
  timestamp: string;
  prompt: string;
  voiceover: string;
  onScreenText: string;
  camera: string;
  lighting: string;
  continuity: string;
  generated: boolean;
};

export type MuseImagePrompt = {
  id: string;
  use: string;
  aspectRatio: string;
  width: number;
  height: number;
  prompt: string;
};

export type MusePackageBody = {
  source: "plan-brief";
  model: null;
  notice: string;
  campaignId: string;
  contentId: string;
  offerId: null;
  offerNote: string;
  preset: MusePresetId;
  presetLabel: string;
  publishing: "disabled";
  strategy: {
    audience: string;
    problem: string;
    benefits: string;
    angles: string[];
    hooks: string[];
    style: string;
    duration: string;
    viewerAction: string;
  };
  reel: {
    concept: string;
    durationTarget: string;
    hook: string;
    voiceover: string;
    scenes: MuseScene[];
    audio: string;
    cta: string;
    negativePrompt: string;
  } | null;
  images: MuseImagePrompt[];
  social: {
    title: string;
    captions: string[];
    ctas: string[];
    keywords: string[];
    affiliatePlacement: string;
    platforms: { platform: string; copy: string }[];
  };
};

export function presetById(id: string): (typeof MUSE_PRESETS)[number] | undefined {
  return MUSE_PRESETS.find((preset) => preset.id === id);
}

const sceneSchema = z.object({
  number: z.number().int().min(1).max(12),
  startSecond: z.number().int().min(0).max(600),
  durationSeconds: z.number().int().min(1).max(120),
  timestamp: z.string().min(3).max(40),
  prompt: z.string().min(20).max(4000),
  voiceover: z.string().min(1).max(2000),
  onScreenText: z.string().max(500),
  camera: z.string().min(1).max(400),
  lighting: z.string().min(1).max(400),
  continuity: z.string().min(1).max(800),
  generated: z.boolean(),
});

export const musePackageSchema = z.object({
  source: z.literal("plan-brief"),
  model: z.null(),
  notice: z.string().min(20).max(500),
  campaignId: z.literal(CAMPAIGN_ID),
  contentId: z.string().regex(/^UK-(BGUK|AHSUK|SPSUK|SGIUK|CBCUK)-\d{3}$/),
  offerId: z.null(),
  offerNote: z.string().min(10).max(400),
  preset: z.enum(["ugc", "demo", "problem", "comparison", "educational", "cinematic"]),
  presetLabel: z.string().min(3).max(80),
  publishing: z.literal("disabled"),
  strategy: z.object({
    audience: z.string().min(8).max(800),
    problem: z.string().min(8).max(800),
    benefits: z.string().min(8).max(800),
    angles: z.array(z.string().min(8).max(800)).length(3),
    hooks: z.array(z.string().min(8).max(800)).length(3),
    style: z.string().min(8).max(1200),
    duration: z.string().min(3).max(120),
    viewerAction: z.string().min(3).max(400),
  }),
  reel: z
    .object({
      concept: z.string().min(8).max(2000),
      durationTarget: z.string().min(3).max(200),
      hook: z.string().min(8).max(800),
      voiceover: z.string().min(8).max(4000),
      scenes: z.array(sceneSchema).min(4).max(6),
      audio: z.string().min(8).max(800),
      cta: z.string().min(3).max(400),
      negativePrompt: z.string().min(8).max(800),
    })
    .nullable(),
  images: z
    .array(
      z.object({
        id: z.enum(["vertical", "feed", "carousel", "hero", "thumb", "comparison"]),
        use: z.string().min(3).max(80),
        aspectRatio: z.enum(["9:16", "4:5", "1:1"]),
        width: z.number().int().positive().max(8000),
        height: z.number().int().positive().max(8000),
        prompt: z.string().min(20).max(4000),
      }),
    )
    .length(6),
  social: z.object({
    title: z.string().min(3).max(200),
    captions: z.array(z.string().min(8).max(2000)).min(1).max(6),
    ctas: z.array(z.string().min(3).max(400)).min(1).max(6),
    keywords: z.array(z.string().min(2).max(40)).min(1).max(20),
    affiliatePlacement: z.string().min(8).max(400),
    platforms: z
      .array(z.object({ platform: z.string().min(2).max(40), copy: z.string().min(8).max(2500) }))
      .length(3),
  }),
});

export function prepareMusePackage(record: ContentRecord, page: PageIdentity, presetId: MusePresetId): MusePackageBody {
  const preset = presetById(presetId) ?? MUSE_PRESETS[0];
  const range = durationRange(record.duration);
  const noOffer = record.monetisation === "none";
  const beats = sceneBeats(record);
  const scenes = record.format === "REEL" ? buildScenes(record, page, preset.direction, beats, range.target) : null;
  return {
    source: "plan-brief",
    model: null,
    notice: "Prepared from the approved plan brief. No writing model was called. Every Muse capability is untested until the owner confirms it on the account.",
    campaignId: CAMPAIGN_ID,
    contentId: record.contentId,
    offerId: null,
    offerNote: noOffer
      ? "No affiliate offer is attached to this post. Do not invent a product, a price, or a link."
      : "No offer record exists yet. Use only the bridge already written in the plan.",
    preset: preset.id,
    presetLabel: preset.label,
    publishing: "disabled",
    strategy: {
      audience: `${page.name}. ${page.persona} Age range in the page brief: ${page.ageRange}. United Kingdom.`,
      problem: `The plan's subject is “${record.pillar}”. The situation it already states is: ${record.angle}`,
      benefits: noOffer
        ? "No product benefits are approved for this post. Leave them out."
        : "Repeat only benefits already written in the creative brief. Do not add results, income, or testimonials.",
      angles: [
        record.angle,
        `${preset.label}: tell the same plan angle in this treatment — ${preset.direction}`,
        `Ask the plan's question without a new claim: ${record.engagementQuestion}`,
      ],
      hooks: [record.hook, firstSentence(record.sourceBrief), record.engagementQuestion],
      style: `${preset.direction} Page tone: ${page.tone} Visual: ${page.visual}`,
      duration: record.duration ?? (record.format === "REEL" ? "20–35 seconds" : "Not a timed video in the plan."),
      viewerAction: record.cta,
    },
    reel: scenes
      ? {
          concept: `${preset.label} for ${record.contentId}. ${record.creativeBrief}`,
          durationTarget: `${range.target} seconds within the plan range ${range.label}. Vertical 9:16.`,
          hook: record.hook,
          voiceover: [record.hook, record.scriptRequirements, record.engagementQuestion].join(" "),
          scenes,
          audio: `${record.voiceoverStyle} No music file is licensed for this post, so leave music out unless the owner attaches one later.`,
          cta: record.cta,
          negativePrompt: NEGATIVE_PROMPT,
        }
      : null,
    images: IMAGE_FRAMES.map((frame) => ({
      id: frame.id,
      use: frame.use,
      aspectRatio: frame.ratio,
      width: frame.width,
      height: frame.height,
      prompt: imagePrompt(record, page, preset.direction, frame),
    })),
    social: socialCopy(record, page, noOffer),
  };
}

export function packageMarkdown(body: MusePackageBody): string {
  const lines = [
    `# Muse production package — ${body.contentId}`,
    "",
    body.notice,
    "",
    `Preset: ${body.presetLabel}`,
    `Publishing: ${body.publishing}`,
    `Offer: ${body.offerNote}`,
    "",
    "## Creative strategy",
    `Audience: ${body.strategy.audience}`,
    `Problem: ${body.strategy.problem}`,
    `Benefits: ${body.strategy.benefits}`,
    "Angles:",
    ...body.strategy.angles.map((angle) => `- ${angle}`),
    "Hooks:",
    ...body.strategy.hooks.map((hook) => `- ${hook}`),
    `Style: ${body.strategy.style}`,
    `Duration: ${body.strategy.duration}`,
    `Viewer action: ${body.strategy.viewerAction}`,
    "",
  ];
  if (body.reel) {
    lines.push("## Reel", body.reel.concept, "", `Duration target: ${body.reel.durationTarget}`, `Hook: ${body.reel.hook}`, "", "### Scenes");
    for (const scene of body.reel.scenes) {
      lines.push(
        "",
        `#### Scene ${scene.number} (${scene.timestamp})`,
        scene.prompt,
        `Voiceover: ${scene.voiceover}`,
        `On-screen text: ${scene.onScreenText}`,
        `Camera: ${scene.camera}`,
        `Lighting: ${scene.lighting}`,
        `Continuity: ${scene.continuity}`,
      );
    }
    lines.push("", `Audio: ${body.reel.audio}`, `CTA: ${body.reel.cta}`, `Avoid: ${body.reel.negativePrompt}`, "");
  }
  lines.push("## Images");
  for (const image of body.images) {
    lines.push("", `### ${image.use} (${image.aspectRatio})`, image.prompt);
  }
  lines.push("", "## Social copy", `Title: ${body.social.title}`, "Captions:", ...body.social.captions.map((caption) => `- ${caption}`));
  lines.push("Calls to action:", ...body.social.ctas.map((cta) => `- ${cta}`));
  lines.push(`Keywords: ${body.social.keywords.join(", ")}`, body.social.affiliatePlacement);
  for (const platform of body.social.platforms) {
    lines.push("", `### ${platform.platform}`, platform.copy);
  }
  return lines.join("\n");
}

export function scenePrompt(scene: MuseScene, negative: string): string {
  return [scene.prompt, `Voiceover: ${scene.voiceover}`, `On-screen text: ${scene.onScreenText}`, `Camera: ${scene.camera}`, `Lighting: ${scene.lighting}`, `Continuity: ${scene.continuity}`, `Avoid: ${negative}`].join("\n");
}

export type TokenEvent = { kind: "FINISHED_VIDEO" | "FINISHED_IMAGE" | "REJECTED"; tokensSpent: number | null };
export type TokenBalance = { recordedBalance: number; tokensSpent: number | null; recordedAt: string };

export function tokenSummary(balances: TokenBalance[], events: TokenEvent[]) {
  const latest = balances[0] ?? null;
  const successful = events.filter((event) => event.kind !== "REJECTED");
  const known = successful.filter((event) => event.tokensSpent !== null);
  const average = successful.length > 0 && known.length === successful.length
    ? known.reduce((sum, event) => sum + (event.tokensSpent ?? 0), 0) / known.length
    : null;
  return {
    advertisedOpeningBalance: MUSE_ADVERTISED_TOKENS,
    lastBalance: latest?.recordedBalance ?? null,
    tokensSpent: latest?.tokensSpent ?? null,
    lastUpdated: latest?.recordedAt ?? null,
    finishedVideos: events.filter((event) => event.kind === "FINISHED_VIDEO").length,
    finishedImages: events.filter((event) => event.kind === "FINISHED_IMAGE").length,
    rejected: events.filter((event) => event.kind === "REJECTED").length,
    averageTokensPerSuccessfulAsset: average,
  };
}

export function safeExtension(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  return ["mp4", "webm", "mov", "jpg", "jpeg", "png", "webp"].includes(ext) ? ext : null;
}

export function httpsWebsite(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function durationRange(value: string | null): { label: string; target: number } {
  const numbers = (value ?? "20–35").match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length >= 2) {
    const [low, high] = numbers;
    return { label: `${low}–${high} seconds`, target: Math.round((low + high) / 2) };
  }
  if (numbers.length === 1) return { label: `${numbers[0]} seconds`, target: numbers[0] };
  return { label: "20–35 seconds", target: 28 };
}

function sceneBeats(record: ContentRecord): string[] {
  const parts = (record.reelScenes ?? record.sourceBrief)
    .split(/[.;]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8);
  const unique = [...new Set(parts)].slice(0, 5);
  return unique.length > 0 ? unique : [record.angle];
}

function buildScenes(record: ContentRecord, page: PageIdentity, direction: string, beats: string[], target: number): MuseScene[] {
  const count = Math.min(6, Math.max(4, beats.length));
  const hookSeconds = 3;
  const rest = Math.max(count - 1, 1);
  const each = Math.max(3, Math.round((target - hookSeconds) / rest));
  let cursor = 0;
  return Array.from({ length: count }, (_, index) => {
    const durationSeconds = index === 0 ? hookSeconds : each;
    const startSecond = cursor;
    cursor += durationSeconds;
    const beat = beats[index] ?? beats[beats.length - 1];
    const last = index === count - 1;
    return {
      number: index + 1,
      startSecond,
      durationSeconds,
      timestamp: `${stamp(startSecond)}–${stamp(startSecond + durationSeconds)}`,
      prompt: [
        `Vertical 9:16, scene ${index + 1} of ${count}. ${direction}`,
        `United Kingdom. Page look: ${page.visual}`,
        `Show: ${beat}`,
        last ? `Close on the plan's question. CTA already approved: ${record.cta}` : "Keep the same person and wardrobe as the previous scene.",
        "Natural, believable, not a corporate advertisement. Fictional scenes stay editorial and must not look like a customer testimonial.",
      ].join(" "),
      voiceover: index === 0 ? record.hook : last ? record.engagementQuestion : beat,
      onScreenText: index === 0 ? record.hook : last ? record.engagementQuestion : "",
      camera: index === 0 ? "Close, steady, readable in the first three seconds." : "Simple motivated move. No whip pan.",
      lighting: page.visual,
      continuity: index === 0 ? "This is the opening frame." : "Match the person, clothes, and location from the previous scene unless this beat names a new place.",
      generated: false,
    };
  });
}

function imagePrompt(
  record: ContentRecord,
  page: PageIdentity,
  direction: string,
  frame: (typeof IMAGE_FRAMES)[number],
): string {
  return [
    `${frame.use}. Aspect ratio ${frame.ratio}, ${frame.width}×${frame.height}.`,
    direction,
    `United Kingdom. ${page.visual}`,
    `Plan image notes: ${record.imageInstructions}`,
    `Subject already in the plan: ${record.pillar}. ${record.angle}`,
    "No product, price, or logo unless the plan already names it.",
    `Avoid: ${NEGATIVE_PROMPT}`,
  ].join(" ");
}

function socialCopy(record: ContentRecord, page: PageIdentity, noOffer: boolean) {
  const caption = `${record.captionInstructions} ${record.engagementQuestion}`.trim();
  const placement = noOffer
    ? "Do not place an affiliate link. None is approved for this post."
    : "Place a link only where the plan already allows a guide bridge. Do not invent a network or a code.";
  return {
    title: `${page.name}: ${record.pillar}`,
    captions: [caption],
    ctas: [record.cta, record.engagementQuestion],
    keywords: keywords(page.name, record.pillar),
    affiliatePlacement: placement,
    platforms: ["Facebook", "Instagram", "TikTok"].map((platform) => ({
      platform,
      copy: `${caption} British English. ${placement}`,
    })),
  };
}

function keywords(pageName: string, pillar: string): string[] {
  const words = `${pageName} ${pillar} UK`.split(/[^A-Za-z0-9]+/).filter((word) => word.length > 2);
  return [...new Set(words.map((word) => word.toLowerCase()))];
}

function firstSentence(value: string): string {
  return value.split(/[.]/)[0]?.trim() || value;
}

function stamp(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
