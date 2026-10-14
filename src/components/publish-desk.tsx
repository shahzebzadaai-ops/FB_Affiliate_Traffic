"use client";

import { useState } from "react";
import Link from "next/link";
import { pageByCode } from "@/domain/pages";
import { useCampaign } from "@/campaign/campaign-context";
import { placedPhrase } from "@/domain/campaign";
import { statusLabel, usePreview } from "@/preview/preview-context";
import { type MetricEntry } from "@/preview/task-state";
import { AssetFrame } from "@/components/asset-frame";
import { formatLabel } from "@/components/format-label";

export function PublishDesk({ contentId }: { contentId: string }) {
  const preview = usePreview();
  const campaign = useCampaign();
  const [notice, setNotice] = useState<string | null>(null);
  const record = preview.records.find((item) => item.contentId === contentId);

  if (!preview.ready) return <p className="text-sm text-muted-foreground">Loading this task.</p>;
  if (!record || !preview.canAccess(contentId)) return <p>This task is not assigned to you.</p>;

  const page = pageByCode(record.pageCode);
  const state = preview.stateFor(record.contentId);
  const hook = preview.effectiveHook(record);
  const publishPhrase = placedPhrase(record.publishAt, state.publishAtOverride, campaign.record);

  return (
    <Desk
      pageName={page.name}
      accent={page.accent}
      contentId={record.contentId}
      formatLabelText={formatLabel(record.format)}
      hook={hook}
      publishPhrase={publishPhrase}
      caption={record.captionInstructions}
      status={statusLabel(state.status)}
      flagged={state.regenerationRequest?.note ?? state.publicationIssue?.note ?? null}
      facebookUrl={state.facebookUrl}
      onFlag={(note) => {
        void preview.flagRegeneration(record.contentId, note).then((ok) => {
          setNotice(ok ? "Flagged for regeneration. No AI job was started." : "Describe the problem in at least 8 characters.");
        });
      }}
      onSchedule={() => {
        void preview.confirmScheduled(record.contentId).then((ok) => {
          setNotice(ok ? "Scheduling was recorded. This app did not post to Facebook, and there is no public link yet." : "Scheduling can be confirmed only after the asset is approved and a real file is stored.");
        });
      }}
      onPublish={(url) => {
        void preview.publish(record.contentId, url).then((ok) => {
          setNotice(ok ? "The Facebook URL was saved. This app did not post it." : "Confirm scheduling first, then paste the public Facebook URL.");
        });
      }}
      onIssue={(note) => {
        void preview.reportIssue(record.contentId, note).then((ok) => {
          setNotice(ok ? "The publishing problem was saved." : "Describe the publishing problem in at least 8 characters.");
        });
      }}
      onNotice={setNotice}
      notice={notice}
    />
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
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs text-muted-foreground">
        Checkpoint
        <select className="mt-1 h-9 w-full border border-border bg-card px-2 text-sm text-foreground" value={checkpoint} onChange={(event) => setCheckpoint(event.target.value as MetricEntry["checkpoint"])}>
          <option value="24h">24 hours</option>
          <option value="72h">72 hours</option>
          <option value="7d">7 days</option>
        </select>
      </label>
      <NumberField label="Organic reach" value={organicReach} onChange={setOrganicReach} />
      <NumberField label="Paid reach" value={paidReach} onChange={setPaidReach} />
      <NumberField label="Comments" value={comments} onChange={setComments} />
      <NumberField label="Shares" value={shares} onChange={setShares} />
      <NumberField label="New followers" value={followers} onChange={setFollowers} />
      <NumberField label="Website visits" value={visits} onChange={setVisits} />
      <button
        type="button"
        className="h-11 bg-muted px-4 text-sm sm:col-span-2"
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

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <input className="mt-1 h-9 w-full border border-border bg-card px-2 text-sm text-foreground" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function optionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}


function Desk({
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
  onSchedule,
  onPublish,
  onIssue,
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
  onSchedule: () => void;
  onPublish: (url: string) => void;
  onIssue: (note: string) => void;
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
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" className="h-11 bg-primary px-4 text-sm font-medium text-primary-foreground" onClick={onSchedule}>
              Confirm scheduled
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Use this after you schedule it in Meta Business Suite. A public link is not required yet.</p>
          {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
          <label className="mt-6 block text-sm">
            Facebook post URL
            <input className="mt-1 h-11 w-full border border-border bg-card px-3" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.facebook.com/..." />
          </label>
          <button type="button" className="mt-3 h-11 bg-primary px-4 text-sm font-medium text-primary-foreground" onClick={() => onPublish(url)}>
            Confirm published
          </button>
          <div className="mt-8">
            <h2 className="font-heading text-2xl">Report an issue</h2>
            <p className="mt-2 text-sm text-muted-foreground">Say what blocked publishing. Asking for a new file does not start an AI job.</p>
            {flagged ? <p className="mt-3 text-sm">Flagged: {flagged}</p> : null}
            <textarea className="mt-3 min-h-24 w-full border border-border bg-card p-3 text-sm" value={note} onChange={(event) => setNote(event.target.value)} placeholder="What blocked publishing?" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="h-11 bg-muted px-4 text-sm" onClick={() => onIssue(note)}>
                Report problem
              </button>
              <button type="button" className="h-11 bg-muted px-4 text-sm" onClick={() => onFlag(note)}>
                Request regeneration
              </button>
            </div>
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
