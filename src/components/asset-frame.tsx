import { pageInk } from "@/domain/pages";

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
      <div className="grid size-14 place-items-center rounded-2xl bg-muted text-[10px] font-medium text-muted-foreground" style={{ boxShadow: `inset 0 2px 0 ${pageInk(accent)}` }}>
        No file
      </div>
    );
  }

  return (
    <div className="grid aspect-[4/5] w-full max-w-sm place-items-center rounded-[1.25rem] bg-muted px-6 text-center" style={{ boxShadow: `inset 0 3px 0 ${pageInk(accent)}` }}>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">No master file</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">AI production is not connected. This frame is not a finished image or MP4.</p>
      </div>
    </div>
  );
}
