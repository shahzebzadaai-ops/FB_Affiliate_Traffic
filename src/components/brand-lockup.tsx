export function BrandLockup({
  kind,
  className,
}: {
  kind: "affigrove" | "os";
  className?: string;
}) {
  const os = kind === "os";
  return (
    // The supplied SVG is the wordmark. Its lettering is not retyped in the application font.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={os ? "/brand/affigrove-os-white.svg" : "/brand/affigrove-horizontal-white.svg"}
      alt={os ? "AffiGrove OS" : "AffiGrove"}
      width={os ? 580 : 480}
      height={112}
      className={className}
    />
  );
}
