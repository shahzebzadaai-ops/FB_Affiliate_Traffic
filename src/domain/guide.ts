import type { PageIdentity } from "@/domain/pages";
import type { ContentRecord } from "@/domain/types";
import { formatLondon } from "@/domain/schedule";

export type GuideStep = {
  n: number;
  title: string;
  body: string;
};

export function productionGuide(page: PageIdentity, record: ContentRecord): GuideStep[] {
  const formatLabel =
    record.format === "REEL"
      ? "an original vertical Reel"
      : record.format === "IMAGE_POST"
        ? "an original image post"
        : record.format === "POLL"
          ? "a native Facebook poll"
          : record.format === "CAROUSEL"
            ? "a five-slide carousel"
            : "a text post";

  return [
    {
      n: 1,
      title: "What to create",
      body: `Create ${formatLabel} for ${page.name}. ${record.creativeBrief}`,
    },
    {
      n: 2,
      title: "Which Page",
      body: `${page.name}. ${page.bio}`,
    },
    {
      n: 3,
      title: "Who it is for",
      body: `${page.persona} Age range: ${page.ageRange}.`,
    },
    {
      n: 4,
      title: "Angle we are testing",
      body: `${record.pillar}. ${record.angle}`,
    },
    {
      n: 5,
      title: "Opening hook",
      body: record.hook,
    },
    {
      n: 6,
      title: "What to write with ChatGPT",
      body: "Use the copy buttons on this page. Paste the prompt, then edit the result in our voice before you keep it. The model does not approve the post.",
    },
    {
      n: 7,
      title: "Images to generate",
      body: record.imageInstructions,
    },
    {
      n: 8,
      title: "Image prompt",
      body: "Copy the AI image prompt. Ask for an original still in this Page's visual system. Do not download someone else's photo.",
    },
    {
      n: 9,
      title: "Reel scenes",
      body: record.reelScenes ?? "This format is not a Reel. Skip scene filming and follow the checklist for this format.",
    },
    {
      n: 10,
      title: "How long",
      body: record.duration ?? "No video duration. Keep the post to one idea.",
    },
    {
      n: 11,
      title: "Voiceover",
      body: record.format === "REEL" ? record.voiceoverStyle : "No voiceover. The caption and on-image words carry the voice.",
    },
    {
      n: 12,
      title: "Subtitles",
      body:
        record.format === "REEL"
          ? "Add burned-in subtitles for the full voiceover. Assume the viewer has the sound off."
          : "No video subtitles. Make any headline readable without zooming.",
    },
    {
      n: 13,
      title: "Thumbnail",
      body:
        record.format === "REEL"
          ? "Use a clear frame from the hook scene. The first words must be readable."
          : "The image itself is the preview. Keep the headline inside the safe area.",
    },
    {
      n: 14,
      title: "Caption",
      body: record.captionInstructions,
    },
    {
      n: 15,
      title: "Where files go",
      body: `Planned Google Drive folder: ${record.driveFolderPath}. Drive is not connected yet. Paste this path into the asset reference when you submit, and keep the files ready to upload later.`,
    },
    {
      n: 16,
      title: "What Shahzeb checks",
      body: "UK tone, the approved hook, originality, format, readable type, no fake testimonial, no identifiable private material, and whether the asset matches this brief.",
    },
    {
      n: 17,
      title: "When to submit",
      body: `Submit before ${formatLondon(record.dueAt)}. That is three hours before the publishing window.`,
    },
    {
      n: 18,
      title: "When to publish",
      body: `Only after Shahzeb approves it. Planned time: ${formatLondon(record.publishAt)}.`,
    },
    {
      n: 19,
      title: "Facebook URL",
      body: "After it is published, paste the public Facebook URL on this task. A finished file is not a published post.",
    },
    {
      n: 20,
      title: "When to record performance",
      body: "Record organic and paid figures separately at 24 hours, 72 hours and 7 days. Leave the fields empty until you have the numbers. Do not estimate.",
    },
  ];
}
