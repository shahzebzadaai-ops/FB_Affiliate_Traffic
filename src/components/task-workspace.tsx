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
import { statusLabel, usePreview } from "@/preview/preview-context";
import { formatLabel } from "@/components/format-label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export function TaskWorkspace({ contentId }: { contentId: string }) {
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
  const back = "/owner";

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
        This brief is for the AI production pipeline and your approval. Publishing operators do not write the prompt, script or video. No model is connected, so nothing here is a finished asset.
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
                    disabled
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
                    disabled
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
      <p className="mt-1 text-sm text-muted-foreground">Current status: {status}. Nobody can approve their own work.</p>
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
