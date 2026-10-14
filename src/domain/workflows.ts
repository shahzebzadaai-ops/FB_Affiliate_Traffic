import type { ContentFormat } from "@/domain/types";

export type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
};

const SHARED_CLOSE: ChecklistItem[] = [
  { id: "quality", label: "Run the content quality checklist", required: true },
  { id: "upload", label: "Note where the final files will live", required: true },
  { id: "submit", label: "Submit only after the evidence fields are filled", required: true },
];

export const WORKFLOWS: Record<ContentFormat, ChecklistItem[]> = {
  REEL: [
    { id: "read-brief", label: "Read the brief, persona and hook", required: true },
    { id: "script", label: "Draft the script and choose the strongest hook", required: true },
    { id: "scenes", label: "Write a scene list of 4–6 original scenes", required: true },
    { id: "images", label: "Create original images for those scenes", required: true },
    { id: "voiceover", label: "Prepare the voiceover in the Page voice", required: true },
    { id: "edit", label: "Edit a vertical video of 20–35 seconds", required: true },
    { id: "subtitles", label: "Add subtitles", required: true },
    { id: "thumbnail", label: "Create a readable thumbnail", required: true },
    ...SHARED_CLOSE,
  ],
  IMAGE_POST: [
    { id: "read-angle", label: "Read the angle, persona and hook", required: true },
    { id: "caption", label: "Write the caption in UK English", required: true },
    { id: "image", label: "Create one original 4:5 image", required: true },
    { id: "brand", label: "Check Page colours, type and subtle branding", required: true },
    { id: "readable", label: "Check the headline is readable on a phone", required: true },
    ...SHARED_CLOSE,
  ],
  TEXT_POST: [
    { id: "read-angle", label: "Read the angle and audience", required: true },
    { id: "copy", label: "Write one clear post in the Page voice", required: true },
    { id: "question", label: "End with one honest question", required: true },
    ...SHARED_CLOSE,
  ],
  POLL: [
    { id: "read-topic", label: "Read the topic and audience", required: true },
    { id: "question", label: "Write one discussion question", required: true },
    { id: "choices", label: "Prepare 2–4 simple answer choices", required: true },
    { id: "wording", label: "Review the wording for judgement or bait", required: true },
    { id: "no-link", label: "Confirm there is no outbound link", required: true },
    ...SHARED_CLOSE,
  ],
  CAROUSEL: [
    { id: "read-topic", label: "Read the topic and hook", required: true },
    { id: "outline", label: "Outline five slides: hook, three points, question", required: true },
    { id: "visuals", label: "Create original visuals for the sequence", required: true },
    { id: "copy", label: "Write the slide copy", required: true },
    { id: "sequence", label: "Check the sequence reads in order", required: true },
    ...SHARED_CLOSE,
  ],
};

export function requiredChecklistIds(format: ContentFormat): string[] {
  return WORKFLOWS[format].filter((item) => item.required).map((item) => item.id);
}
