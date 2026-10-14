export type ManualMetrics = {
  organicReach: number;
  paidReach: number;
  comments: number;
  shares: number;
  newFollowers: number;
  websiteVisits: number;
};

export function perThousand(count: number, organicReach: number): number | null {
  if (!Number.isFinite(organicReach) || organicReach <= 0) return null;
  if (!Number.isFinite(count) || count < 0) return null;
  return (count / organicReach) * 1000;
}

export type RecommendationCode =
  | "INSUFFICIENT_SAMPLE"
  | "MORE_LIKE_THIS"
  | "TEST_HOOK_IN_ANOTHER_FORMAT"
  | "PILLAR_UNDERPERFORMING"
  | "MORE_PRODUCTION";

export type Recommendation = {
  code: RecommendationCode;
  text: string;
  requiresApproval: true;
};

const MINIMUM_SAMPLE = 50;

export function recommendFromSample(postsWithOrganicReach: number): Recommendation[] {
  if (postsWithOrganicReach < MINIMUM_SAMPLE) {
    return [
      {
        code: "INSUFFICIENT_SAMPLE",
        text: `This Page has ${postsWithOrganicReach} posts with organic reach recorded. That is not enough to call a winner. The threshold is ${MINIMUM_SAMPLE} posts, and Shahzeb still has to approve any change to the plan.`,
        requiresApproval: true,
      },
    ];
  }

  return [
    {
      code: "MORE_LIKE_THIS",
      text: "A post is ahead of this Page's own median. Consider more executions of the insight, with a new situation and hook. Shahzeb approves before it is added.",
      requiresApproval: true,
    },
    {
      code: "TEST_HOOK_IN_ANOTHER_FORMAT",
      text: "Test the winning hook in another format. Do not duplicate the original post.",
      requiresApproval: true,
    },
    {
      code: "PILLAR_UNDERPERFORMING",
      text: "A pillar that stays below this Page's median should be paused. Do not keep producing it only because it is on the calendar.",
      requiresApproval: true,
    },
    {
      code: "MORE_PRODUCTION",
      text: "If one Page keeps producing commercial attention, it can take more of the week's production. That is a staffing decision for Shahzeb.",
      requiresApproval: true,
    },
  ];
}
