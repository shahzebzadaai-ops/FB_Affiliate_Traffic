export type TrainingLesson = {
  id: string;
  day: number;
  title: string;
  summary: string;
  steps: string[];
  example: string;
};

export const TRAINING_LESSONS: TrainingLesson[] = [
  {
    id: "day-1",
    day: 1,
    title: "Understand the five Facebook Pages",
    summary: "Each Page is a different audience. Do not reuse the same post.",
    steps: [
      "Read the persona, bio and tone before you open a task.",
      "Back in the Game UK is for adults 35–50 dating again after a long relationship.",
      "After Hours Singles UK is for busy professionals, 30–45.",
      "Single Parent Stories UK is for mums and dads, 30–50. Never show identifiable children.",
      "Still Got It UK is for adults 50+. Confident, never patronising.",
      "Casual By Choice UK is for men 30–50 who want honest, low-pressure dating. No explicit imagery.",
    ],
    example:
      "Still Got It UK opens with a first date after 1998. That hook does not belong on Casual By Choice UK.",
  },
  {
    id: "day-2",
    day: 2,
    title: "Hooks and content pillars",
    summary: "One post tests one idea. The hook has to land in two seconds.",
    steps: [
      "The pillar is the theme, such as childcare or companionship.",
      "The hook is the exact opening line on the task.",
      "Do not add a second theme to make the post feel bigger.",
      "Priority posts are the strongest hypotheses, not guaranteed winners.",
      "If a pillar stays weak, Shahzeb can cancel it. Do not keep making it only because it is on the calendar.",
    ],
    example: "Hook: “She had not been on a first date since 1998.” Pillar: Starting again.",
  },
  {
    id: "day-3",
    day: 3,
    title: "Write story scripts with ChatGPT",
    summary: "Copy the prompt on the task, then edit the result yourself.",
    steps: [
      "Use the ChatGPT story and Reel script buttons. They already include the Page voice.",
      "Keep the approved hook as the opening.",
      "Fictional scenes must read as editorial, not as a real customer.",
      "Use UK wording. Say mum, holiday, pub or train when the story needs them.",
      "End with the engagement question on the task.",
    ],
    example:
      "A script can follow a woman getting ready for coffee. It cannot say a real follower told us the story.",
  },
  {
    id: "day-4",
    day: 4,
    title: "Create professional AI images",
    summary: "Original stills only, in the Page's colours and settings.",
    steps: [
      "Copy the image prompt. Do not download another creator's photo.",
      "Leave space for the headline. Do not ask the image model to render a paragraph of text.",
      "Check hands, faces and lighting before you keep an image.",
      "Single Parent Stories UK: no identifiable children's faces.",
      "Casual By Choice UK: no sexualised bait.",
    ],
    example: "Back in the Game UK uses cream, navy, cafes and walks. After Hours uses graphite and the city after work.",
  },
  {
    id: "day-5",
    day: 5,
    title: "Reels, subtitles and voiceovers",
    summary: "A Reel is 20–35 seconds, with the hook in the first two seconds.",
    steps: [
      "Plan 4–6 original scenes.",
      "Record or generate a natural UK voiceover in the Page tone.",
      "Add subtitles for people watching without sound.",
      "The thumbnail must show the hook clearly.",
      "Export a vertical video.",
    ],
    example: "Still Got It UK, first Reel: wardrobe, mirror, taxi, cafe. Warm, not rushed.",
  },
  {
    id: "day-6",
    day: 6,
    title: "Submit work for approval",
    summary: "Shahzeb reviews the work. You cannot approve your own task.",
    steps: [
      "Complete every required checklist item.",
      "Complete the quality checklist.",
      "Write what you made in the submission note.",
      "Paste the planned Drive folder, or the real folder once Drive is connected.",
      "Google Drive is not connected in this preview. Do not pretend a file has uploaded.",
    ],
    example: "A caption file and a video are evidence. A ticked box by itself is not.",
  },
  {
    id: "day-7",
    day: 7,
    title: "Publish and record performance",
    summary: "Publish only after approval, then record what actually happened.",
    steps: [
      "Publish at the planned UK time.",
      "Paste the public Facebook URL.",
      "At 24 hours, 72 hours and 7 days, enter the Page's numbers.",
      "Keep organic reach and paid reach in different fields.",
      "Leave a field empty if you do not have the number. Do not guess.",
    ],
    example: "Weeks 1 and 2 have no affiliate link. A guide bridge later must be obviously advertising.",
  },
];
