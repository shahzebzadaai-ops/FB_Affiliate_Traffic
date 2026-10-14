"use client";

import Link from "next/link";
import { PAGE_IDENTITIES, pageByCode, pageInk } from "@/domain/pages";
import type { PageCode } from "@/domain/types";
import { usePreview } from "@/preview/preview-context";

export function PageList({ mode }: { mode: "staff" | "owner" }) {
  const preview = usePreview();
  const pages = PAGE_IDENTITIES.filter((page) => mode === "owner" || preview.assignedPageCodes.includes(page.code));
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-5xl tracking-tight">{mode === "staff" ? "My Pages" : "Pages"}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Separate audiences, tones and visual systems. Do not publish the same creative on more than one Page.</p>
      </header>
      {pages.length === 0 ? <p className="border-y py-8 text-sm text-muted-foreground">No Facebook Pages are assigned to you.</p> : null}
      <div className="grid gap-4">
        {pages.map((page) => (
          <Link key={page.code} href={`/${mode}/pages/${page.code}`} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="text-xs font-medium tracking-wide uppercase" style={{ color: pageInk(page.accent) }}>{page.ageRange}</p>
            <h2 className="mt-1 font-heading text-3xl">{page.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed">{page.bio}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BrandBible({ code, mode }: { code: string; mode: "staff" | "owner" }) {
  const preview = usePreview();
  const page = PAGE_IDENTITIES.find((item) => item.code === code);
  if (!page) return <p>That Page is not in the catalogue.</p>;
  if (mode === "staff" && preview.ready && !preview.assignedPageCodes.includes(page.code)) {
    return <p>This Page is not assigned to you.</p>;
  }
  const identity = pageByCode(page.code as PageCode);
  const posts = preview.records.filter((record) => record.pageCode === identity.code);

  return (
    <article className="space-y-6">
      <Link href={`/${mode}/pages`} className="text-sm text-muted-foreground">All Pages</Link>
      <header className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
        <p className="text-xs font-medium tracking-[0.14em] uppercase" style={{ color: pageInk(identity.accent) }}>{identity.code} · {identity.ageRange}</p>
        <h1 className="mt-2 font-heading text-5xl">{identity.name}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed">{identity.bio}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Info title="Persona" body={identity.persona} />
        <Info title="Tone" body={identity.tone} />
        <Info title="Visual direction" body={identity.visual} />
        <Info title="Commercial hypothesis" body={identity.commercialHypothesis} />
      </div>
      <Info title="Content pillars" body={identity.pillars.join(" · ")} />
      <Info title="Hook guidelines" body={identity.hookGuidelines.join(" ")} />
      <Info title="Creative templates" body={identity.templates.join(" · ")} />
      <Info title="Recurring formats" body={identity.recurringFormats} />
      <p className="text-sm text-muted-foreground">{posts.length} month-one posts use this brand bible. {posts.filter((post) => post.priority).length} are marked priority in the source plan.</p>
    </article>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="text-sm font-medium text-primary">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed">{body}</p>
    </section>
  );
}
