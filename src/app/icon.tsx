import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#b45309",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="3" y="3" width="14" height="5" rx="2.5" fill="white" fillOpacity="0.3" />
          <rect x="6" y="9.5" width="14" height="5" rx="2.5" fill="white" fillOpacity="0.3" />
          <rect x="3" y="16" width="14" height="5" rx="2.5" fill="white" fillOpacity="0.3" />
        </svg>
      </div>
    ),
    size,
  );
}
