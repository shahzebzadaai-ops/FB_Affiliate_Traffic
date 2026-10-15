"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SourceDraft = { url: string; sourceDate: string; theme: string; evidence: string; notes: string };

type Summary = { contentId: string; status: string; publishing: string; theme: string; title: string | null; createdAt: string };

type Score = { score: string; reason: string };

type Candidate = {
  id: string;
  title: string;
  audience: string;
  insight: string;
  relevance: Score;
  evidenceStrength: Score & { sourceIndexes: number[] };
  emotionalOrPractical: Score;
  reelPotential: Score;
  discussionMotivation: Score;
  pageAlignment: Score;
  repetition: Score;
  uncertainty: string;
  rank: number;
};

type Handoff = {
  title: string;
  hook: string;
  script: string;
  caption: string;
  engagementQuestion: string;
  durationSeconds: number;
  aspectRatio: string;
  assembly: string;
  checklist: string[];
  scenes: Array<{ number: number; timestamp: string; durationSeconds: number; prompt: string; voiceover: string }>;
  referenceImages: Array<{ id: string; purpose: string; prompt: string; status: string }>;
  negativePrompt: string;
  notice: string;
  publishing: string;
};

type PackageDetail = {
  content_id: string;
  status: string;
  publishing: string;
  evidence: Array<{ url: string; sourceDate: string | null; theme: string; evidence: string; notes: string }>;
  evaluation: {
    confirmed: Array<{ sourceIndex: number; statement: string }>;
    interpretation: string[];
    notEstablished: string[];
    candidates: Candidate[];
  } | null;
  approved_candidate_id: string | null;
  muse_package: Handoff | null;
  markdown: string | null;
  model: string | null;
};

const emptySource = (): SourceDraft => ({ url: "", sourceDate: "", theme: "", evidence: "", notes: "" });

export function ResearchDesk({ contentId }: { contentId?: string }) {
  const router = useRouter();
  const [sources, setSources] = useState<SourceDraft[]>([emptySource()]);
  const [packages, setPackages] = useState<Summary[]>([]);
  const [detail, setDetail] = useState<PackageDetail | null>(null);
  const [engine, setEngine] = useState("");
  const [researchNote, setResearchNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [choice, setChoice] = useState("");

  async function loadList() {
    const response = await fetch("/api/research");
    const body = (await response.json()) as { error?: string; packages?: Summary[]; controls?: { intelligence: string }; research?: { message: string } };
    if (!response.ok) {
      setError(body.error ?? "The research desk could not be loaded.");
      return;
    }
    setPackages(body.packages ?? []);
    setEngine(body.controls?.intelligence ?? "");
    setResearchNote(body.research?.message ?? "");
  }

  async function loadDetail(id: string) {
    const response = await fetch(`/api/research/${id}`);
    const body = (await response.json()) as { error?: string; package?: PackageDetail };
    if (!response.ok || !body.package) {
      setError(body.error ?? "That package could not be opened.");
      return;
    }
    setDetail(body.package);
    setChoice(body.package.approved_candidate_id ?? body.package.evaluation?.candidates.slice().sort((a, b) => a.rank - b.rank)[0]?.id ?? "");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadList();
      if (contentId) void loadDetail(contentId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [contentId]);

  async function saveSources() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "create",
        sources: sources.map((source) => ({ ...source, sourceDate: source.sourceDate || null })),
      }),
    });
    const body = (await response.json()) as { error?: string; contentId?: string };
    setBusy(false);
    if (!response.ok || !body.contentId) {
      setError(body.error ?? "The research was not saved.");
      return;
    }
    router.push(`/owner/research/${body.contentId}`);
  }

  async function run(action: "evaluate" | "approve" | "generate") {
    if (!contentId) return;
    setBusy(true);
    setError("");
    setNotice("");
    const response = action === "evaluate"
      ? await fetch("/api/research", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, contentId }),
        })
      : await fetch(`/api/research/${contentId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(action === "approve" ? { action, candidateId: choice } : { action }),
        });
    const body = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error ?? "That step did not finish.");
      return;
    }
    setNotice(action === "generate" ? "The Muse instructions are ready to copy." : "Saved.");
    await loadDetail(contentId);
    await loadList();
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setNotice("Copied.");
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Back in the Game UK</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Research to Muse</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Paste sources you have actually read. The model ranks topic ideas from those notes only. You approve one. Then copy the Muse instructions. Publishing stays off, and this does not start the 30-day clock.
        </p>
      </header>
      {error ? <p className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">{error}</p> : null}
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
      {contentId && detail ? <PackageView detail={detail} choice={choice} busy={busy} engine={engine} onChoice={setChoice} onRun={run} onCopy={copyText} /> : <SourceForm sources={sources} busy={busy} researchNote={researchNote} onChange={setSources} onSave={saveSources} />}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Saved packages</h2>
        {packages.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : null}
        <ul className="space-y-2">
          {packages.map((item) => (
            <li key={item.contentId}>
              <Link href={`/owner/research/${item.contentId}`} className="atos-surface flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <span className="font-medium">{item.contentId}</span>
                <span className="text-sm text-muted-foreground">{item.title || item.theme || "Research saved"}</span>
                <span className="text-sm">{item.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SourceForm({
  sources,
  busy,
  researchNote,
  onChange,
  onSave,
}: {
  sources: SourceDraft[];
  busy: boolean;
  researchNote: string;
  onChange: (sources: SourceDraft[]) => void;
  onSave: () => void;
}) {
  function patch(index: number, field: keyof SourceDraft, value: string) {
    onChange(sources.map((source, item) => (item === index ? { ...source, [field]: value } : source)));
  }
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">1. Save what you read</h2>
      <p className="max-w-2xl text-sm text-muted-foreground">{researchNote} Live search is not connected. Write only what the page said, and the date if the page shows one.</p>
      {sources.map((source, index) => (
        <div key={index} className="atos-surface space-y-3 px-5 py-5">
          <p className="text-sm font-medium">Source {index + 1}</p>
          <label className="block text-sm">Page URL
            <input className="atos-field mt-1" value={source.url} onChange={(event) => patch(index, "url", event.target.value)} placeholder="https://" />
          </label>
          <label className="block text-sm">Date on the page
            <input className="atos-field mt-1" type="date" value={source.sourceDate} onChange={(event) => patch(index, "sourceDate", event.target.value)} />
          </label>
          <label className="block text-sm">Theme you observed
            <input className="atos-field mt-1" value={source.theme} onChange={(event) => patch(index, "theme", event.target.value)} />
          </label>
          <label className="block text-sm">What the page said
            <textarea className="atos-field mt-1 min-h-28 py-3" value={source.evidence} onChange={(event) => patch(index, "evidence", event.target.value)} />
          </label>
          <label className="block text-sm">Your notes, optional
            <textarea className="atos-field mt-1 min-h-16 py-3" value={source.notes} onChange={(event) => patch(index, "notes", event.target.value)} />
          </label>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="atos-btn-quiet" disabled={sources.length >= 4} onClick={() => onChange([...sources, emptySource()])}>Add another source</button>
        <button type="button" className="atos-btn" disabled={busy} onClick={onSave}>Save research</button>
      </div>
    </section>
  );
}

function PackageView({
  detail,
  choice,
  busy,
  engine,
  onChoice,
  onRun,
  onCopy,
}: {
  detail: PackageDetail;
  choice: string;
  busy: boolean;
  engine: string;
  onChoice: (id: string) => void;
  onRun: (action: "evaluate" | "approve" | "generate") => void;
  onCopy: (value: string) => void;
}) {
  const candidates = detail.evaluation?.candidates.slice().sort((a, b) => a.rank - b.rank) ?? [];
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{detail.content_id} · {detail.status} · Publishing {detail.publishing} · Intelligence engine {engine || "unknown"}</p>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Saved evidence</h2>
        {detail.evidence.map((source, index) => (
          <article key={source.url} className="atos-surface px-5 py-4 text-sm">
            <p className="font-medium">Source {index + 1}. {source.theme}</p>
            <p className="mt-1 text-muted-foreground">{source.sourceDate ?? "Date not recorded"} · {source.url}</p>
            <p className="mt-3 leading-relaxed">{source.evidence}</p>
            {source.notes ? <p className="mt-2 text-muted-foreground">Note: {source.notes}</p> : null}
          </article>
        ))}
      </section>
      {detail.status === "EVIDENCE" || detail.status === "CANDIDATES" ? (
        <button type="button" className="atos-btn" disabled={busy} onClick={() => onRun("evaluate")}>Suggest topics from these sources</button>
      ) : null}
      {detail.evaluation ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">2. Choose one topic</h2>
          <Split title="Confirmed from the sources" items={detail.evaluation.confirmed.map((item) => `Source ${item.sourceIndex + 1}: ${item.statement}`)} />
          <Split title="Interpretation, not source evidence" items={detail.evaluation.interpretation} />
          <Split title="Not established" items={detail.evaluation.notEstablished} />
          {candidates.map((candidate) => (
            <label key={candidate.id} className="atos-surface block px-5 py-5">
              <span className="flex flex-wrap items-center gap-3">
                {detail.status === "CANDIDATES" ? <input type="radio" name="topic" checked={choice === candidate.id} onChange={() => onChoice(candidate.id)} /> : null}
                <span className="text-lg font-semibold">Rank {candidate.rank}. {candidate.title}</span>
                {detail.approved_candidate_id === candidate.id ? <span className="text-sm text-primary">Approved</span> : null}
              </span>
              <p className="mt-3 text-sm leading-relaxed">{candidate.insight}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>UK adults 30+: {candidate.relevance.score}. {candidate.relevance.reason}</li>
                <li>Evidence: {candidate.evidenceStrength.score}. {candidate.evidenceStrength.reason}</li>
                <li>Interest: {candidate.emotionalOrPractical.score}. {candidate.emotionalOrPractical.reason}</li>
                <li>Reel: {candidate.reelPotential.score}. {candidate.reelPotential.reason}</li>
                <li>Discussion: {candidate.discussionMotivation.score}. {candidate.discussionMotivation.reason}</li>
                <li>Page fit: {candidate.pageAlignment.score}. {candidate.pageAlignment.reason}</li>
                <li>Repetition: {candidate.repetition.score}. {candidate.repetition.reason}</li>
                <li>Uncertainty: {candidate.uncertainty}</li>
              </ul>
            </label>
          ))}
          {detail.status === "CANDIDATES" ? (
            <button type="button" className="atos-btn" disabled={busy || !choice} onClick={() => onRun("approve")}>Approve selected topic</button>
          ) : null}
        </section>
      ) : null}
      {detail.status === "APPROVED" ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">3. Write the Muse instructions</h2>
          <p className="text-sm text-muted-foreground">This uses the intelligence engine. It does not call Muse and it does not publish.</p>
          <button type="button" className="atos-btn" disabled={busy} onClick={() => onRun("generate")}>Write Muse instructions</button>
        </section>
      ) : null}
      {detail.muse_package && detail.markdown ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">4. Copy the instructions</h2>
          <p className="text-sm text-muted-foreground">{detail.muse_package.notice} Model recorded: {detail.model ?? "not stored"}.</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {detail.muse_package.checklist.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <button type="button" className="atos-btn" onClick={() => onCopy(detail.markdown ?? "")}>Copy all instructions</button>
          <article className="atos-surface px-5 py-4 text-sm leading-relaxed">
            <p className="font-medium">{detail.muse_package.title}</p>
            <p className="mt-2">{detail.muse_package.hook}</p>
            <p className="mt-3">{detail.muse_package.script}</p>
            <p className="mt-3 text-muted-foreground">{detail.muse_package.durationSeconds} seconds · {detail.muse_package.aspectRatio} · Publishing {detail.muse_package.publishing}</p>
          </article>
          {detail.muse_package.scenes.map((scene) => (
            <article key={scene.number} className="atos-surface px-5 py-4">
              <p className="text-sm font-medium">Scene {scene.number} · {scene.timestamp} · {scene.durationSeconds}s</p>
              <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{scene.prompt}</pre>
              <button type="button" className="atos-btn-quiet mt-3" onClick={() => onCopy(scene.prompt)}>Copy this scene</button>
            </article>
          ))}
          {detail.muse_package.referenceImages.map((image) => (
            <article key={image.id} className="atos-surface px-5 py-4 text-sm">
              <p className="font-medium">{image.id} · {image.status}</p>
              <p className="mt-2">{image.purpose}</p>
              <pre className="mt-3 whitespace-pre-wrap leading-relaxed">{image.prompt}</pre>
            </article>
          ))}
          <p className="text-sm leading-relaxed text-muted-foreground">{detail.muse_package.assembly}</p>
        </section>
      ) : null}
    </div>
  );
}

function Split({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
