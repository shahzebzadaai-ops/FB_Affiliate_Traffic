export function AssetFrame({
  label,
  accent,
  size = "stage",
}: {
  label: string;
  accent: string;
  size?: "stage" | "thumb";
}) {
  if (size === "thumb") {
    return (
      <div className="grid size-14 place-items-center bg-[oklch(0.94_0.008_95)] text-[10px] tracking-wide text-muted-foreground uppercase" style={{ boxShadow: `inset 0 2px 0 ${accent}` }}>
        No file
      </div>
    );
  }

  return (
    <div className="grid aspect-[4/5] w-full max-w-sm place-items-center bg-[oklch(0.94_0.008_95)] px-6 text-center" style={{ boxShadow: `inset 0 3px 0 ${accent}` }}>
      <div>
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
        <p className="mt-3 font-heading text-3xl tracking-tight">No master file</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">AI production is not connected. This frame is not a finished image or MP4.</p>
      </div>
    </div>
  );
}
