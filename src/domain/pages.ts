import type { PageCode } from "@/domain/types";

export type PageIdentity = {
  code: PageCode;
  name: string;
  ageRange: string;
  persona: string;
  bio: string;
  tone: string;
  visual: string;
  commercialHypothesis: string;
  pillars: string[];
  hookGuidelines: string[];
  templates: string[];
  recurringFormats: string;
  accent: string;
  wash: string;
};

export const PAGE_IDENTITIES: PageIdentity[] = [
  {
    code: "BGUK",
    name: "Back in the Game UK",
    ageRange: "35–50",
    persona:
      "Divorced or separated adults who are dating again after a long relationship.",
    bio: "Dating again after a long relationship? Stories, laughs, awkward first dates and second chances for UK singles 35+.",
    tone: "Warm, hopeful, emotionally intelligent, lightly funny. Never pitying.",
    visual:
      "Cream and dark navy. Warm editorial photography of natural homes, cafes and walks. Mature, but modern.",
    commercialHypothesis:
      "Serious, general and casual dating comparison routes for people starting again.",
    pillars: [
      "Starting again",
      "Confidence",
      "Exes",
      "Children",
      "First dates",
      "Modern apps",
      "Independence",
      "Second chances",
    ],
    hookGuidelines: [
      "Open on the feeling of dating again after a long relationship.",
      "One situation, understandable in two seconds.",
      "Hopeful, never pitying, and never a fake testimonial.",
    ],
    templates: [
      "Warm story card with a short headline",
      "Question card on a cream field",
      "Cafe or walk Reel with captions",
      "Five-slide carousel: hook, three points, question",
    ],
    recurringFormats:
      "Monday Reel, Tuesday image, Wednesday Reel and poll, Thursday image, Friday Reel, Saturday image and Reel, Sunday carousel.",
    accent: "#1e3a5f",
    wash: "#f4efe6",
  },
  {
    code: "AHSUK",
    name: "After Hours Singles UK",
    ageRange: "30–45",
    persona:
      "Busy professionals who have careers, independence and disposable income, but limited time for dating.",
    bio: "Work is busy. Dating is complicated. Stories, humour and real conversations for UK professionals who are still single.",
    tone: "Smart, dry British humour, modern and competent. Never corporate.",
    visual:
      "Graphite and off-white. City evenings, trains, cafes, restaurants, and the laptop put away after work.",
    commercialHypothesis:
      "General and quality-focused dating services. Later, test convenience and serious-intent offers.",
    pillars: [
      "Time",
      "Career",
      "Standards",
      "Texting",
      "App fatigue",
      "Commuting",
      "Travel",
      "Money",
      "Independence",
    ],
    hookGuidelines: [
      "Start from a time constraint a working adult recognises.",
      "Dry humour, not office jargon.",
      "Do not turn dating into another productivity lecture.",
    ],
    templates: [
      "Graphite question card",
      "City-evening still with a short headline",
      "Timestamped chat Reel",
      "Five practical slides for people with little free time",
    ],
    recurringFormats:
      "Monday Reel, Tuesday image, Wednesday Reel and poll, Thursday image, Friday Reel, Saturday image and Reel, Sunday carousel.",
    accent: "#2c3338",
    wash: "#f3f2ef",
  },
  {
    code: "SPSUK",
    name: "Single Parent Stories UK",
    ageRange: "30–50",
    persona:
      "Single or divorced mums and dads balancing children, co-parenting, work and dating.",
    bio: "Dating, parenting and starting again. UK stories and conversations for single mums and dads.",
    tone: "Supportive, practical, human and non-judgemental.",
    visual:
      "Natural family-life editorial imagery in soft blue and cream. Privacy first. No identifiable children.",
    commercialHypothesis:
      "Serious and general dating routes, and services suitable for adults with children.",
    pillars: [
      "Childcare",
      "Time",
      "Ex boundaries",
      "Children",
      "Guilt",
      "Blended families",
      "Privacy",
      "Confidence",
      "Money",
    ],
    hookGuidelines: [
      "Respect the parent and the children.",
      "Never show identifiable children or private co-parent messages.",
      "Practical situations, not lectures.",
    ],
    templates: [
      "Soft question card",
      "Calendar or childcare still with no child faces",
      "Short narrated Reel",
      "Boundary carousel",
    ],
    recurringFormats:
      "Monday Reel, Tuesday image, Wednesday Reel and poll, Thursday image, Friday Reel, Saturday image and Reel, Sunday carousel.",
    accent: "#3d5c73",
    wash: "#f3f6f4",
  },
  {
    code: "SGIUK",
    name: "Still Got It UK",
    ageRange: "50–65+",
    persona:
      "Mature singles, including divorced, widowed and long-term single adults, who value companionship and independence.",
    bio: "You are older, wiser and definitely not finished. Dating, independence, companionship and new beginnings after 50.",
    tone: "Warm, premium, confident and grown-up. Never patronising or 'elderly'.",
    visual:
      "Navy and cream. Mature adults, travel, restaurants, walks and home life. Polished, readable typography.",
    commercialHypothesis:
      "Mature, serious and companionship-focused dating offers. Test casual only where it is appropriate.",
    pillars: [
      "Companionship",
      "Independence",
      "Technology",
      "Travel",
      "Widowhood and divorce",
      "Adult children",
      "Dating confidence",
      "Money",
    ],
    hookGuidelines: [
      "Confident and specific. Never talk down to the audience.",
      "Technology jokes must be with the viewer, not at them.",
      "Large, readable type on every card.",
    ],
    templates: [
      "Premium portrait card",
      "Readable question card",
      "Warm preparation Reel",
      "Five-slide practical carousel",
    ],
    recurringFormats:
      "Monday Reel, Tuesday image, Wednesday Reel and poll, Thursday image, Friday Reel, Saturday image and Reel, Sunday carousel.",
    accent: "#1b3654",
    wash: "#f7f1e8",
  },
  {
    code: "CBCUK",
    name: "Casual By Choice UK",
    ageRange: "30–50",
    persona:
      "Men over 30 who value independence and may prefer casual or low-pressure dating rather than immediate commitment.",
    bio: "Modern single life for UK men 30+. Dating, confidence, first dates, attraction and honest no-pressure connections.",
    tone: "Confident, direct, respectful and practical. Never bitter, misogynistic or sexually explicit.",
    visual:
      "Dark navy and white. City nights, grooming, restaurants, travel, fitness and social life. Premium male lifestyle, not explicit imagery.",
    commercialHypothesis:
      "Casual and general dating PPS routes, subject to partner and platform traffic rules.",
    pillars: [
      "Intentions",
      "Confidence",
      "Texting",
      "Rejection",
      "Profiles",
      "First dates",
      "Independence",
      "Social life",
      "Attraction",
      "Honesty",
    ],
    hookGuidelines: [
      "Direct and respectful. No sexualised bait and no objectifying women.",
      "Honesty about intentions is the point.",
      "Rejection advice stays calm: accept it and move on.",
    ],
    templates: [
      "Strong typographic card",
      "Lifestyle still with a short headline",
      "Direct-to-camera or city-night Reel",
      "Profile-mistake carousel",
    ],
    recurringFormats:
      "Monday Reel, Tuesday image, Wednesday Reel and poll, Thursday image, Friday Reel, Saturday image and Reel, Sunday carousel.",
    accent: "#152033",
    wash: "#f4f5f6",
  },
];

export function pageByCode(code: PageCode): PageIdentity {
  const page = PAGE_IDENTITIES.find((item) => item.code === code);
  if (!page) {
    throw new Error(`Unknown page code ${code}`);
  }
  return page;
}
