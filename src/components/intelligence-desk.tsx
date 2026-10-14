"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Overview = {
  language: { active: string | null; provider: string | null; configured: boolean; model: string | null; fallbackModel: string | null; missing: string[] };
  freellmapi: { configured: boolean; missing: string[]; model: string | null; fallbackModel: string | null };
  novita: { configured: boolean; missing: string[]; model: string | null };
  research: { available: boolean; message: string };
  storage: { permanent: { message: string }; staging: { message: string } };
  editing: { message: string; videoEditingControl: string };
  controls: { intelligence: string; creative: string; video_editing: string; publishing: string };
  campaign: { status: string; notStarted: boolean };
  brands: Array<{ code: string; name: string; note: string }>;
  opportunities: unknown[];
  opportunityNote: string;
  launch: { state: string; recommendation: string; reason: string };
  monetisation: { state: string; recommendation: string; evidence: string[]; revenue: null; conversions: null };
  partnerReport: {
    publishedVideos: number;
    activeSeries: number;
    distinction: string;
    candidateBrands: string[];
    approvedFacebookBrands: string[];
    audienceGrowth: null;
    reach: null;
    engagement: null;
    watchTime: null;
    websiteTraffic: null;
  };
};

type Analysis = {
  observations: string[];
  assumptions: string[];
  storyImplications: string[];
  evidenceNote: string;
};

export function IntelligenceDesk() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/intelligence");
    const body = (await response.json()) as Overview & { error?: string };
    if (!response.ok) {
      setError(body.error ?? "The intelligence desk could not be loaded.");
      return;
    }
    setError("");
    setOverview(body);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function setControl(id: "intelligence" | "creative" | "video_editing", state: "STARTED" | "PAUSED") {
    const response = await fetch("/api/intelligence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "control", id, state }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "The control was not changed.");
      return;
    }
    await load();
  }

  async function analyse() {
    setBusy(true);
    const response = await fetch("/api/intelligence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "analyse", evidence }),
    });
    const body = (await response.json()) as { error?: string; analysis?: Analysis };
    setBusy(false);
    if (!response.ok || !body.analysis) {
      setError(body.error ?? "The supplied evidence was not analysed.");
      return;
    }
    setError("");
    setAnalysis(body.analysis);
    await load();
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Audience and trend intelligence</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Intelligence</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The language model reasons over text that is supplied to it. A separate search adapter is required for live web research. Neither one is allowed to invent reach, watch time, or revenue.
        </p>
      </header>
      {error ? <p className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">{error}</p> : null}
      <section className="grid gap-4 md:grid-cols-2">
        <Card
          title="FreeLLMAPI"
          detail={
            overview?.language.provider === "freellmapi"
              ? overview.freellmapi.configured
                ? `Selected route. Private loopback router. Model ${overview.freellmapi.model}. Fallback ${overview.freellmapi.fallbackModel ?? "not set"}.`
                : `Selected route. Missing ${overview.freellmapi.missing.join(", ")}.`
              : "Not the selected route."
          }
        />
        <Card
          title="Novita"
          detail={
            overview?.language.provider === "novita"
              ? overview.novita.configured
                ? `Selected route. Model ${overview.novita.model}.`
                : `Selected route. Missing ${overview.novita.missing.join(", ")}.`
              : "Optional future provider. A missing FreeLLMAPI key does not call Novita."
          }
        />
        <Card title="Live research" detail={overview?.research.message ?? "Loading."} />
        <Card title="Permanent storage" detail={overview?.storage.permanent.message ?? "Loading."} />
        <Card title="Editing" detail={overview?.editing.message ?? "Loading."} />
      </section>
      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-3xl">Engines</h2>
        <p className="mt-2 text-sm text-muted-foreground">Publishing stays off. Starting research or scripting does not post to Facebook.</p>
        <div className="mt-4 grid gap-3">
          <Control label="AI intelligence" state={overview?.controls.intelligence ?? "PAUSED"} onChange={(state) => setControl("intelligence", state)} />
          <Control label="Creative production" state={overview?.controls.creative ?? "PAUSED"} onChange={(state) => setControl("creative", state)} />
          <Control label="Video editing worker" state={overview?.controls.video_editing ?? "PAUSED"} onChange={(state) => setControl("video_editing", state)} />
          <p className="text-sm">Publishing: OFF. Campaign {overview?.campaign.status ?? "BUILD"}{overview?.campaign.notStarted ? ", not started" : ""}.</p>
        </div>
      </section>
      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-3xl">Supplied evidence</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Paste notes or a brief. The model only sees this text. It does not search the web, and the saved record says so.
        </p>
        <textarea
          className="mt-4 min-h-32 w-full rounded-xl bg-background p-3 text-sm ring-1 ring-foreground/10"
          value={evidence}
          onChange={(event) => setEvidence(event.target.value)}
          placeholder="Paste the evidence to analyse."
        />
        <button
          type="button"
          className="atos-btn mt-3"
          disabled={busy || overview?.controls.intelligence !== "STARTED" || !overview?.language.configured}
          onClick={() => void analyse()}
        >
          {busy ? "Reading the supplied text" : "Analyse supplied evidence"}
        </button>
        {analysis ? (
          <div className="mt-4 space-y-3 text-sm">
            <p>{analysis.evidenceNote}</p>
            <p className="font-medium">Observations</p>
            <ul className="list-disc pl-5 text-muted-foreground">{analysis.observations.map((item) => <li key={item}>{item}</li>)}</ul>
            <p className="font-medium">Assumptions</p>
            <ul className="list-disc pl-5 text-muted-foreground">{analysis.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
            <p className="font-medium">Story implications</p>
            <ul className="list-disc pl-5 text-muted-foreground">{analysis.storyImplications.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ) : null}
      </section>
      <section>
        <h2 className="font-heading text-3xl">Opportunities</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{overview?.opportunityNote}</p>
        <p className="mt-2 text-sm">Ranked rows: {overview?.opportunities.length ?? 0}.</p>
      </section>
      <section>
        <h2 className="font-heading text-3xl">Series launch advisor</h2>
        <p className="mt-2 text-sm">{overview?.launch.state.replaceAll("_", " ")} — {overview?.launch.recommendation}</p>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{overview?.launch.reason}</p>
      </section>
      <section>
        <h2 className="font-heading text-3xl">Monetisation readiness</h2>
        <p className="mt-2 text-sm">{overview?.monetisation.recommendation}</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
          {(overview?.monetisation.evidence ?? []).map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="mt-2 text-sm">Revenue: not measured. Conversions: not measured.</p>
      </section>
      <section>
        <h2 className="font-heading text-3xl">Brand candidates</h2>
        <ul className="mt-3 divide-y border-y text-sm">
          {(overview?.brands ?? []).map((brand) => (
            <li key={brand.code} className="py-3">
              <p className="font-medium">{brand.name}</p>
              <p className="text-muted-foreground">{brand.note}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-heading text-3xl">Partner progress</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{overview?.partnerReport.distinction}</p>
        <p className="mt-2 text-sm">Published videos recorded here: {overview?.partnerReport.publishedVideos ?? 0}. Series stored: {overview?.partnerReport.activeSeries ?? 0}.</p>
        <button
          type="button"
          className="atos-btn-quiet mt-3"
          disabled={!overview}
          onClick={() => {
            if (!overview) return;
            const blob = new Blob([JSON.stringify(overview.partnerReport, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "affigrove-partner-progress.json";
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download partner report
        </button>
      </section>
      <p><Link className="atos-btn" href="/owner/stories">Open Story Series Studio</Link></p>
    </div>
  );
}

function Card({ title, detail }: { title: string; detail: string }) {
  return (
    <article className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
    </article>
  );
}

function Control({ label, state, onChange }: { label: string; state: string; onChange: (state: "STARTED" | "PAUSED") => void }) {
  const started = state === "STARTED";
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <p>{label}: {started ? "Started" : "Paused"}</p>
      <button type="button" className="atos-btn-quiet" onClick={() => onChange(started ? "PAUSED" : "STARTED")}>
        {started ? "Pause" : "Start"}
      </button>
    </div>
  );
}
