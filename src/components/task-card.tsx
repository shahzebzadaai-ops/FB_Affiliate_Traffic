"use client";

import Link from "next/link";
import { useCampaign } from "@/campaign/campaign-context";
import { placedPhrase } from "@/domain/campaign";
import { pageByCode } from "@/domain/pages";
import type { ContentRecord } from "@/domain/types";
import { statusLabel, usePreview } from "@/preview/preview-context";
import { formatLabel } from "@/components/format-label";

export function TaskCard({
  record,
  href,
  action,
}: {
  record: ContentRecord;
  href: string;
  action: string;
}) {
  const preview = usePreview();
  const campaign = useCampaign();
  const page = pageByCode(record.pageCode);
  const state = preview.stateFor(record.contentId);
  const hook = preview.effectiveHook(record);

  return (
    <article
      className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
      style={{ backgroundColor: page.wash }}
    >
      <div className="h-1.5" style={{ backgroundColor: page.accent }} />
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide uppercase" style={{ color: page.accent }}>
          <span>{page.name}</span>
          <span aria-hidden="true">·</span>
          <span>{formatLabel(record.format)}</span>
          {record.priority ? <span>Priority</span> : null}
        </div>
        <h3 className="font-heading text-2xl leading-snug text-foreground">“{hook}”</h3>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Content pillar</dt>
            <dd>{record.pillar}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Page</dt>
            <dd>{page.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Deadline</dt>
            <dd>{placedPhrase(record.dueAt, preview.stateFor(record.contentId).dueAtOverride, campaign.record)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{statusLabel(state.status)}</dd>
          </div>
        </dl>
        <Link
          href={href}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {action}
        </Link>
      </div>
    </article>
  );
}
