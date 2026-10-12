"use client";

import Link from "next/link";
import { contentRecords, importReport } from "@/content/catalog";
import { PAGE_IDENTITIES, pageByCode } from "@/domain/pages";
import { formatLondon, greetingForLondonHour, launchDayNumber, londonDateKey, londonToday, UK_MARKET } from "@/domain/schedule";
import { usePreview, usePreviewClock } from "@/preview/preview-context";
import { TaskCard } from "@/components/task-card";

const OPEN = new Set(["PLANNED", "ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED"]);

function useWork() {
  const preview = usePreview();
  const today = londonToday();
  const now = usePreviewClock();
  const decorated = contentRecords.map((record) => {
    const state = preview.stateFor(record.contentId);
    const dueAt = preview.effectiveDue(record);
    const publishAt = preview.effectivePublish(record);
    return { record, state, dueAt, publishAt };
  });
  return { preview, today, now, decorated };
}

export function StaffHome() {
  const { today, now, decorated } = useWork();
  const day = launchDayNumber(today);
  const todays = decorated
    .filter((item) => item.state.status !== "CANCELLED")
    .filter((item) => londonDateKey(item.dueAt) === today || londonDateKey(item.publishAt) === today)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const remaining = decorated.filter((item) => OPEN.has(item.state.status));
  const waiting = decorated.filter((item) => item.state.status === "READY_FOR_REVIEW");
  const overdue = now === null ? [] : remaining.filter((item) => Date.parse(item.dueAt) < now);
  const completed = decorated.filter((item) => !OPEN.has(item.state.status) && item.state.status !== "CANCELLED" && item.state.status !== "PLANNED");
  const upcoming = decorated
    .filter((item) => item.state.status !== "CANCELLED" && londonDateKey(item.publishAt) > today)
    .sort((a, b) => a.publishAt.localeCompare(b.publishAt))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium tracking-[0.14em] text-primary uppercase">UK launch · Day {Math.min(Math.max(day, 1), UK_MARKET.sprintDays)} of {UK_MARKET.sprintDays}</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">{greetingForLondonHour()}, Masho</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Your work for today is already on the calendar. You do not need to choose a topic.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Due today" value={todays.length} />
        <Stat label="Still to produce" value={remaining.length} />
        <Stat label="Waiting for approval" value={waiting.length} />
        <Stat label="Overdue" value={overdue.length} />
      </section>
      <p className="text-sm text-muted-foreground">{completed.length} tasks have moved past production. Cancelled work is not counted as done.</p>
      <section className="space-y-4">
        <h2 className="font-heading text-3xl">Today&apos;s tasks</h2>
        {todays.length === 0 ? (
          <p className="rounded-xl bg-card p-5 text-sm ring-1 ring-foreground/10">Nothing is due today. Check the calendar for the next publishing window.</p>
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
                <p className="text-muted-foreground">{pageByCode(item.record.pageCode).name} · {formatLondon(item.publishAt)}</p>
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
  const { decorated, today } = useWork();
  const day = launchDayNumber(today);
  const byStatus = (status: string) => decorated.filter((item) => item.state.status === status).length;
  const published = decorated.filter((item) => ["PUBLISHED", "METRICS_DUE", "PERFORMANCE_RECORDED"].includes(item.state.status));

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium tracking-[0.14em] text-primary uppercase">UK launch · Day {Math.min(Math.max(day, 1), UK_MARKET.sprintDays)} of {UK_MARKET.sprintDays}</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Company</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {importReport.successfullyImported} planned posts are in the month-one calendar. Performance and revenue stay empty until real numbers are entered.
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
            .filter((item) => ["READY_FOR_REVIEW", "IN_PROGRESS", "CHANGES_REQUESTED"].includes(item.state.status) || londonDateKey(item.dueAt) === today)
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-4xl">{value}</p>
    </div>
  );
}
