"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { confirmCampaignStart, useCampaign } from "@/campaign/campaign-context";
import { importReport } from "@/content/catalog";
import { PAGE_IDENTITIES } from "@/domain/pages";
import { UK_MARKET } from "@/domain/schedule";
import { integrationStatus } from "@/integrations/status";
import { isMissedPublication } from "@/preview/queues";
import { useWork } from "@/components/use-work";

const PUBLISHED = new Set(["PUBLISHED", "METRICS_DUE", "PERFORMANCE_RECORDED"]);

export function OwnerOverview() {
  const { decorated, live, clock, now } = useWork();
  const waiting = decorated.filter((item) => item.state.status === "READY_FOR_REVIEW").length;
  const missed = now === null ? 0 : decorated.filter((item) => isMissedPublication(item.state.status, Date.parse(item.publishAt), now, live)).length;
  const disconnected = integrationStatus();

  return (
    <div className="space-y-12">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Owner</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Overview</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Issues first. Figures that are not connected stay blank.</p>
      </header>
      <LaunchControl />
      <section>
        <h2 className="font-heading text-3xl tracking-tight">Needs attention</h2>
        <ul className="mt-4 divide-y border-y">
          <Attention href="/owner/import" label="Plan" detail={`${importReport.unresolved.length} unresolved content notes`} />
          <MediaWorkerAttention />
          <Attention href="/owner/approvals" label="Approvals" detail={waiting === 0 ? "Nothing is waiting" : `${waiting} waiting for review`} />
          <Attention href="/owner/calendar" label="Missed" detail={live ? `${missed} posts past their UK time and still unpublished` : "None. The campaign clock has not started."} />
          <Attention href="/owner/integrations" label="Integrations" detail={disconnected.map((item) => item.name).join(" · ") + " — not connected"} />
        </ul>
      </section>
      <section>
        <h2 className="font-heading text-3xl tracking-tight">Five UK Pages</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">Reach, clicks, conversions, commission and AI cost are not connected. The post counts are the plan.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr className="border-b">
                <th className="py-3 pr-4 font-medium">Page</th>
                <th className="py-3 pr-4 font-medium">Posts</th>
                <th className="py-3 pr-4 font-medium">Published</th>
                <th className="py-3 pr-4 font-medium">Organic reach</th>
                <th className="py-3 pr-4 font-medium">Clicks</th>
                <th className="py-3 pr-4 font-medium">PPS</th>
                <th className="py-3 font-medium">Commission</th>
              </tr>
            </thead>
            <tbody>
              {PAGE_IDENTITIES.map((page) => {
                const posts = decorated.filter((item) => item.record.pageCode === page.code);
                const published = posts.filter((item) => PUBLISHED.has(item.state.status)).length;
                return (
                  <tr key={page.code} className="border-b">
                    <td className="py-3 pr-4">
                      <Link href={`/owner/pages/${page.code}`} className="font-medium" style={{ color: page.accent }}>{page.name}</Link>
                    </td>
                    <td className="py-3 pr-4">{posts.length}</td>
                    <td className="py-3 pr-4">{published}</td>
                    <td className="py-3 pr-4 text-muted-foreground">Not connected</td>
                    <td className="py-3 pr-4 text-muted-foreground">Not connected</td>
                    <td className="py-3 pr-4 text-muted-foreground">Not connected</td>
                    <td className="py-3 text-muted-foreground">Not connected</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-sm text-muted-foreground">
        {clock.phase === "BUILD"
          ? "Build mode. Starting the clock does not publish a post."
          : clock.phase === "ACTIVE"
            ? `Active · day ${clock.day} of ${UK_MARKET.sprintDays}.`
            : "The 30-day calendar is complete. History is still here."}
      </p>
    </div>
  );
}

function MediaWorkerAttention() {
  const [detail, setDetail] = useState("No Mac heartbeat yet. Queue a proof Reel from Systems. Nothing has been rendered.");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/api/media-jobs")
        .then((response) => (response.ok ? response.json() : null))
        .then((body: { buffer?: { ready: number; due: number; sufficient: boolean }; heartbeat?: { online: boolean; lastHeartbeatAt: string | null }; approvedCount?: number } | null) => {
          if (!body?.buffer || !body.heartbeat) return;
          const seen = body.heartbeat.lastHeartbeatAt
            ? `Last heartbeat ${new Date(body.heartbeat.lastHeartbeatAt).toLocaleString("en-GB", { timeZone: "Europe/London" })} UK.`
            : "No Mac heartbeat yet.";
          const presence = body.heartbeat.online ? `Worker online. ${seen}` : seen;
          const buffer = body.buffer.sufficient
            ? ` Ready buffer ${body.buffer.ready} of ${body.buffer.due}.`
            : ` Ready-content buffer is short: ${body.buffer.ready} of ${body.buffer.due}.`;
          const files = body.approvedCount ? ` ${body.approvedCount} approved file${body.approvedCount === 1 ? "" : "s"}.` : " Nothing has been rendered.";
          setDetail(`${presence}${buffer}${files}`);
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <Attention href="/owner/integrations" label="Media worker" detail={detail} />;
}

function Attention({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <li className="grid gap-2 py-4 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6">
      <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{label}</span>
      <span className="text-sm leading-relaxed">{detail}</span>
      <Link href={href} className="text-sm text-primary">Open</Link>
    </li>
  );
}

function LaunchControl() {
  const { clock } = useWork();
  const { error: loadError } = useCampaign();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (clock.phase !== "BUILD") return null;
  return (
    <section className="flex flex-col gap-4 border-y py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-heading text-2xl">Build mode</p>
        <p className="mt-1 text-sm text-muted-foreground">The 30-day clock starts only when you confirm it.</p>
      </div>
      <button type="button" className="inline-flex h-11 items-center justify-center bg-primary px-4 text-sm font-medium text-primary-foreground" onClick={() => setOpen(true)}>
        Start 30-day launch
      </button>
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="start-launch-title" className="w-full max-w-lg bg-card p-6 shadow-lg">
            <h2 id="start-launch-title" className="font-heading text-3xl">Start the 30-day UK launch?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The clock begins on today&apos;s Europe/London date and runs for {UK_MARKET.sprintDays} days. Planned posts keep their order. No post is published by starting the clock.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="inline-flex h-11 items-center justify-center bg-muted px-4 text-sm" onClick={() => setOpen(false)} disabled={pending}>Keep building</button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center bg-primary px-4 text-sm font-medium text-primary-foreground"
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
