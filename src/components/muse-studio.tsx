"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MUSE_ADVERTISED_TOKENS,
  MUSE_PRESETS,
  MUSE_STAGES,
  packageMarkdown,
  scenePrompt,
  type MusePackageBody,
  type MusePresetId,
} from "@/domain/muse";
import { useWork } from "@/components/use-work";

type Overview = {
  provider?: { name: string; provider_type: string; website_url: string | null; notes: string };
  capabilities: { capability: string; label: string; status: string }[];
  packages: { id: string; content_id: string; preset: string; stage: string; prompt_version: number; package: MusePackageBody }[];
  assets: {
    id: string;
    package_id: string;
    content_id: string;
    offer_id: string | null;
    scene_number: number | null;
    prompt_version: number;
    content_type: string;
    aspect_ratio: string | null;
    duration_seconds: string | null;
    width: number | null;
    height: number | null;
    storage_path: string;
    approval_status: string;
    review_notes: string;
    original_filename: string;
    generated_on: string;
  }[];
  summary: {
    advertisedOpeningBalance: number;
    lastBalance: number | null;
    tokensSpent: number | null;
    lastUpdated: string | null;
    finishedVideos: number;
    finishedImages: number;
    rejected: number;
    averageTokensPerSuccessfulAsset: number | null;
  };
  campaign: { status: string; not_started: boolean } | null;
};

const PILOT_PRESETS: MusePresetId[] = ["ugc", "problem", "educational"];
const numberFormat = new Intl.NumberFormat("en-GB");

export function MuseStudio() {
  const router = useRouter();
  const search = useSearchParams();
  const { decorated } = useWork();
  const contentId = search.get("content") || "UK-BGUK-001";
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MusePackageBody | null>(null);
  const [dirty, setDirty] = useState(false);
  const [preset, setPreset] = useState<MusePresetId>("ugc");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [website, setWebsite] = useState("");
  const [balance, setBalance] = useState("");
  const [balanceSpent, setBalanceSpent] = useState("");
  const [balanceNote, setBalanceNote] = useState("");
  const [usageKind, setUsageKind] = useState<"FINISHED_VIDEO" | "FINISHED_IMAGE" | "REJECTED">("FINISHED_VIDEO");
  const [usageSpent, setUsageSpent] = useState("");
  const [usageNote, setUsageNote] = useState("");

  async function load() {
    const response = await fetch("/api/muse", { cache: "no-store" });
    const body = (await response.json().catch(() => ({ error: "The Muse desk could not be loaded." }))) as Overview & { error?: string };
    if (!response.ok) {
      setNotice(body.error ?? "The Muse desk could not be loaded.");
      return;
    }
    setOverview(body);
    setWebsite(body.provider?.website_url ?? "");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const packages = overview?.packages.filter((item) => item.content_id === contentId) ?? [];
  const selected = packages.find((item) => item.id === selectedId) ?? packages[0] ?? null;
  const shown = selected && draftId === selected.id && draft ? draft : selected?.package ?? null;
  const shownDirty = Boolean(selected && draftId === selected.id && dirty);

  function editDraft(next: MusePackageBody) {
    if (!selected) return;
    setDraftId(selected.id);
    setDraft(next);
    setDirty(true);
  }

  function chooseContent(next: string) {
    setDirty(false);
    setDraftId(null);
    setSelectedId(null);
    router.replace(`/owner/studio/muse?content=${next}`);
  }

  async function prepare(presets: MusePresetId[]) {
    setBusy(true);
    setNotice(null);
    const response = await fetch("/api/muse/packages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentId, presets }),
    });
    const body = (await response.json().catch(() => ({}))) as { ids?: string[]; error?: string };
    setBusy(false);
    if (!response.ok || !body.ids) {
      setNotice(body.error ?? "The package was not prepared.");
      return;
    }
    setDirty(false);
    setDraftId(null);
    setSelectedId(body.ids[0] ?? null);
    setNotice(
      presets.length === 3
        ? "Three reel concepts are ready. Six image prompts are inside each one. Nothing was sent to Muse, and nothing was published."
        : "The package is ready to copy. Nothing was sent to Muse, and nothing was published.",
    );
    await load();
  }

  async function persistDraft(): Promise<boolean> {
    if (!selected || !shown) return false;
    const response = await fetch(`/api/muse/packages/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ package: shown, bump: true }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNotice(body.error ?? "The edit was not stored.");
      return false;
    }
    setDirty(false);
    await load();
    return true;
  }

  async function copyText(text: string) {
    if (shownDirty) {
      const saved = await persistDraft();
      if (!saved) return;
    }
    await navigator.clipboard.writeText(text);
    setNotice("Copied. Paste it into the Muse website yourself.");
  }

  function download(filename: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPackage(kind: "md" | "txt" | "json") {
    if (!selected || !shown) return;
    if (shownDirty) {
      const saved = await persistDraft();
      if (!saved) return;
    }
    const version = selected.prompt_version;
    if (kind === "json") {
      download(
        `${shown.contentId}-${shown.preset}-v${version}.json`,
        JSON.stringify({ provider: "Muse AI — Web Studio", providerType: "EXTERNAL_MANUAL", promptVersion: version, stage: selected.stage, package: shown }, null, 2),
        "application/json",
      );
      return;
    }
    download(`${shown.contentId}-${shown.preset}-v${version}.${kind}`, packageMarkdown(shown), "text/plain");
  }

  async function markScene(sceneNumber: number) {
    if (!selected) return;
    setBusy(true);
    const response = await fetch(`/api/muse/packages/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ markScene: sceneNumber }),
    });
    const body = (await response.json()) as { error?: string };
    setBusy(false);
    setNotice(response.ok ? `Scene ${sceneNumber} is marked generated. Upload the file you downloaded from Muse.` : body.error ?? "The scene was not marked.");
    if (response.ok) {
      setDirty(false);
      setDraftId(null);
      await load();
    }
  }

  async function regenerate() {
    if (!selected) return;
    setBusy(true);
    const response = await fetch(`/api/muse/packages/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ regenerate: true }),
    });
    const body = (await response.json()) as { error?: string; package?: MusePackageBody };
    setBusy(false);
    if (!response.ok || !body.package) {
      setNotice(body.error ?? "The prompt was not regenerated.");
      return;
    }
    setDraft(body.package);
    setDraftId(selected.id);
    setDirty(false);
    setNotice("Prompt regenerated from the plan brief. No model was called.");
    await load();
  }

  async function upload(form: FormData) {
    if (!selected) return;
    form.set("packageId", selected.id);
    setBusy(true);
    const response = await fetch("/api/muse/assets", { method: "POST", body: form });
    const body = (await response.json()) as { error?: string };
    setBusy(false);
    setNotice(response.ok ? "File stored in this campaign library. It is not published." : body.error ?? "The file was not stored.");
    if (response.ok) await load();
  }

  async function review(id: string, status: "REVIEW" | "APPROVED" | "REJECTED", notes: string) {
    const response = await fetch(`/api/muse/assets/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    const body = (await response.json()) as { error?: string; campaignStatus?: string | null };
    setNotice(response.ok ? `Review saved. Campaign status remains ${body.campaignStatus ?? "unchanged"}. Nothing was published.` : body.error ?? "The review was not saved.");
    if (response.ok) await load();
  }

  async function saveWebsite() {
    const response = await fetch("/api/muse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "website", websiteUrl: website.trim() || null }),
    });
    const body = (await response.json()) as { error?: string };
    setNotice(response.ok ? "Website link saved. No Muse credentials are stored." : body.error ?? "The website was not saved.");
    if (response.ok) await load();
  }

  async function saveBalance() {
    const parsedBalance = Number(balance);
    const spent = balanceSpent.trim() ? Number(balanceSpent) : null;
    const response = await fetch("/api/muse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "balance", balance: parsedBalance, spent, note: balanceNote }),
    });
    const body = (await response.json()) as { error?: string };
    setNotice(response.ok ? "Balance recorded. Nothing was deducted automatically." : body.error ?? "The balance was not recorded.");
    if (response.ok) await load();
  }

  async function saveUsage() {
    const spent = usageSpent.trim() ? Number(usageSpent) : null;
    const response = await fetch("/api/muse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "usage", kind: usageKind, spent, note: usageNote }),
    });
    const body = (await response.json()) as { error?: string };
    setNotice(response.ok ? "Usage recorded from what you typed. No estimate was added." : body.error ?? "The usage was not recorded.");
    if (response.ok) await load();
  }

  const websiteHref = overview?.provider?.website_url ?? "";
  const summary = overview?.summary;

  return (
    <div className="space-y-8" data-testid="muse-studio">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Content Studio</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Prepare for Muse AI</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {overview?.provider?.name ?? "Muse AI — Web Studio"} is a manual website. AffiGrove OS prepares the brief. You copy it, generate in Muse, then upload the finished file. No model is called and no account password is stored.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Campaign {overview?.campaign?.status ?? "unknown"}. Publishing stays off until the existing start control is used.
        </p>
      </header>

      {notice ? <p className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">{notice}</p> : null}

      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Provider</h2>
        <p className="mt-2 text-sm text-muted-foreground">{overview?.provider?.provider_type ?? "EXTERNAL_MANUAL"} · {overview?.provider?.notes}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(overview?.capabilities ?? []).map((item) => (
            <li key={item.capability} className="rounded-full bg-muted px-3 py-1 text-xs">
              {item.label} · {item.status}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            Muse website
            <input className="atos-field mt-1 block w-80 max-w-full px-3 py-2" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://" />
          </label>
          <button type="button" className="atos-btn-quiet" onClick={() => void saveWebsite()}>Save website</button>
          {websiteHref ? (
            <a className="atos-btn" href={websiteHref} target="_blank" rel="noreferrer">Open Muse AI website</a>
          ) : (
            <button type="button" className="atos-btn" disabled>Open Muse AI website</button>
          )}
        </div>
      </section>

      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Campaign row</h2>
        <label className="mt-3 block text-sm">
          Content
          <select className="atos-field mt-1 block w-full max-w-xl px-3 py-2" value={contentId} onChange={(event) => chooseContent(event.target.value)}>
            {decorated.map((item) => (
              <option key={item.record.contentId} value={item.record.contentId}>
                {item.record.contentId} · {item.record.format} · {item.record.pillar}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          {MUSE_PRESETS.map((item) => (
            <button key={item.id} type="button" className={preset === item.id ? "atos-btn" : "atos-btn-quiet"} onClick={() => setPreset(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="atos-btn" disabled={busy} onClick={() => void prepare([preset])}>Prepare for Muse AI</button>
          <button type="button" className="atos-btn-quiet" disabled={busy} onClick={() => void prepare(PILOT_PRESETS)}>Three reel concepts</button>
        </div>
      </section>

      {packages.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {packages.map((item) => (
              <button key={item.id} type="button" className={item.id === selected?.id ? "atos-btn" : "atos-btn-quiet"} onClick={() => { setDirty(false); setDraftId(null); setSelectedId(item.id); }}>
                {item.package.presetLabel} · v{item.prompt_version}
              </button>
            ))}
          </div>
              {selected && shown ? (
            <article className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <p className="text-sm text-muted-foreground">{shown.notice}</p>
              <ol className="flex flex-wrap gap-2 text-xs tracking-wide uppercase">
                {MUSE_STAGES.map((stage) => (
                  <li key={stage} className={stage === selected.stage ? "font-semibold text-primary" : "text-muted-foreground"}>
                    {stage.replaceAll("_", " ")}
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="atos-btn" onClick={() => void copyText(packageMarkdown(shown))}>Copy entire production package</button>
                <button type="button" className="atos-btn-quiet" onClick={() => void downloadPackage("txt")}>Download prompts as TXT</button>
                <button type="button" className="atos-btn-quiet" onClick={() => void downloadPackage("md")}>Download prompts as Markdown</button>
                <button type="button" className="atos-btn-quiet" onClick={() => void downloadPackage("json")}>Download package as JSON</button>
                <button type="button" className="atos-btn-quiet" disabled={busy} onClick={() => void regenerate()}>Regenerate prompt</button>
                <button type="button" className="atos-btn-quiet" disabled={!shownDirty || busy} onClick={() => void persistDraft()}>Save prompt edits</button>
              </div>

              <section>
                <h3 className="font-heading text-2xl">Creative strategy</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="text-muted-foreground">Audience</dt><dd>{shown.strategy.audience}</dd></div>
                  <div><dt className="text-muted-foreground">Problem</dt><dd>{shown.strategy.problem}</dd></div>
                  <div><dt className="text-muted-foreground">Benefits</dt><dd>{shown.strategy.benefits}</dd></div>
                  <div><dt className="text-muted-foreground">Style</dt><dd>{shown.strategy.style}</dd></div>
                  <div><dt className="text-muted-foreground">Duration</dt><dd>{shown.strategy.duration}</dd></div>
                  <div><dt className="text-muted-foreground">Viewer action</dt><dd>{shown.strategy.viewerAction}</dd></div>
                </dl>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {shown.strategy.angles.map((angle) => <li key={angle}>{angle}</li>)}
                  {shown.strategy.hooks.map((hook) => <li key={hook}>{hook}</li>)}
                </ul>
              </section>

              {shown.reel ? (
                <section className="space-y-3">
                  <h3 className="font-heading text-2xl">Reel · {shown.reel.durationTarget}</h3>
                  <p className="text-sm">{shown.reel.concept}</p>
                  <p className="text-sm"><span className="text-muted-foreground">First three seconds: </span>{shown.reel.hook}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Voiceover: </span>{shown.reel.voiceover}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Audio: </span>{shown.reel.audio}</p>
                  <p className="text-sm"><span className="text-muted-foreground">CTA: </span>{shown.reel.cta}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Avoid: </span>{shown.reel.negativePrompt}</p>
                  {shown.reel.scenes.map((scene, index) => (
                    <div key={scene.number} className="rounded-xl bg-background p-4 ring-1 ring-foreground/10">
                      <p className="text-sm font-medium">Scene {scene.number} · {scene.timestamp} · {scene.generated ? "Marked generated" : "Not generated yet"}</p>
                      <label className="mt-2 block text-sm">
                        Prompt
                        <textarea
                          className="atos-field mt-1 min-h-28 w-full px-3 py-2"
                          value={scene.prompt}
                          onChange={(event) => {
                            const next = structuredClone(shown);
                            if (!next?.reel) return;
                            next.reel.scenes[index].prompt = event.target.value;
                            editDraft(next);
                          }}
                        />
                      </label>
                      <p className="mt-2 text-sm text-muted-foreground">Camera: {scene.camera} Lighting: {scene.lighting}</p>
                      <p className="text-sm text-muted-foreground">On-screen text: {scene.onScreenText || "None"} · {scene.continuity}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className="atos-btn-quiet" onClick={() => void copyText(scenePrompt(scene, shown.reel?.negativePrompt ?? ""))}>Copy prompt</button>
                        <button type="button" className="atos-btn-quiet" disabled={busy} onClick={() => void markScene(scene.number)}>Mark scene as generated</button>
                      </div>
                      <UploadFields aspectRatio="9:16" sceneNumber={scene.number} onSubmit={(form) => void upload(form)} />
                    </div>
                  ))}
                </section>
              ) : (
                <p className="text-sm text-muted-foreground">This plan row is not a Reel, so no timed storyboard was invented.</p>
              )}

              <section className="space-y-3">
                <h3 className="font-heading text-2xl">Image prompts</h3>
                {shown.images.map((image, index) => (
                  <div key={image.id} className="rounded-xl bg-background p-4 ring-1 ring-foreground/10">
                    <p className="text-sm font-medium">{image.use} · {image.aspectRatio} · {image.width}×{image.height}</p>
                    <textarea
                      className="atos-field mt-2 min-h-24 w-full px-3 py-2 text-sm"
                      value={image.prompt}
                      onChange={(event) => {
                        const next = structuredClone(shown);
                        if (!next) return;
                        next.images[index].prompt = event.target.value;
                        editDraft(next);
                      }}
                    />
                    <button type="button" className="atos-btn-quiet mt-3" onClick={() => void copyText(image.prompt)}>Copy prompt</button>
                    <UploadFields aspectRatio={image.aspectRatio} imageId={image.id} width={image.width} height={image.height} onSubmit={(form) => void upload(form)} />
                  </div>
                ))}
              </section>

              <section>
                <h3 className="font-heading text-2xl">Social copy</h3>
                <p className="mt-2 text-sm font-medium">{shown.social.title}</p>
                {shown.social.captions.map((caption) => <p key={caption} className="mt-2 text-sm">{caption}</p>)}
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {shown.social.ctas.map((cta) => <li key={cta}>{cta}</li>)}
                </ul>
                <p className="mt-2 text-sm text-muted-foreground">Keywords: {shown.social.keywords.join(", ")}</p>
                <p className="mt-2 text-sm">{shown.social.affiliatePlacement}</p>
                {shown.social.platforms.map((platform) => (
                  <p key={platform.platform} className="mt-2 text-sm"><span className="font-medium">{platform.platform}. </span>{platform.copy}</p>
                ))}
              </section>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Campaign library</h2>
        <p className="mt-2 text-sm text-muted-foreground">Files stay in the private library. Muse does not sync them, and approval does not publish them.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr className="border-b">
                <th className="py-3 pr-3 font-medium">File</th>
                <th className="py-3 pr-3 font-medium">Content</th>
                <th className="py-3 pr-3 font-medium">Scene</th>
                <th className="py-3 pr-3 font-medium">Type</th>
                <th className="py-3 pr-3 font-medium">Review</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.assets.filter((asset) => asset.content_id === contentId) ?? []).map((asset) => (
                <AssetRow key={asset.id} asset={asset} onReview={review} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Muse token record</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Advertised opening balance: {numberFormat.format(summary?.advertisedOpeningBalance ?? MUSE_ADVERTISED_TOKENS)} tokens. That figure is the seller’s label. It is not a measured balance, and it is not deducted here.
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Last manually recorded balance</dt><dd>{summary?.lastBalance === null || summary?.lastBalance === undefined ? "Not entered" : numberFormat.format(summary.lastBalance)}</dd></div>
          <div><dt className="text-muted-foreground">Tokens spent on that entry</dt><dd>{summary?.tokensSpent === null || summary?.tokensSpent === undefined ? "Not entered" : numberFormat.format(summary.tokensSpent)}</dd></div>
          <div><dt className="text-muted-foreground">Finished videos</dt><dd>{summary?.finishedVideos ?? 0}</dd></div>
          <div><dt className="text-muted-foreground">Finished images</dt><dd>{summary?.finishedImages ?? 0}</dd></div>
          <div><dt className="text-muted-foreground">Rejected or unusable</dt><dd>{summary?.rejected ?? 0}</dd></div>
          <div><dt className="text-muted-foreground">Average per successful asset</dt><dd>{summary?.averageTokensPerSuccessfulAsset === null || summary?.averageTokensPerSuccessfulAsset === undefined ? "Not calculable" : numberFormat.format(summary.averageTokensPerSuccessfulAsset)}</dd></div>
          <div><dt className="text-muted-foreground">Last updated</dt><dd>{summary?.lastUpdated ? new Date(summary.lastUpdated).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "Not entered"}</dd></div>
        </dl>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void saveBalance(); }}>
            <p className="text-sm font-medium">Record a balance</p>
            <input className="atos-field w-full px-3 py-2" inputMode="numeric" placeholder="Balance" value={balance} onChange={(event) => setBalance(event.target.value)} />
            <input className="atos-field w-full px-3 py-2" inputMode="numeric" placeholder="Tokens spent, if known" value={balanceSpent} onChange={(event) => setBalanceSpent(event.target.value)} />
            <input className="atos-field w-full px-3 py-2" placeholder="Note" value={balanceNote} onChange={(event) => setBalanceNote(event.target.value)} />
            <button type="submit" className="atos-btn-quiet">Save balance</button>
          </form>
          <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void saveUsage(); }}>
            <p className="text-sm font-medium">Record a finished or rejected generation</p>
            <select className="atos-field w-full px-3 py-2" value={usageKind} onChange={(event) => setUsageKind(event.target.value as typeof usageKind)}>
              <option value="FINISHED_VIDEO">Finished video</option>
              <option value="FINISHED_IMAGE">Finished image</option>
              <option value="REJECTED">Rejected or unusable</option>
            </select>
            <input className="atos-field w-full px-3 py-2" inputMode="numeric" placeholder="Tokens, if known" value={usageSpent} onChange={(event) => setUsageSpent(event.target.value)} />
            <input className="atos-field w-full px-3 py-2" placeholder="Note" value={usageNote} onChange={(event) => setUsageNote(event.target.value)} />
            <button type="submit" className="atos-btn-quiet">Save usage</button>
          </form>
        </div>
      </section>

      <p className="text-sm">
        <Link href="/owner/studio" className="text-muted-foreground">Back to Content Studio</Link>
      </p>
    </div>
  );
}

function UploadFields({
  aspectRatio,
  sceneNumber,
  imageId,
  width,
  height,
  onSubmit,
}: {
  aspectRatio: string;
  sceneNumber?: number;
  imageId?: string;
  width?: number;
  height?: number;
  onSubmit: (form: FormData) => void;
}) {
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (sceneNumber) form.set("sceneNumber", String(sceneNumber));
        if (imageId) form.set("imageId", imageId);
        form.set("aspectRatio", aspectRatio);
        if (width) form.set("width", String(width));
        if (height) form.set("height", String(height));
        onSubmit(form);
        event.currentTarget.reset();
      }}
    >
      <label className="text-sm">
        Finished file
        <input className="mt-1 block text-sm" type="file" name="file" accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp,.mov" required />
      </label>
      <label className="text-sm">
        Duration seconds
        <input className="atos-field mt-1 block w-28 px-3 py-2" name="durationSeconds" inputMode="decimal" />
      </label>
      <label className="text-sm">
        Note
        <input className="atos-field mt-1 block w-48 px-3 py-2" name="reviewNotes" />
      </label>
      <button type="submit" className="atos-btn">Upload finished asset</button>
    </form>
  );
}

function AssetRow({
  asset,
  onReview,
}: {
  asset: Overview["assets"][number];
  onReview: (id: string, status: "REVIEW" | "APPROVED" | "REJECTED", notes: string) => void;
}) {
  const [notes, setNotes] = useState(asset.review_notes);
  const resolution = asset.width && asset.height ? `${asset.width}×${asset.height}` : "Not entered";
  return (
    <tr className="border-b align-top">
      <td className="py-3 pr-3">
        <a className="font-medium" href={`/api/muse/assets/${asset.id}`}>{asset.original_filename}</a>
        <p className="text-muted-foreground">{asset.storage_path}</p>
        <p className="text-muted-foreground">{asset.generated_on} · prompt v{asset.prompt_version}</p>
      </td>
      <td className="py-3 pr-3">
        {asset.content_id}
        <p className="text-muted-foreground">Offer {asset.offer_id ?? "none"}</p>
      </td>
      <td className="py-3 pr-3">{asset.scene_number ?? "Image"}</td>
      <td className="py-3 pr-3">
        {asset.content_type}
        <p className="text-muted-foreground">{asset.aspect_ratio} · {asset.duration_seconds ?? "no duration"}s · {resolution}</p>
      </td>
      <td className="py-3">
        <p>{asset.approval_status}</p>
        <textarea className="atos-field mt-2 min-h-16 w-full px-2 py-1" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="atos-btn-quiet" onClick={() => onReview(asset.id, "REVIEW", notes)}>Send to review</button>
          <button type="button" className="atos-btn" onClick={() => onReview(asset.id, "APPROVED", notes)}>Approve</button>
          <button type="button" className="atos-btn-quiet" onClick={() => onReview(asset.id, "REJECTED", notes)}>Reject</button>
        </div>
      </td>
    </tr>
  );
}
