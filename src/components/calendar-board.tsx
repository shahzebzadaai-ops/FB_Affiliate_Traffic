"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCampaign } from "@/campaign/campaign-context";
import { contentRecords } from "@/content/catalog";
import { isLiveDate, placedInstant, placedPhrase, planDayIndex } from "@/domain/campaign";
import { PAGE_IDENTITIES, pageByCode } from "@/domain/pages";
import { londonDateKey } from "@/domain/schedule";
import { statusLabel, usePreview } from "@/preview/preview-context";
import { formatLabel } from "@/components/task-card";

export function CalendarBoard({ mode }: { mode: "staff" | "owner" }) {
  const preview = usePreview();
  const campaign = useCampaign();
  const live = campaign.ready && isLiveDate(campaign.record);
  const [pageCode, setPageCode] = useState<string>("ALL");
  const groups = useMemo(() => {
    const filtered = contentRecords.filter((record) => pageCode === "ALL" || record.pageCode === pageCode);
    const map = new Map<string, typeof filtered>();
    for (const record of filtered) {
      const override = preview.stateFor(record.contentId).publishAtOverride;
      const instant = placedInstant(record.publishAt, override, campaign.record);
      const key = override || live ? londonDateKey(instant) : `day-${String(planDayIndex(record.publishAt) + 1).padStart(2, "0")}`;
      map.set(key, [...(map.get(key) ?? []), record]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [pageCode, preview, live, campaign.record]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-5xl tracking-tight">Content calendar</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {live
            ? "Dates follow the confirmed UK launch. Nine posts per Page each week. A planned time does not mean the post was published."
            : "Build mode. Days are relative to the future launch: Day 1 through Day 30. No calendar date is live until you start the 30-day launch."}
        </p>
      </header>
      <div className="flex gap-2 overflow-x-auto">
        <FilterButton active={pageCode === "ALL"} onClick={() => setPageCode("ALL")} label="All Pages" />
        {PAGE_IDENTITIES.map((page) => (
          <FilterButton key={page.code} active={pageCode === page.code} onClick={() => setPageCode(page.code)} label={page.name} />
        ))}
      </div>
      <div className="space-y-6">
        {groups.map(([day, records]) => (
          <section key={day}>
            <h2 className="font-heading text-2xl">{day.startsWith("day-") ? `Day ${Number(day.slice(4))}` : new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</h2>
            <ul className="mt-3 divide-y divide-border rounded-xl bg-card ring-1 ring-foreground/10">
              {records
                .slice()
                .sort((a, b) => placedInstant(a.publishAt, preview.stateFor(a.contentId).publishAtOverride, campaign.record).localeCompare(placedInstant(b.publishAt, preview.stateFor(b.contentId).publishAtOverride, campaign.record)))
                .map((record) => {
                  const page = pageByCode(record.pageCode);
                  const state = preview.stateFor(record.contentId);
                  return (
                    <li key={record.contentId} className="grid gap-2 px-4 py-3 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
                      <p className="text-sm text-muted-foreground">{placedPhrase(record.publishAt, preview.stateFor(record.contentId).publishAtOverride, campaign.record)}</p>
                      <div>
                        <Link href={`/${mode}/tasks/${record.contentId}`} className="font-medium hover:underline" style={{ color: page.accent }}>
                          {page.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">{formatLabel(record.format)} · {preview.effectiveHook(record)}</p>
                      </div>
                      <p className="text-sm">{statusLabel(state.status)}</p>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
      {label}
    </button>
  );
}
