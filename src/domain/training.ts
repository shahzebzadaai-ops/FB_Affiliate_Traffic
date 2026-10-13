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
    title: "Review a finished asset",
    summary: "You check the file the pipeline produced. You do not write the script.",
    steps: [
      "Open the publishing task and confirm the Page, time and caption.",
      "Play the MP4 or open the image only when a real file is attached.",
      "Fictional stories are editorial. They are not customer testimonials.",
      "Reject anything with a watermark, a stolen clip, explicit bait or a private person's photo.",
      "If there is no file, leave the task waiting. Do not invent one.",
    ],
    example: "A caption instruction on the plan is not a finished caption.",
  },
  {
    id: "day-4",
    day: 4,
    title: "Flag an unsuitable asset",
    summary: "Flagging asks for regeneration. It does not start an AI job by itself.",
    steps: [
      "Say what is wrong, in plain language.",
      "Do not rewrite the prompt yourself.",
      "Shahzeb approves significant creative changes.",
      "Single Parent Stories UK: no identifiable children.",
      "Casual By Choice UK: no sexualised bait.",
    ],
    example: "“The hands are distorted and the voice is American.” is a useful flag.",
  },
  {
    id: "day-5",
    day: 5,
    title: "Schedule in Meta Business Suite",
    summary: "Publishing is manual until an approved Meta connection exists.",
    steps: [
      "Download the finished file from the task. If download is unavailable, stop.",
      "Open Meta Business Suite yourself.",
      "Schedule the post for the UK time on the task.",
      "Paste the final caption from the task. Do not add an affiliate link in weeks 1 and 2.",
      "This operating system does not post to Facebook.",
    ],
    example: "A green status in this app is not proof the post is on Facebook.",
  },
  {
    id: "day-6",
    day: 6,
    title: "Confirm the live post",
    summary: "After it is actually on Facebook, save the public URL.",
    steps: [
      "Copy the public Facebook post URL.",
      "Paste it on the publishing task.",
      "If Business Suite shows an error, report that error on the task. Do not mark it published.",
      "You cannot see affiliate revenue, tracking links or postback settings.",
      "You cannot approve strategy, a new Page or AI spend.",
    ],
    example: "A finished MP4 without a Facebook URL is still unpublished.",
  },
  {
    id: "day-7",
    day: 7,
    title: "Record performance",
    summary: "Enter numbers you can see. Do not guess.",
    steps: [
      "At 24 hours, 72 hours and 7 days, enter the Page's numbers.",
      "Keep organic reach and paid reach in different fields.",
      "Leave a field empty if you do not have the number.",
      "Do not type affiliate commission. That screen is not yours.",
      "Shahzeb uses the real results to approve the next experiments.",
    ],
    example: "Weeks 1 and 2 have no affiliate link. A guide bridge later must be obviously advertising.",
  },
];
