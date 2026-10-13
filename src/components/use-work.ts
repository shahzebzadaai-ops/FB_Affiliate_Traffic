"use client";

import { contentRecords } from "@/content/catalog";
import { useCampaign } from "@/campaign/campaign-context";
import { campaignClock, isLiveDate, placedInstant, planDayIndex } from "@/domain/campaign";
import { londonToday } from "@/domain/schedule";
import type { ContentRecord } from "@/domain/types";
import { usePreview, usePreviewClock } from "@/preview/preview-context";
import type { TaskState } from "@/preview/task-state";

export type WorkItem = {
  record: ContentRecord;
  state: TaskState;
  dueAt: string;
  publishAt: string;
  planDay: number;
};

export function useWork() {
  const preview = usePreview();
  const campaign = useCampaign();
  const record = campaign.record;
  const live = campaign.ready && isLiveDate(record);
  const today = londonToday();
  const now = usePreviewClock();
  const clock = campaignClock(record, now === null ? new Date() : new Date(now));
  const decorated = contentRecords.filter((item) => preview.ready && preview.canAccess(item.contentId)).map((item) => {
    const state = preview.stateFor(item.contentId);
    const dueAt = placedInstant(item.dueAt, state.dueAtOverride, record);
    const publishAt = placedInstant(item.publishAt, state.publishAtOverride, record);
    return { record: item, state, dueAt, publishAt, planDay: planDayIndex(item.publishAt) + 1 };
  });
  return { preview, campaign, live, today, now, clock, decorated };
}
