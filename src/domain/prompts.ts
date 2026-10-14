import type { PageIdentity } from "@/domain/pages";
import type { ContentRecord } from "@/domain/types";

function header(page: PageIdentity, record: ContentRecord): string {
  return [
    `Page: ${page.name}`,
    `Audience: ${page.persona}`,
    `Age: ${page.ageRange}`,
    `Tone: ${page.tone}`,
    `Visual style: ${page.visual}`,
    `Content pillar: ${record.pillar}`,
    `Angle: ${record.angle}`,
    `Hook: ${record.hook}`,
    `Format: ${record.format}`,
    "Language: natural UK English.",
    "Originality: fictional scenarios must read as editorial. Do not invent a real customer, follower or statistic.",
    "Do not copy another creator. Do not use identifiable private dating screenshots.",
  ].join("\n");
}

export function storyPrompt(page: PageIdentity, record: ContentRecord): string {
  return `${header(page, record)}

Write a short editorial story for this Facebook post. One idea only. Keep the approved hook as the opening. End with this question: ${record.engagementQuestion}`;
}

export function reelScriptPrompt(page: PageIdentity, record: ContentRecord): string {
  return `${header(page, record)}

Write a 20–35 second vertical Reel script.
The hook must land in the first two seconds.
Use 4–6 scenes.
Voiceover style: ${record.voiceoverStyle}
Include on-screen caption lines.
End with one question.
Output: scene number, visual, voiceover, on-screen text.`;
}

export function imagePrompt(page: PageIdentity, record: ContentRecord): string {
  return `${header(page, record)}

Write an AI image prompt for an original 4:5 editorial still.
No readable nonsense text inside the image. Leave space for a headline we will set ourselves.
No identifiable real person. No children with visible faces. No explicit imagery.
Describe lighting, setting, age range and clothing in plain language.`;
}

export function scenePrompt(page: PageIdentity, record: ContentRecord): string {
  return `${header(page, record)}

List 4–6 original vertical scenes for this Reel.
Each scene: setting, action, what the viewer reads, and how long it stays on screen.
The first scene must carry the hook.`;
}

export function voiceoverPrompt(page: PageIdentity, record: ContentRecord): string {
  return `${header(page, record)}

Write voiceover instructions.
Style: ${record.voiceoverStyle}
Pace: calm enough for subtitles.
Accent: natural UK English, not a caricature.
Length: 20–35 seconds.`;
}

export function captionPrompt(page: PageIdentity, record: ContentRecord): string {
  return `${header(page, record)}

Write the Facebook caption.
The caption carries the story. The image or video carries the hook.
One idea. One question at the end: ${record.engagementQuestion}
No affiliate link unless this post is marked as a guide bridge and Shahzeb has approved the disclosure.`;
}

export function qualityPrompt(page: PageIdentity, record: ContentRecord): string {
  return `${header(page, record)}

Check this draft before submission.
Flag poor English, unnatural UK phrasing, a repeated story, inconsistent characters, bad anatomy, unreadable type, a weak opening, missing captions, the wrong format, copyright risk, a false testimonial, or too much promotion.
Say what to change. Do not approve it yourself.`;
}

export const PROMPT_PACKS = [
  { id: "story", label: "ChatGPT story", build: storyPrompt },
  { id: "script", label: "Reel script", build: reelScriptPrompt },
  { id: "image", label: "AI image", build: imagePrompt },
  { id: "scenes", label: "Scenes", build: scenePrompt },
  { id: "voice", label: "Voiceover", build: voiceoverPrompt },
  { id: "caption", label: "Caption", build: captionPrompt },
  { id: "quality", label: "Quality check", build: qualityPrompt },
] as const;
