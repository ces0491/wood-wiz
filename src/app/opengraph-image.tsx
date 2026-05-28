import { ImageResponse } from "next/og";

export const alt = "Wood Wiz — Cape Town firewood prices per kilogram";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #fef3c7 0%, #fde68a 35%, #f59e0b 100%)",
          color: "#451a03",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Stacked logs mark */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#92400e"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <rect x="3" y="3" width="14" height="5" rx="2.5" fill="#92400e" fillOpacity="0.25" />
            <rect x="6" y="9.5" width="14" height="5" rx="2.5" fill="#92400e" fillOpacity="0.25" />
            <rect x="3" y="16" width="14" height="5" rx="2.5" fill="#92400e" fillOpacity="0.25" />
          </svg>
          <span style={{ fontSize: "56px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Wood Wiz
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "84px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            <div style={{ display: "flex" }}>Cape Town firewood,</div>
            <div style={{ display: "flex" }}>ranked by R/kg.</div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "32px",
              color: "#78350f",
              fontWeight: 500,
            }}
          >
            8 vendors. Daily refresh. No affiliate links.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
