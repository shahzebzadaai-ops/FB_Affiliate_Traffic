"use client";

import Link from "next/link";
import { pageByCode } from "@/domain/pages";
import { londonDateKey } from "@/domain/schedule";
import { inSevenDayWindow } from "@/preview/queues";
import { AssetFrame } from "@/components/asset-frame";
import { formatLabel } from "@/components/task-card";
import { useWork } from "@/components/use-work";

export function ContentStudio() {
  const { decorated, live, today } = useWork();
  const rows = decorated
    .filter((item) => item.state.status !== "CANCELLED" && inSevenDayWindow(item.planDay, londonDateKey(item.publishAt), { live, today }))
    .sort((a, b) => a.planDay - b.planDay || a.publishAt.localeCompare(b.publishAt));

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Production</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Content Studio</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          The next seven days of the plan. No model is connected, so nothing here has a generation cost or a master file. Fictional stories in the plan are editorial, not testimonials.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            <tr className="border-b">
              <th className="py-3 pr-3 font-medium">Preview</th>
              <th className="py-3 pr-3 font-medium">Day</th>
              <th className="py-3 pr-3 font-medium">Page</th>
              <th className="py-3 pr-3 font-medium">Topic</th>
              <th className="py-3 pr-3 font-medium">Generation</th>
              <th className="py-3 pr-3 font-medium">Cost</th>
              <th className="py-3 pr-3 font-medium">Quality</th>
              <th className="py-3 font-medium">Storage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const page = pageByCode(item.record.pageCode);
              const flagged = item.state.regenerationRequest?.note;
              return (
                <tr key={item.record.contentId} className="border-b align-top">
                  <td className="py-3 pr-3"><AssetFrame label={formatLabel(item.record.format)} accent={page.accent} size="thumb" /></td>
                  <td className="py-3 pr-3">{item.planDay}</td>
                  <td className="py-3 pr-3" style={{ color: page.accent }}>{page.name}</td>
                  <td className="py-3 pr-3">
                    <Link href={`/owner/tasks/${item.record.contentId}`} className="font-medium">{item.record.pillar}</Link>
                    <p className="text-muted-foreground">{item.record.contentId}</p>
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">Not connected</td>
                  <td className="py-3 pr-3 text-muted-foreground">Not connected</td>
                  <td className="py-3 pr-3">{flagged ? `Flagged: ${flagged}` : "No file to review"}</td>
                  <td className="max-w-56 py-3 text-muted-foreground">{item.record.driveFolderPath}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
