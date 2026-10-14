"use client";

import { useCallback, useEffect, useState } from "react";

type WorkerRow = {
  id: string;
  name: string;
  revokedAt: string | null;
  lastHeartbeatAt: string | null;
  hostLabel: string | null;
  online: boolean;
};

type JobRow = {
  id: string;
  contentId: string;
  status: string;
  attempt: number;
  error: string | null;
  assetUrl: string | null;
  planDuration: string | null;
  measurements: { renderSeconds: number; externalApiCostCents: number | null } | null;
};

type QueueBody = {
  jobs: JobRow[];
  buffer: { due: number; ready: number; sufficient: boolean; window: string };
  heartbeat: { lastHeartbeatAt: string | null; online: boolean };
  approvedCount: number;
  drive: string;
};

export function MediaWorkerPanel() {
  const [queue, setQueue] = useState<QueueBody | null>(null);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState("Mac M3 Pro");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [jobsResponse, workersResponse] = await Promise.all([
      fetch("/api/media-jobs"),
      fetch("/api/media-workers"),
    ]);
    if (jobsResponse.ok) setQueue((await jobsResponse.json()) as QueueBody);
    if (workersResponse.ok) {
      const body = (await workersResponse.json()) as { workers: WorkerRow[] };
      setWorkers(body.workers);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function issueCredential() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/media-workers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = (await response.json()) as { token?: string; error?: string };
    setBusy(false);
    if (!response.ok || !body.token) {
      setMessage(body.error ?? "The credential was not created.");
      return;
    }
    setToken(body.token);
    await refresh();
  }

  async function revoke(id: string) {
    setBusy(true);
    await fetch("/api/media-workers/revoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    await refresh();
  }

  async function queueProof() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/media-jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentId: "UK-SGIUK-001" }),
    });
    const body = (await response.json()) as { error?: string; created?: boolean };
    setBusy(false);
    setMessage(body.error ?? (body.created ? "UK-SGIUK-001 is queued. No file has been rendered." : "That proof is already in the queue. No file has been rendered."));
    await refresh();
  }

  const buffer = queue?.buffer;
  const seen = queue?.heartbeat.lastHeartbeatAt
    ? new Date(queue.heartbeat.lastHeartbeatAt).toLocaleString("en-GB", { timeZone: "Europe/London" })
    : null;

  return (
    <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">Local Mac · not a purchased GPU</p>
      <h2 className="font-heading text-3xl">Media worker</h2>
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        The queue lives here. A Mac worker polls over outbound HTTPS. Google Drive is not connected, Kokoro is not installed, and nothing on this page is a finished Reel.
      </p>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Heartbeat</dt>
          <dd className="font-medium">{queue?.heartbeat.online ? "Online" : "Offline"}</dd>
          <dd className="text-sm text-muted-foreground">{seen ? `Last seen ${seen} UK` : "No heartbeat yet"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Ready buffer</dt>
          <dd className="font-medium">{buffer ? `${buffer.ready} of ${buffer.due}` : "—"}</dd>
          <dd className="text-sm text-muted-foreground">
            {buffer?.sufficient ? "Covers the current window." : "Short of a 72-hour ready buffer. No email is sent."}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Approved files</dt>
          <dd className="font-medium">{queue?.approvedCount ?? 0}</dd>
          <dd className="text-sm text-muted-foreground">Drive {queue?.drive === "not_connected" ? "not connected" : queue?.drive}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block text-sm">
          Worker name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 block h-10 w-full rounded-lg border bg-background px-3 sm:w-64"
          />
        </label>
        <button type="button" disabled={busy} onClick={() => void issueCredential()} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50">
          Issue credential
        </button>
        <button type="button" disabled={busy} onClick={() => void queueProof()} className="inline-flex h-10 items-center rounded-lg px-4 text-sm ring-1 ring-foreground/15 disabled:opacity-50">
          Queue Still Got It proof
        </button>
      </div>
      {token ? (
        <p className="rounded-lg bg-background p-3 text-sm">
          Copy this worker token now. It is not stored and it will not be shown again.
          <code className="mt-2 block break-all">{token}</code>
        </p>
      ) : null}
      {message ? <p className="text-sm">{message}</p> : null}
      <ul className="divide-y text-sm">
        {workers.map((worker) => (
          <li key={worker.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {worker.name} · {worker.revokedAt ? "Revoked" : worker.online ? "Online" : "Offline"}
              {worker.hostLabel ? ` · ${worker.hostLabel}` : ""}
            </span>
            {worker.revokedAt ? null : (
              <button type="button" disabled={busy} onClick={() => void revoke(worker.id)} className="text-sm text-primary">
                Revoke
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            <tr className="border-b">
              <th className="py-3 pr-4 font-medium">Post</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium">Attempt</th>
              <th className="py-3 font-medium">File</th>
            </tr>
          </thead>
          <tbody>
            {queue && queue.jobs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-muted-foreground">No production jobs.</td>
              </tr>
            ) : null}
            {queue?.jobs.map((job) => (
              <tr key={job.id} className="border-b">
                <td className="py-3 pr-4">
                  {job.contentId}
                  <span className="block text-muted-foreground">Plan duration {job.planDuration ?? "not set"} · proof target 30–40s</span>
                </td>
                <td className="py-3 pr-4">{job.status}{job.error ? ` · ${job.error}` : ""}</td>
                <td className="py-3 pr-4">{job.attempt}</td>
                <td className="py-3">{job.assetUrl ? "https file waiting for approval" : "No file"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
