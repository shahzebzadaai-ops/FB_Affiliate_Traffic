"use client";

import Link from "next/link";
import { pageByCode, pageInk } from "@/domain/pages";
import type { ContentRecord } from "@/domain/types";
import { AssetFrame } from "@/components/asset-frame";
import { formatLabel } from "@/components/format-label";

export function PublishCard({
  record,
  href,
  publishPhrase,
  hook,
  status,
  ready,
  action,
}: {
  record: ContentRecord;
  href: string;
  publishPhrase: string;
  hook: string;
  status: string;
  ready: boolean;
  action: string;
}) {
  const page = pageByCode(record.pageCode);
  return (
    <article className="atos-surface grid gap-6 p-5 sm:grid-cols-[minmax(10rem,15rem)_minmax(0,1fr)] sm:p-6">
      <AssetFrame label={formatLabel(record.format)} accent={page.accent} />
      <div className="flex min-w-0 flex-col">
        <p className="text-sm font-medium" style={{ color: pageInk(page.accent) }}>{page.name}</p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">{record.pillar}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">“{hook}”</p>
        <p className="mt-4 text-sm leading-relaxed">{record.captionInstructions}</p>
        <p className="mt-1 text-xs text-muted-foreground">Plan instruction. Not a finished caption.</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">UK time</dt>
            <dd>{publishPhrase}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Readiness</dt>
            <dd>{ready ? status : `${status} · waiting for a file`}</dd>
          </div>
        </dl>
        <Link href={href} className="atos-btn mt-5 self-start">
          {action}
        </Link>
      </div>
    </article>
  );
}
