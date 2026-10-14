"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Prompt = { id: string; label: string; text: string };
type Episode = {
  id: string;
  episode_number: number;
  title: string;
  muse_package: { prompts: Prompt[]; markdown: string; publishing: string };
  clips: Array<{ id: string; scene_number: number; original_filename: string; assembled: boolean }>;
};
type Series = {
  id: string;
  title: string;
  approval: string;
  model: string | null;
  live_research: boolean;
  bible: { premise?: string; whyTest?: string; assumptions?: string[]; publishing?: string; researchMessage?: string; source?: string };
  episodes: Episode[];
};
type Desk = {
  series: Series[];
  language: { configured: boolean; missing: string[]; active: string | null; model: string | null };
  novita: { configured: boolean; missing: string[] };
  research: { message: string };
  controls: { intelligence: string };
  editing: { message: string };
  storage: { permanent: { configured: boolean; message: string } };
};

export function StoryStudio() {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/stories");
    const body = (await response.json()) as Desk & { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Story Series Studio could not be loaded.");
      return;
    }
    setError("");
    setDesk(body);
    setSelectedId((current) => current ?? body.series[0]?.id ?? null);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const selected = desk?.series.find((item) => item.id === selectedId) ?? desk?.series[0] ?? null;
  const blocked = !desk?.language.configured || desk.controls.intelligence !== "STARTED";

  async function generate() {
    setBusy(true);
    const response = await fetch("/api/stories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
    const body = (await response.json()) as { error?: string; seriesId?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error ?? "No series was created.");
      return;
    }
    setSelectedId(body.seriesId ?? null);
    await load();
  }

  async function approve(seriesId: string) {
    const response = await fetch(`/api/stories/${seriesId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const body = (await response.json()) as { error?: string; campaign?: { status: string } };
    if (!response.ok) {
      setError(body.error ?? "The series was not approved.");
      return;
    }
    setError(`Approved in the library. Campaign status remains ${body.campaign?.status ?? "BUILD"}. The episode is not published.`);
    await load();
  }

  async function upload(episodeId: string, sceneNumber: number, file: File, seriesId: string) {
    const form = new FormData();
    form.set("file", file);
    form.set("episodeId", episodeId);
    form.set("sceneNumber", String(sceneNumber));
    const response = await fetch(`/api/stories/${seriesId}`, { method: "POST", body: form });
    const body = (await response.json()) as { error?: string; assembled?: boolean };
    if (!response.ok) {
      setError(body.error ?? "The clip was not stored.");
      return;
    }
    setError(body.assembled ? "Stored." : "Clip stored in the private library. It has not been assembled, and it has not been sent to permanent storage.");
    await load();
  }

  function download(episode: Episode, title: string) {
    const blob = new Blob([episode.muse_package.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}-episode-${episode.episode_number}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Original episodic romance</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Story Series Studio</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A pilot is created only when the configured language model replies. That model does not search the web. Muse stays a manual website, and approval does not publish.
        </p>
      </header>
      {error ? <p className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">{error}</p> : null}
      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <p className="text-sm">{desk?.research.message}</p>
        <p className="mt-2 text-sm text-muted-foreground">{desk?.editing.message}</p>
        <p className="mt-2 text-sm text-muted-foreground">{desk?.storage.permanent.message}</p>
        <button type="button" className="atos-btn mt-4" disabled={blocked || busy} onClick={() => void generate()}>
          {busy ? "Writing the pilot" : "Generate an original five-episode pilot"}
        </button>
        {blocked ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {desk?.language.configured
              ? "Start the AI intelligence engine before asking the language model."
              : `No language model is configured. Missing ${desk?.language.missing.join(", ") ?? "credentials"}. No story has been invented in its place.`}
          </p>
        ) : null}
      </section>
      {selected ? (
        <section className="space-y-6">
          <header>
            <h2 className="font-heading text-3xl">{selected.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Route {selected.bible.source ?? "not recorded"}. Model {selected.model ?? "not recorded"}. Live research {selected.live_research ? "used" : "not used"}. Approval {selected.approval}. Publishing {selected.bible.publishing ?? "disabled"}.
            </p>
            <p className="mt-3 max-w-2xl text-sm">{selected.bible.premise}</p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Model note, not a measured trend: {selected.bible.whyTest}</p>
          </header>
          {selected.episodes.map((episode) => (
            <article key={episode.id} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <h3 className="font-heading text-2xl">Episode {episode.episode_number}: {episode.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="atos-btn-quiet" onClick={() => void navigator.clipboard.writeText(episode.muse_package.markdown)}>Copy episode package</button>
                <button type="button" className="atos-btn-quiet" onClick={() => download(episode, selected.title)}>Download package</button>
              </div>
              <ul className="mt-4 space-y-4">
                {episode.muse_package.prompts.map((prompt) => (
                  <ShotPrompt
                    key={prompt.id}
                    prompt={prompt}
                    uploaded={episode.clips.filter((clip) => clip.scene_number === Number(prompt.id.split("-s")[1] ?? "1")).length}
                    onUpload={(file) => upload(episode.id, Number(prompt.id.split("-s")[1] ?? "1"), file, selected.id)}
                  />
                ))}
              </ul>
            </article>
          ))}
          <button type="button" className="atos-btn" onClick={() => void approve(selected.id)}>Approve series in the library</button>
          <p className="text-sm text-muted-foreground">Approval keeps the campaign in build mode. Facebook is not called.</p>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">No series is stored.</p>
      )}
      <p><Link className="text-primary" href="/owner/intelligence">Back to Intelligence</Link></p>
    </div>
  );
}

function ShotPrompt({
  prompt,
  uploaded,
  onUpload,
}: {
  prompt: Prompt;
  uploaded: number;
  onUpload: (file: File) => Promise<void>;
}) {
  const [text, setText] = useState(prompt.text);
  return (
    <li>
      <p className="text-sm font-medium">{prompt.label}</p>
      <textarea className="atos-field mt-2 min-h-28 w-full" value={text} onChange={(event) => setText(event.target.value)} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" className="atos-btn-quiet" onClick={() => void navigator.clipboard.writeText(text)}>Copy prompt</button>
        <label className="atos-btn-quiet cursor-pointer">
          Upload finished shot
          <input
            className="sr-only"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
        </label>
        <span className="text-sm text-muted-foreground">{uploaded === 0 ? "No file uploaded." : `${uploaded} file stored. Not assembled.`}</span>
      </div>
    </li>
  );
}
