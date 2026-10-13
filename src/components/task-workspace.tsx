"use client";

import { useState } from "react";
import Link from "next/link";
import { pageByCode } from "@/domain/pages";
import { productionGuide } from "@/domain/guide";
import { PROMPT_PACKS } from "@/domain/prompts";
import { QUALITY_CHECKS } from "@/domain/quality";
import { useCampaign } from "@/campaign/campaign-context";
import { placedInstant, placedPhrase } from "@/domain/campaign";
import { formatLondon, londonDateTimeToUtc } from "@/domain/schedule";
import { WORKFLOWS } from "@/domain/workflows";
import { recordById } from "@/content/catalog";
import { type MetricEntry } from "@/preview/task-state";
import { statusLabel, usePreview } from "@/preview/preview-context";
import { AssetFrame } from "@/components/asset-frame";
import { formatLabel } from "@/components/task-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export function TaskWorkspace({
  contentId,
  mode,
}: {
  contentId: string;
  mode: "staff" | "owner";
}) {
  const record = recordById(contentId);
  const preview = usePreview();
  const campaign = useCampaign();
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [publishDate, setPublishDate] = useState("2026-10-13");
  const [publishTime, setPublishTime] = useState("19:00");
  const [copied, setCopied] = useState<string | null>(null);

  if (!record) {
    return <p>This content ID is not in the imported plan.</p>;
  }
  if (preview.ready && !preview.canAccess(record.contentId)) {
    return <p>This task is not assigned to you.</p>;
  }

  const page = pageByCode(record.pageCode);
  const state = preview.stateFor(record.contentId);
  const hook = preview.effectiveHook(record);
  const duePhrase = placedPhrase(record.dueAt, state.dueAtOverride, campaign.record);
  const publishPhrase = placedPhrase(record.publishAt, state.publishAtOverride, campaign.record);
  const guide = productionGuide(page, {
    ...record,
    hook,
    dueAt: placedInstant(record.dueAt, state.dueAtOverride, campaign.record),
    publishAt: placedInstant(record.publishAt, state.publishAtOverride, campaign.record),
  }).map((step) => {
    if (step.n === 17) return { ...step, body: `Submit before ${duePhrase}. That is three hours before the publishing window.` };
    if (step.n === 18) return { ...step, body: `Only after Shahzeb approves it. Planned time: ${publishPhrase}.` };
    return step;
  });
  const back = mode === "owner" ? "/owner" : "/staff";

  if (mode === "staff") {
    return (
      <PublishDesk
        pageName={page.name}
        accent={page.accent}
        contentId={record.contentId}
        formatLabelText={formatLabel(record.format)}
        hook={hook}
        publishPhrase={publishPhrase}
        caption={record.captionInstructions}
        status={statusLabel(state.status)}
        flagged={state.regenerationRequest?.note ?? null}
        facebookUrl={state.facebookUrl}
        onFlag={(note) => {
          void preview.flagRegeneration(record.contentId, note).then((ok) => {
            setNotice(ok ? "Flagged for regeneration. No AI job was started." : "Describe the problem in at least 8 characters.");
          });
        }}
        onPublish={(url) => {
          void preview.publish(record.contentId, url).then((ok) => {
            setNotice(ok ? "The Facebook URL was saved. This app did not post it." : "A URL can be saved only after the asset is approved. There is no finished file yet.");
          });
        }}
        onNotice={setNotice}
        notice={notice}
      />
    );
  }

  async function copyPrompt(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
  }

  return (
    <div className="space-y-6">
      <Link href={back} className="text-sm text-muted-foreground hover:text-foreground">
        Back
      </Link>
      <p className="rounded-xl bg-card p-4 text-sm leading-relaxed text-muted-foreground ring-1 ring-foreground/10">
        This brief is for the AI production pipeline and your approval. Masho does not write the prompt, script or video. No model is connected, so nothing here is a finished asset.
      </p>
      <header className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10" style={{ backgroundColor: page.wash }}>
        <div className="h-1.5" style={{ backgroundColor: page.accent }} />
        <div className="space-y-3 p-5 sm:p-6">
          <p className="text-xs font-medium tracking-[0.14em] uppercase" style={{ color: page.accent }}>
            {page.name} · {record.contentId}
          </p>
          <h1 className="font-heading text-4xl leading-tight">{formatLabel(record.format)}</h1>
          <p className="max-w-3xl font-heading text-2xl leading-snug">“{hook}”</p>
          <p className="text-sm text-muted-foreground">
            {statusLabel(state.status)} · Publish {placedPhrase(record.publishAt, state.publishAtOverride, campaign.record)} · Due {placedPhrase(record.dueAt, state.dueAtOverride, campaign.record)}
          </p>
        </div>
      </header>

      {record.unresolved.length > 0 ? (
        <section className="rounded-xl border border-amber-700/30 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          <p className="font-medium">Unresolved plan notes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {record.unresolved.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="mt-2">Follow the format on this task until Shahzeb changes the plan. Do not produce a weak or conflicting version just to clear the calendar.</p>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-4">
          <ol className="space-y-3">
            {guide.map((step) => (
              <li key={step.n} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <p className="text-xs font-medium tracking-wide text-primary uppercase">{step.n}. {step.title}</p>
                <p className="mt-2 text-sm leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
          <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <h2 className="font-heading text-2xl">Copy a prompt</h2>
            <p className="mt-1 text-sm text-muted-foreground">External ChatGPT and image tools. Nothing is sent to an AI API from this preview.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PROMPT_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  className="rounded-full bg-muted px-3 py-2 text-sm"
                  onClick={() => copyPrompt(pack.id, pack.build(page, { ...record, hook }))}
                >
                  {copied === pack.id ? "Copied" : pack.label}
                </button>
              ))}
            </div>
          </section>
          {state.revisions.length > 0 ? (
            <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="font-heading text-2xl">Version history</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {state.revisions.map((revision, index) => (
                  <li key={`${revision.at}-${index}`}>
                    <p className="font-medium">{revision.action} · {revision.actorId}</p>
                    <p className="text-muted-foreground">{formatLondon(revision.at)} · {revision.comment}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <h2 className="font-heading text-2xl">Production checklist</h2>
            <ul className="mt-3 space-y-3">
              {WORKFLOWS[record.format].map((item) => (
                <li key={item.id} className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={Boolean(state.checklist[item.id])}
                    onCheckedChange={(checked) => preview.toggleCheck(record.contentId, "checklist", item.id, checked === true)}
                    disabled={mode === "owner"}
                    id={`${record.contentId}-${item.id}`}
                  />
                  <label htmlFor={`${record.contentId}-${item.id}`}>{item.label}</label>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <h2 className="font-heading text-2xl">Quality checklist</h2>
            <ul className="mt-3 space-y-3">
              {QUALITY_CHECKS.map((item) => (
                <li key={item.id} className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={Boolean(state.qualityChecks[item.id])}
                    onCheckedChange={(checked) => preview.toggleCheck(record.contentId, "qualityChecks", item.id, checked === true)}
                    disabled={mode === "owner"}
                    id={`${record.contentId}-q-${item.id}`}
                  />
                  <label htmlFor={`${record.contentId}-q-${item.id}`}>
                    <span className="block">{item.label}</span>
                    <span className="text-muted-foreground">{item.detail}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
          <OwnerControls
            contentId={record.contentId}
            status={state.status}
            reviewNote={reviewNote}
            setReviewNote={setReviewNote}
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            publishDate={publishDate}
            setPublishDate={setPublishDate}
            publishTime={publishTime}
            setPublishTime={setPublishTime}
            onNotice={setNotice}
            notice={notice}
          />
        </aside>
      </div>
    </div>
  );
}

function OwnerControls({
  contentId,
  status,
  reviewNote,
  setReviewNote,
  cancelReason,
  setCancelReason,
  publishDate,
  setPublishDate,
  publishTime,
  setPublishTime,
  onNotice,
  notice,
}: {
  contentId: string;
  status: string;
  reviewNote: string;
  setReviewNote: (value: string) => void;
  cancelReason: string;
  setCancelReason: (value: string) => void;
  publishDate: string;
  setPublishDate: (value: string) => void;
  publishTime: string;
  setPublishTime: (value: string) => void;
  onNotice: (value: string) => void;
  notice: string | null;
}) {
  const preview = usePreview();
  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="font-heading text-2xl">Review</h2>
      <p className="mt-1 text-sm text-muted-foreground">Current status: {status}. Masho cannot approve his own work.</p>
      <Textarea className="mt-3 min-h-24" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Revision or approval note" />
      <div className="mt-3 grid gap-2">
        <button
          type="button"
          className="h-11 rounded-lg bg-primary text-sm font-medium text-primary-foreground"
          onClick={() => {
            void preview.approve(contentId, reviewNote).then((ok) => onNotice(ok ? "Approved." : "Only a submitted task can be approved, and not by its assignee."));
          }}
        >
          Approve
        </button>
        <button
          type="button"
          className="h-11 rounded-lg bg-muted text-sm font-medium"
          onClick={() => {
            void preview.requestRevision(contentId, reviewNote).then((ok) => onNotice(ok ? "Changes requested." : "Add a revision note of at least 8 characters."));
          }}
        >
          Request changes
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <input className="h-10 rounded-lg border border-input px-2 text-sm" type="date" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} />
        <input className="h-10 rounded-lg border border-input px-2 text-sm" type="time" value={publishTime} onChange={(event) => setPublishTime(event.target.value)} />
      </div>
      <button
        type="button"
        className="mt-2 h-10 w-full rounded-lg bg-muted text-sm"
        onClick={() => {
          const publishAt = londonDateTimeToUtc(publishDate, publishTime).toISOString();
          const dueAt = new Date(Date.parse(publishAt) - 3 * 60 * 60 * 1000).toISOString();
          void preview.postpone(contentId, dueAt, publishAt, reviewNote || "Publishing time moved.").then((ok) => onNotice(ok ? "Deadline updated." : "This task can no longer be moved."));
        }}
      >
        Move deadline
      </button>
      <Textarea className="mt-3 min-h-16" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Why this should be cancelled" />
      <button
        type="button"
        className="mt-2 h-10 w-full rounded-lg text-sm text-destructive"
        onClick={() => {
          void preview.cancel(contentId, cancelReason).then((ok) => onNotice(ok ? "Cancelled." : "Add a reason before cancelling."));
        }}
      >
        Cancel this post
      </button>
      {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
    </section>
  );
}

function MetricsForm({ contentId, onNotice }: { contentId: string; onNotice: (value: string) => void }) {
  const preview = usePreview();
  const [checkpoint, setCheckpoint] = useState<MetricEntry["checkpoint"]>("24h");
  const [organicReach, setOrganicReach] = useState("");
  const [paidReach, setPaidReach] = useState("");
  const [comments, setComments] = useState("");
  const [shares, setShares] = useState("");
  const [followers, setFollowers] = useState("");
  const [visits, setVisits] = useState("");

  function optionalNumber(value: string): number | null {
    if (value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      <p className="text-sm font-medium">Record performance</p>
      <p className="text-xs text-muted-foreground">Organic and paid reach are separate. Leave a box empty if you do not have the number.</p>
      <select className="h-10 w-full rounded-lg border border-input px-2 text-sm" value={checkpoint} onChange={(event) => setCheckpoint(event.target.value as MetricEntry["checkpoint"])}>
        <option value="24h">24 hours</option>
        <option value="72h">72 hours</option>
        <option value="7d">7 days</option>
      </select>
      <NumberField label="Organic reach" value={organicReach} onChange={setOrganicReach} />
      <NumberField label="Paid reach" value={paidReach} onChange={setPaidReach} />
      <NumberField label="Comments" value={comments} onChange={setComments} />
      <NumberField label="Shares" value={shares} onChange={setShares} />
      <NumberField label="New followers" value={followers} onChange={setFollowers} />
      <NumberField label="Website visits" value={visits} onChange={setVisits} />
      <button
        type="button"
        className="h-10 w-full rounded-lg bg-muted text-sm"
        onClick={() => {
          const entry: MetricEntry = {
            checkpoint,
            organicReach: optionalNumber(organicReach),
            paidReach: optionalNumber(paidReach),
            comments: optionalNumber(comments),
            shares: optionalNumber(shares),
            reactions: null,
            newFollowers: optionalNumber(followers),
            reelViews: null,
            watchTimeSeconds: null,
            websiteVisits: optionalNumber(visits),
            affiliateClicks: null,
          };
          void preview.saveMetrics(contentId, entry).then((ok) => onNotice(ok ? "Performance saved. Commission is not on this screen." : "Enter a reach number you can see. This stays empty until the Facebook URL is recorded."));
        }}
      >
        Save checkpoint
      </button>
    </div>
  );
}

function PublishDesk({
  pageName,
  accent,
  contentId,
  formatLabelText,
  hook,
  publishPhrase,
  caption,
  status,
  flagged,
  facebookUrl,
  onFlag,
  onPublish,
  onNotice,
  notice,
}: {
  pageName: string;
  accent: string;
  contentId: string;
  formatLabelText: string;
  hook: string;
  publishPhrase: string;
  caption: string;
  status: string;
  flagged: string | null;
  facebookUrl: string;
  onFlag: (note: string) => void;
  onPublish: (url: string) => void;
  onNotice: (message: string) => void;
  notice: string | null;
}) {
  const [note, setNote] = useState("");
  const [url, setUrl] = useState(facebookUrl);
  return (
    <div className="space-y-8">
      <Link href="/staff" className="text-sm text-muted-foreground hover:text-foreground">Back</Link>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <AssetFrame label={formatLabelText} accent={accent} />
        <div>
          <p className="text-[11px] tracking-[0.16em] uppercase" style={{ color: accent }}>{pageName}</p>
          <h1 className="mt-2 font-heading text-4xl tracking-tight">{hook}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{contentId} · {status} · {publishPhrase}</p>
          <ul className="mt-8 divide-y border-y text-sm">
            <li className="flex items-center justify-between gap-4 py-3">
              <span>Download asset</span>
              <button type="button" disabled className="h-10 px-3 text-muted-foreground">Unavailable</button>
            </li>
            <li className="flex items-center justify-between gap-4 py-3">
              <span>Copy final caption</span>
              <button type="button" disabled className="h-10 px-3 text-muted-foreground">No finished caption</button>
            </li>
            <li className="flex items-center justify-between gap-4 py-3">
              <span>Download thumbnail</span>
              <button type="button" disabled className="h-10 px-3 text-muted-foreground">Unavailable</button>
            </li>
            <li className="flex items-center justify-between gap-4 py-3">
              <span>Open Meta Business Suite</span>
              <a href="https://business.facebook.com/" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center px-3 text-primary">Open</a>
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{caption}</p>
          <p className="mt-1 text-xs text-muted-foreground">Plan instruction. Not a finished caption. Schedule the real file yourself. This screen does not post to Facebook.</p>
          <label className="mt-6 block text-sm">
            Facebook post URL
            <input className="mt-1 h-11 w-full border border-border bg-card px-3" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.facebook.com/..." />
          </label>
          <button type="button" className="mt-3 h-11 bg-primary px-4 text-sm font-medium text-primary-foreground" onClick={() => onPublish(url)}>
            Confirm publication
          </button>
          <div className="mt-8">
            <h2 className="font-heading text-2xl">Report an issue</h2>
            <p className="mt-2 text-sm text-muted-foreground">Ask for regeneration. That does not start an AI job.</p>
            {flagged ? <p className="mt-3 text-sm">Flagged: {flagged}</p> : null}
            <textarea className="mt-3 min-h-24 w-full border border-border bg-card p-3 text-sm" value={note} onChange={(event) => setNote(event.target.value)} placeholder="What should be regenerated?" />
            <button type="button" className="mt-3 h-11 bg-muted px-4 text-sm" onClick={() => onFlag(note)}>
              Request regeneration
            </button>
            {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
          </div>
          <div className="mt-8 border-t pt-6">
            <h2 className="font-heading text-2xl">Performance</h2>
            <p className="mt-2 text-sm text-muted-foreground">Record Page numbers you can see. Affiliate commission is not on this screen.</p>
            <MetricsForm contentId={contentId} onNotice={onNotice} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <input className="mt-1 h-9 w-full rounded-lg border border-input px-2 text-sm text-foreground" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
