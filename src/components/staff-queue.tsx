"use client";

import { placedPhrase } from "@/domain/campaign";
import { greetingForLondonHour, londonDateKey } from "@/domain/schedule";
import { statusLabel } from "@/preview/preview-context";
import { hasMasterFile, inPublishQueue, type StaffQueueName } from "@/preview/queues";
import { PublishCard } from "@/components/publish-card";
import { useWork } from "@/components/use-work";

const COPY: Record<StaffQueueName, { title: string; empty: string; action: string }> = {
  today: {
    title: "Today",
    empty: "Nothing is on today's publishing list.",
    action: "Open",
  },
  ready: {
    title: "Ready to publish",
    empty: "Nothing is ready. A post appears here only after a real image or MP4 is stored.",
    action: "Open",
  },
  scheduled: {
    title: "Scheduled",
    empty: "Nothing is marked scheduled. Schedule in Meta Business Suite, then confirm the live URL here.",
    action: "Open",
  },
  published: {
    title: "Published",
    empty: "Nothing has been published from this operating system.",
    action: "Open",
  },
  issues: {
    title: "Issues",
    empty: "No regeneration flags.",
    action: "Review issue",
  },
};

export function StaffQueue({ queue }: { queue: StaffQueueName }) {
  const { decorated, live, today, campaign, preview } = useWork();
  const assigned = preview.assignedPageCodes;
  const copy = COPY[queue];
  const readyCount = decorated.filter((item) => hasMasterFile(item.state.assetReference)).length;
  const items = decorated
    .filter((item) =>
      inPublishQueue(
        {
          status: item.state.status,
          planDay: item.planDay,
          dueDate: londonDateKey(item.dueAt),
          publishDate: londonDateKey(item.publishAt),
          dueOverridden: Boolean(item.state.dueAtOverride),
          publishOverridden: Boolean(item.state.publishAtOverride),
          assetReference: item.state.assetReference,
          flagged: Boolean(item.state.regenerationRequest),
        },
        queue,
        { live, today },
      ),
    )
    .sort((a, b) => a.publishAt.localeCompare(b.publishAt) || a.record.contentId.localeCompare(b.record.contentId));

  return (
    <div className="space-y-8">
      <header>
        <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-sm font-medium">{live ? "Campaign live" : "Campaign not started"}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{queue === "today" ? "Your publishing tasks for today" : copy.title}</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          {greetingForLondonHour()}. You publish finished assets on your assigned Pages. You do not write prompts, scripts or Reels. Ready to publish is {readyCount}.
        </p>
      </header>
      {assigned.length === 0 ? (
        <p className="atos-surface px-5 py-8 text-sm leading-relaxed text-muted-foreground">No Facebook Pages are assigned to you yet.</p>
      ) : items.length === 0 ? (
        <p className="atos-surface px-5 py-8 text-sm leading-relaxed text-muted-foreground">{copy.empty}</p>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <PublishCard
              key={item.record.contentId}
              record={item.record}
              href={`/staff/tasks/${item.record.contentId}`}
              publishPhrase={placedPhrase(item.record.publishAt, item.state.publishAtOverride, campaign.record)}
              hook={preview.effectiveHook(item.record)}
              status={statusLabel(item.state.status)}
              ready={hasMasterFile(item.state.assetReference)}
              action={copy.action}
            />
          ))}
        </div>
      )}
    </div>
  );
}
