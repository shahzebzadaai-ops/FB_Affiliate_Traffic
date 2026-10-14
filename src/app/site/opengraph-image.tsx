import { ImageResponse } from "next/og";

export const alt = "AffiGrove Media Group — Stories that stay. Connections that matter.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#000000",
          color: "#ffffff",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#9ca3af", textTransform: "uppercase" }}>
          AffiGrove Media Group
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 76, lineHeight: 1.05, letterSpacing: -2 }}>Stories that stay.</div>
        <div style={{ display: "flex", fontSize: 76, lineHeight: 1.05, letterSpacing: -2, fontStyle: "italic" }}>
          Connections that matter.
        </div>
      </div>
    ),
    size,
  );
}
