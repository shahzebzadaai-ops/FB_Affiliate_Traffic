"use client";

import { useState } from "react";
import Link from "next/link";
import { confirmCampaignStart, useCampaign } from "@/campaign/campaign-context";
import { contentRecords, importReport } from "@/content/catalog";
import { campaignClock, isLiveDate, placedInstant, placedPhrase, planDayIndex } from "@/domain/campaign";
import { PAGE_IDENTITIES, pageByCode } from "@/domain/pages";
import { greetingForLondonHour, londonDateKey, londonToday, UK_MARKET } from "@/domain/schedule";
import { usePreview, usePreviewClock } from "@/preview/preview-context";
import { TaskCard } from "@/components/task-card";

const OPEN = new Set(["PLANNED", "ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED"]);

function useWork() {
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

export function StaffHome() {
  const { today, now, decorated, live, clock, campaign } = useWork();
  const todays = decorated
    .filter((item) => item.state.status !== "CANCELLED")
    .filter((item) =>
      live
        ? londonDateKey(item.dueAt) === today || londonDateKey(item.publishAt) === today
        : item.planDay === 1 && !item.state.dueAtOverride && !item.state.publishAtOverride,
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.record.contentId.localeCompare(b.record.contentId));
  const remaining = decorated.filter((item) => OPEN.has(item.state.status));
  const waiting = decorated.filter((item) => item.state.status === "READY_FOR_REVIEW");
  const overdue = !live || now === null ? [] : remaining.filter((item) => Date.parse(item.dueAt) < now);
  const completed = decorated.filter((item) => !OPEN.has(item.state.status) && item.state.status !== "CANCELLED" && item.state.status !== "PLANNED");
  const upcoming = decorated
    .filter((item) => item.state.status !== "CANCELLED" && (live ? londonDateKey(item.publishAt) > today : item.planDay > 1))
    .sort((a, b) => a.planDay - b.planDay || a.publishAt.localeCompare(b.publishAt))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <header>
        <CampaignStatus clock={clock} />
        <h1 className="mt-2 font-heading text-5xl tracking-tight">{greetingForLondonHour()}, Masho</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {live
            ? "Your work for today is already on the calendar. You do not need to choose a topic."
            : "The 30-day clock has not started. Day 1 posts below are preparation work, not a live publishing day."}
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={live ? "Due today" : "Day 1 to prepare"} value={todays.length} />
        <Stat label="Still to produce" value={remaining.length} />
        <Stat label="Waiting for approval" value={waiting.length} />
        <Stat label="Overdue" value={overdue.length} />
      </section>
      <p className="text-sm text-muted-foreground">{completed.length} tasks have moved past production. Cancelled work is not counted as done.</p>
      <section className="space-y-4">
        <h2 className="font-heading text-3xl">{live ? "Today's tasks" : "Day 1 preparation"}</h2>
        {todays.length === 0 ? (
          <p className="rounded-xl bg-card p-5 text-sm ring-1 ring-foreground/10">
            {live ? "Nothing is due today. Check the calendar for the next publishing window." : "Day 1 posts are not in the plan."}
          </p>
        ) : (
          <div className="grid gap-4">
            {todays.map((item) => (
              <TaskCard
                key={item.record.contentId}
                record={item.record}
                href={`/staff/tasks/${item.record.contentId}`}
                action={item.state.status === "ASSIGNED" ? "Start task" : "Open task"}
              />
            ))}
          </div>
        )}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-3xl">Upcoming deadlines</h2>
          <ul className="mt-3 divide-y divide-border rounded-xl bg-card ring-1 ring-foreground/10">
            {upcoming.map((item) => (
              <li key={item.record.contentId} className="px-4 py-3 text-sm">
                <Link href={`/staff/tasks/${item.record.contentId}`} className="font-medium hover:underline">
                  {item.record.contentId}
                </Link>
                <p className="text-muted-foreground">{pageByCode(item.record.pageCode).name} · {placedPhrase(item.record.publishAt, item.state.publishAtOverride, campaign.record)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-heading text-3xl">Assigned Pages</h2>
          <ul className="mt-3 space-y-3">
            {PAGE_IDENTITIES.map((page) => (
              <li key={page.code} className="rounded-xl p-4 ring-1 ring-foreground/10" style={{ backgroundColor: page.wash }}>
                <p className="font-medium" style={{ color: page.accent }}>{page.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{page.ageRange} · {page.persona}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export function OwnerHome() {
  const { decorated, today, live, clock } = useWork();
  const byStatus = (status: string) => decorated.filter((item) => item.state.status === status).length;
  const published = decorated.filter((item) => ["PUBLISHED", "METRICS_DUE", "PERFORMANCE_RECORDED"].includes(item.state.status));
  const prepared = decorated.filter((item) => !["ASSIGNED", "PLANNED"].includes(item.state.status)).length;
  const todays = decorated.filter((item) => item.state.status !== "CANCELLED" && londonDateKey(item.publishAt) === today);
  const unfinished = decorated.filter((item) => !["PUBLISHED", "METRICS_DUE", "PERFORMANCE_RECORDED", "CANCELLED"].includes(item.state.status));

  return (
    <div className="space-y-8">
      <LaunchPanel clock={clock} prepared={prepared} total={decorated.length} published={published.length} unfinished={unfinished.length} live={live} todays={todays.length} waiting={byStatus("READY_FOR_REVIEW")} />
      <header>
        <h1 className="font-heading text-5xl tracking-tight">Company</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {importReport.successfullyImported} planned posts stay in the month-one plan. Counts below are task status. Revenue stays empty until a network is connected.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Not started" value={byStatus("ASSIGNED")} />
        <Stat label="In progress" value={byStatus("IN_PROGRESS")} />
        <Stat label="Needs your review" value={byStatus("READY_FOR_REVIEW")} />
        <Stat label="Published" value={published.length} />
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {PAGE_IDENTITIES.map((page) => {
          const posts = decorated.filter((item) => item.record.pageCode === page.code);
          const done = posts.filter((item) => !OPEN.has(item.state.status) && item.state.status !== "CANCELLED").length;
          return (
            <Link key={page.code} href={`/owner/pages/${page.code}`} className="rounded-2xl p-5 ring-1 ring-foreground/10" style={{ backgroundColor: page.wash }}>
              <p className="text-xs font-medium tracking-wide uppercase" style={{ color: page.accent }}>{page.code}</p>
              <h2 className="mt-1 font-heading text-3xl">{page.name}</h2>
              <p className="mt-2 text-sm leading-relaxed">{page.persona}</p>
              <p className="mt-4 text-sm text-muted-foreground">{done} of {posts.length} moved past production</p>
            </Link>
          );
        })}
      </section>
      <section>
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-3xl">Masho&apos;s queue</h2>
          <Link href="/owner/approvals" className="text-sm text-primary">Open approvals</Link>
        </div>
        <div className="mt-4 grid gap-4">
          {decorated
            .filter((item) => ["READY_FOR_REVIEW", "IN_PROGRESS", "CHANGES_REQUESTED"].includes(item.state.status) || (live && londonDateKey(item.dueAt) === today))
            .slice(0, 6)
            .map((item) => (
              <TaskCard key={item.record.contentId} record={item.record} href={`/owner/tasks/${item.record.contentId}`} action="Review task" />
            ))}
        </div>
      </section>
      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-3xl">Affiliate finance</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Not connected. Approved commission, payouts and postback results will appear here only after a network is authenticated. Nothing on this screen is revenue.
        </p>
        <Link href="/owner/affiliate" className="mt-4 inline-flex text-sm text-primary">Open the finance area</Link>
      </section>
    </div>
  );
}

function CampaignStatus({ clock }: { clock: ReturnType<typeof campaignClock> }) {
  const label =
    clock.phase === "BUILD"
      ? "Campaign not started"
      : clock.phase === "ACTIVE"
        ? `Active campaign · Day ${clock.day} of ${UK_MARKET.sprintDays}`
        : `30-day calendar complete · Day ${clock.day} · awaiting final review`;
  return <p className="text-sm font-medium tracking-[0.14em] text-primary uppercase">{label}</p>;
}

function LaunchPanel({
  clock,
  prepared,
  total,
  published,
  unfinished,
  live,
  todays,
  waiting,
}: {
  clock: ReturnType<typeof campaignClock>;
  prepared: number;
  total: number;
  published: number;
  unfinished: number;
  live: boolean;
  todays: number;
  waiting: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { error: loadError } = useCampaign();

  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <CampaignStatus clock={clock} />
      {clock.phase === "BUILD" ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-heading text-3xl">Build mode</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {prepared} of {total} planned posts have moved past assignment. This is preparation progress, not a live result. Nothing is published because a date arrived.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium tracking-wide text-primary-foreground uppercase"
            onClick={() => setOpen(true)}
          >
            Start 30-day launch
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Today's posting tasks" value={live ? todays : 0} />
          <Stat label="Pending approvals" value={waiting} />
          <Stat label="Published" value={published} />
          {clock.phase === "REVIEW" ? (
            <p className="text-sm text-muted-foreground sm:col-span-3">
              {unfinished === 0
                ? "The 30-day calendar is complete. The post history is still here."
                : `${unfinished} posts are still unfinished. They stay visible. The calendar was not erased.`}
            </p>
          ) : null}
        </div>
      )}
      {loadError ? <p className="mt-3 text-sm text-destructive">{loadError}</p> : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="start-launch-title" className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-lg">
            <h2 id="start-launch-title" className="font-heading text-3xl">Start the 30-day UK launch?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The campaign clock will begin on today&apos;s Europe/London date and run for 30 days. Planned posts keep their order and gain real dates from that start. No post is published by starting the clock. This start is stored on this machine and is not cleared by a refresh or a server restart.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="inline-flex h-11 items-center justify-center rounded-lg bg-muted px-4 text-sm" onClick={() => setOpen(false)} disabled={pending}>
                Keep building
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                disabled={pending}
                onClick={() => {
                  setPending(true);
                  void confirmCampaignStart().then((result) => {
                    setPending(false);
                    if (!result.ok) {
                      setError(result.error ?? "The campaign was not started.");
                      return;
                    }
                    setOpen(false);
                  });
                }}
              >
                Start the campaign
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-4xl">{value}</p>
    </div>
  );
}
