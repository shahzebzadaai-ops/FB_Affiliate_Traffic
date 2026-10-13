"use client";

import Link from "next/link";
import { contentRecords, importReport } from "@/content/catalog";
import { integrationStatus, PLANNED_DRIVE_FOLDERS } from "@/integrations/status";
import { statusLabel, usePreview } from "@/preview/preview-context";
import { pageByCode } from "@/domain/pages";

export function ApprovalQueue() {
  const preview = usePreview();
  const queue = contentRecords.filter((record) => {
    const status = preview.stateFor(record.contentId).status;
    return status === "READY_FOR_REVIEW" || status === "CHANGES_REQUESTED";
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-5xl tracking-tight">Approvals</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Significant creative changes wait here for your approval. Masho does not write the asset, and he cannot approve his own work. Approval is not a published post.</p>
      </header>
      {queue.length === 0 ? (
        <p className="rounded-xl bg-card p-5 text-sm ring-1 ring-foreground/10">Nothing is waiting. The AI pipeline is not connected, so no finished file has been submitted.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl bg-card ring-1 ring-foreground/10">
          {queue.map((record) => {
            const state = preview.stateFor(record.contentId);
            return (
              <li key={record.contentId} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{pageByCode(record.pageCode).name}</p>
                  <p className="text-sm text-muted-foreground">{record.contentId} · {statusLabel(state.status)}</p>
                  <p className="mt-1 text-sm">{preview.effectiveHook(record)}</p>
                </div>
                <Link href={`/owner/tasks/${record.contentId}`} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground">
                  Review
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ImportReportView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-5xl tracking-tight">Plan import</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{importReport.allocationNote}</p>
      </header>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Expected" value={importReport.expectedRecords} />
        <Metric label="Imported" value={importReport.successfullyImported} />
        <Metric label="Duplicates" value={importReport.duplicates.length} />
        <Metric label="Missing fields" value={importReport.missingFields.length} />
      </dl>
      <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Unresolved content</h2>
        <p className="mt-1 text-sm text-muted-foreground">{importReport.unresolved.length} imported posts still need a decision. They were not dropped.</p>
        <ul className="mt-4 max-h-[32rem] space-y-3 overflow-auto text-sm">
          {importReport.unresolved.map((item) => (
            <li key={item.contentId}>
              <Link href={`/owner/tasks/${item.contentId}`} className="font-medium text-primary">{item.contentId}</Link>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {item.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function IntegrationsView() {
  const connections = integrationStatus();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-5xl tracking-tight">Future systems</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">These connections are designed and not authenticated. The preview does not claim they are live.</p>
      </header>
      <div className="grid gap-4">
        {connections.map((connection) => (
          <article key={connection.id} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Not connected</p>
            <h2 className="mt-1 font-heading text-3xl">{connection.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{connection.detail}</p>
          </article>
        ))}
      </div>
      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Planned Drive folders</h2>
        <p className="mt-2 text-sm text-muted-foreground">Affiliate Traffic OS / UK / Page name / year-month / content ID /</p>
        <p className="mt-2 text-sm">{PLANNED_DRIVE_FOLDERS.join(" · ")}</p>
      </section>
    </div>
  );
}

export function FinanceView() {
  return (
    <div className="space-y-10">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Owner only</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Affiliate intelligence</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Outbound clicks, PPS conversions, pending and approved commission, and revenue by Page, post, offer and country appear here after a network is connected. Nothing below is a ledger figure.
        </p>
      </header>
      <Ledger title="By Page and country" columns={["Page", "Country", "Clicks", "PPS", "Pending", "Approved"]} />
      <Ledger title="By post" columns={["Content ID", "Page", "Offer", "Clicks", "PPS", "Approved"]} />
      <Ledger title="By offer" columns={["Offer", "Network", "GEO", "Pending", "Approved", "Paid"]} />
      <p className="text-sm text-muted-foreground">AI generation cost is not recorded. No model has been called.</p>
    </div>
  );
}

function Ledger({ title, columns }: { title: string; columns: string[] }) {
  return (
    <section>
      <h2 className="font-heading text-3xl tracking-tight">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            <tr className="border-b">
              {columns.map((column) => (
                <th key={column} className="py-3 pr-4 font-medium">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              {columns.map((column) => (
                <td key={column} className="py-4 pr-4 text-muted-foreground">Not connected</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-3xl">{value}</p>
    </div>
  );
}
