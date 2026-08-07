import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Vessel tracking — AIS positions, vessel history and alerts";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#111b23",
          color: "#e7edf2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, color: "#9fb2c0" }}>
          Maritime activity
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 92, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.04em" }}>
            Vessel tracking
          </div>
          <div style={{ fontSize: 30, color: "#aabac7", lineHeight: 1.4 }}>
            AIS positions, vessel history and alerts
          </div>
        </div>
        <div style={{ display: "flex", borderTop: "1px solid #30414e", paddingTop: 24, fontSize: 22, color: "#9fb2c0" }}>
          Explore the map. Inspect a vessel. Review its history.
        </div>
      </div>
    ),
    size,
  );
}
