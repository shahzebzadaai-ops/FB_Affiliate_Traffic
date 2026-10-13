"use client";

import Link from "next/link";

export function GrowthDirector() {
  return (
    <div className="space-y-10">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Weekly review</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Growth Director</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          This desk will read real Facebook and affiliate results, then ask you before a new angle, persona, Page or spend. It has no evidence yet, so it recommends nothing.
        </p>
      </header>
      <dl className="divide-y border-y text-sm">
        <Row term="Evidence" detail="No Meta export and no affiliate postback." />
        <Row term="This week" detail="No recommendation." />
        <Row term="New Pages or GEOs" detail="None proposed. A new Page needs your approval." />
        <Row term="Spend" detail="No AI spend is authorised from this screen." />
        <Row term="Creative handoff" detail="Approved work returns to the seven-day pipeline. Masho does not write it." />
      </dl>
      <p className="text-sm">
        <Link href="/owner/approvals" className="text-primary">Open approvals</Link>
        <span className="text-muted-foreground"> when a real proposal exists.</span>
      </p>
    </div>
  );
}

function Row({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
      <dt className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{term}</dt>
      <dd className="leading-relaxed">{detail}</dd>
    </div>
  );
}
