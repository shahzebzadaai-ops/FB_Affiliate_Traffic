export const MANDALA_GOAL = {
  id: "goal-25k",
  title: "$25,000 monthly approved affiliate revenue",
  targetAmountCents: 2_500_000,
  currency: "USD",
  deadline: null,
  notes:
    "Repeatable approved affiliate revenue. Unapproved conversions, gross sales, reversed commissions and unverified screenshots do not count. The December 2026 first-sale target is aspirational.",
} as const;

const PILLARS: { id: string; title: string; actions: { title: string; owner: "Shahzeb" | "Masho" | "AI pipeline" }[] }[] = [
  {
    id: "p1",
    title: "Audience and Page portfolio",
    actions: [
      { title: "Set up five legitimate UK Facebook Pages", owner: "Shahzeb" },
      { title: "Finalize bios, brand identities and personas", owner: "Shahzeb" },
      { title: "Configure proper Meta business ownership", owner: "Shahzeb" },
      { title: "Assign Page permissions safely", owner: "Shahzeb" },
      { title: "Establish baseline performance metrics", owner: "Shahzeb" },
      { title: "Study real UK audience response", owner: "Shahzeb" },
      { title: "Improve Page quality and trust", owner: "Masho" },
      { title: "Review which audiences attract relevant traffic", owner: "Shahzeb" },
    ],
  },
  {
    id: "p2",
    title: "Storytelling and creative quality",
    actions: [
      { title: "Develop five distinct brand bibles", owner: "Shahzeb" },
      { title: "Research relevant emotional insights", owner: "AI pipeline" },
      { title: "Create original story hooks", owner: "AI pipeline" },
      { title: "Develop repeatable Reel formats", owner: "AI pipeline" },
      { title: "Maintain consistent AI characters and visuals", owner: "AI pipeline" },
      { title: "Produce natural British voiceovers and captions", owner: "AI pipeline" },
      { title: "Review every creative for quality and originality", owner: "Shahzeb" },
      { title: "Build a library of measured creative learnings", owner: "Shahzeb" },
    ],
  },
  {
    id: "p3",
    title: "Content operations",
    actions: [
      { title: "Preserve the first 180-post plan", owner: "Shahzeb" },
      { title: "Resolve incomplete creative briefs", owner: "Shahzeb" },
      { title: "Generate daily assignments", owner: "Shahzeb" },
      { title: "Produce scripts, images and Reels", owner: "AI pipeline" },
      { title: "Store assets with permanent content IDs", owner: "AI pipeline" },
      { title: "Submit work for approval", owner: "AI pipeline" },
      { title: "Publish approved content on schedule", owner: "Masho" },
      { title: "Collect and review actual results", owner: "Shahzeb" },
    ],
  },
  {
    id: "p4",
    title: "Meta data and performance",
    actions: [
      { title: "Connect authorized Facebook Pages", owner: "Shahzeb" },
      { title: "Retrieve actual Page and post identifiers", owner: "Shahzeb" },
      { title: "Collect available Insights data", owner: "Shahzeb" },
      { title: "Store timestamped metric snapshots", owner: "Shahzeb" },
      { title: "Separate organic and paid performance", owner: "Shahzeb" },
      { title: "Compare suitable posts and creative formats", owner: "Shahzeb" },
      { title: "Detect meaningful performance patterns", owner: "Shahzeb" },
      { title: "Produce weekly evidence-based insights", owner: "Shahzeb" },
    ],
  },
  {
    id: "p5",
    title: "Owned website and comparisons",
    actions: [
      { title: "Launch a public editorial website", owner: "Shahzeb" },
      { title: "Create the five audience sections", owner: "Shahzeb" },
      { title: "Develop reusable landing-page templates", owner: "Shahzeb" },
      { title: "Create genuine editorial and comparison content", owner: "Shahzeb" },
      { title: "Connect posts to website attribution", owner: "Shahzeb" },
      { title: "Test message continuity and landing pages", owner: "Shahzeb" },
      { title: "Measure qualified outbound offer clicks", owner: "Shahzeb" },
      { title: "Improve website experience and conversion", owner: "Shahzeb" },
    ],
  },
  {
    id: "p6",
    title: "Affiliate sales and finance",
    actions: [
      { title: "Research suitable PPS affiliate networks", owner: "Shahzeb" },
      { title: "Verify allowed traffic sources and GEOs", owner: "Shahzeb" },
      { title: "Confirm offers, payouts and terms", owner: "Shahzeb" },
      { title: "Track click IDs and network subIDs", owner: "Shahzeb" },
      { title: "Receive authenticated conversion postbacks", owner: "Shahzeb" },
      { title: "Reconcile approved and reversed commissions", owner: "Shahzeb" },
      { title: "Track operating expenses and investments", owner: "Shahzeb" },
      { title: "Optimize approved revenue and net margin", owner: "Shahzeb" },
    ],
  },
  {
    id: "p7",
    title: "Staff, infrastructure and operations",
    actions: [
      { title: "Implement secure owner login", owner: "Shahzeb" },
      { title: "Implement secure staff accounts", owner: "Shahzeb" },
      { title: "Assign appropriate Page permissions", owner: "Shahzeb" },
      { title: "Run Masho's daily publishing queue", owner: "Masho" },
      { title: "Connect secure asset management", owner: "Shahzeb" },
      { title: "Create training and quality procedures", owner: "Shahzeb" },
      { title: "Maintain backups and system monitoring", owner: "Shahzeb" },
      { title: "Expand staff capacity responsibly", owner: "Shahzeb" },
    ],
  },
  {
    id: "p8",
    title: "Experiments, strategy and expansion",
    actions: [
      { title: "Review Mandala progress weekly", owner: "Shahzeb" },
      { title: "Identify the current biggest bottleneck", owner: "Shahzeb" },
      { title: "Generate three prioritized next experiments", owner: "Shahzeb" },
      { title: "Test new hooks, content and publishing times", owner: "AI pipeline" },
      { title: "Record hypotheses and measured outcomes", owner: "Shahzeb" },
      { title: "Evaluate new Pages, GEOs and offers", owner: "Shahzeb" },
      { title: "Approve selective paid amplification", owner: "Shahzeb" },
      { title: "Expand successful publishing assets", owner: "Shahzeb" },
    ],
  },
];

export type MandalaActionSeed = {
  id: string;
  pillarId: string;
  position: number;
  title: string;
  description: string;
  successCriterion: string;
  ownerLabel: string;
  priority: "normal";
  status: "NOT_STARTED";
};

export type MandalaPillarSeed = {
  id: string;
  goalId: string;
  position: number;
  title: string;
  actions: MandalaActionSeed[];
};

export const MANDALA_PILLARS: MandalaPillarSeed[] = PILLARS.map((pillar, pillarIndex) => ({
  id: pillar.id,
  goalId: MANDALA_GOAL.id,
  position: pillarIndex + 1,
  title: pillar.title,
  actions: pillar.actions.map((action, actionIndex) => ({
    id: `${pillar.id}-a${actionIndex + 1}`,
    pillarId: pillar.id,
    position: actionIndex + 1,
    title: action.title,
    description: action.title,
    successCriterion: `Verified evidence exists for: ${action.title}. A checkbox alone is not success.`,
    ownerLabel: action.owner,
    priority: "normal" as const,
    status: "NOT_STARTED" as const,
  })),
}));
