"use client";

import { useEffect, useState } from "react";

type Action = {
  id: string;
  title: string;
  status: string;
  ownerLabel: string;
  successCriterion: string;
  latestMeasurement: string | null;
  blocker: string | null;
  evidence: string[];
};

type Pillar = { id: string; title: string; position: number; actions: Action[] };

type Payload = {
  goal: { title: string; notes: string; measuredApprovedRevenue: null } | null;
  pillars: Pillar[];
};

export function MandalaBoard() {
  const [data, setData] = useState<Payload | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/mandala", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) {
        setError("The Mandala could not be loaded.");
        return;
      }
      setData((await response.json()) as Payload);
    });
  }, []);

  if (error) return <p>{error}</p>;
  if (!data?.goal) return <p className="font-heading text-3xl">Loading the Mandala</p>;
  const pillar = data.pillars.find((item) => item.id === selected) ?? null;
  const verified = data.pillars.flatMap((item) => item.actions).filter((action) => action.status === "COMPLETED" && action.evidence.length > 0).length;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium tracking-[0.14em] text-primary uppercase">Mandala strategy</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Central goal</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{data.goal.title}. Approved revenue is not connected, so this is not a progress percentage.</p>
      </header>
      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">Measured approved revenue</p>
        <p className="font-heading text-4xl">Awaiting first data</p>
        <p className="mt-2 text-sm text-muted-foreground">{verified} actions have both a completed status and evidence. The other actions stay not started.</p>
      </section>
      {pillar ? (
        <section className="space-y-4">
          <button type="button" className="text-sm text-primary" onClick={() => setSelected(null)}>
            Back to the eight pillars
          </button>
          <h2 className="font-heading text-4xl">{pillar.title}</h2>
          <ol className="grid gap-3 md:grid-cols-2">
            {pillar.actions.map((action) => (
              <li key={action.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <p className="text-xs font-medium tracking-wide text-primary uppercase">{action.status.replaceAll("_", " ")}</p>
                <h3 className="mt-1 font-heading text-2xl">{action.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{action.successCriterion}</p>
                <p className="mt-3 text-sm">Owner: {action.ownerLabel}</p>
                <p className="text-sm text-muted-foreground">Measurement: {action.latestMeasurement ?? "Missing measurement"}</p>
                <p className="text-sm text-muted-foreground">Blocker: {action.blocker ?? "None recorded"}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ring(data.pillars).map((cell) =>
            cell.kind === "goal" ? (
              <div key="goal" className="rounded-2xl bg-primary p-4 text-primary-foreground sm:min-h-36">
                <p className="text-xs tracking-wide uppercase">Centre</p>
                <p className="mt-2 font-heading text-2xl leading-tight">$25,000 approved revenue / month</p>
              </div>
            ) : (
              <button key={cell.pillar.id} type="button" onClick={() => setSelected(cell.pillar.id)} className="rounded-2xl bg-card p-4 text-left ring-1 ring-foreground/10 sm:min-h-36">
                <p className="text-xs text-muted-foreground">Pillar {cell.pillar.position}</p>
                <p className="mt-2 font-heading text-2xl leading-tight">{cell.pillar.title}</p>
                <p className="mt-3 text-sm text-muted-foreground">{cell.pillar.actions.filter((action) => action.status === "NOT_STARTED").length} not started</p>
              </button>
            ),
          )}
        </div>
      )}
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{data.goal.notes}</p>
    </div>
  );
}

function ring(pillars: Pillar[]) {
  const ordered = [...pillars].sort((a, b) => a.position - b.position);
  const cells: Array<{ kind: "pillar"; pillar: Pillar } | { kind: "goal" }> = ordered.slice(0, 4).map((pillar) => ({ kind: "pillar", pillar }));
  cells.push({ kind: "goal" });
  cells.push(...ordered.slice(4).map((pillar) => ({ kind: "pillar" as const, pillar })));
  return cells;
}
