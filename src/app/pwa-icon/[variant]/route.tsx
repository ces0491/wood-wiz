import { ImageResponse } from "next/og";

/**
 * PWA home-screen icons, generated on the same amber log-stack mark as the
 * favicon (app/icon.tsx). Referenced by app/manifest.ts. Prerendered to the
 * three known variants at build; any other path 404s.
 */

type Spec = { size: number; scale: number };

// scale = mark box as a fraction of the canvas. Maskable is smaller to sit
// inside the ~80%-diameter safe zone a circular Android mask leaves untouched.
const VARIANTS: Record<string, Spec> = {
  "192": { size: 192, scale: 0.64 },
  "512": { size: 512, scale: 0.64 },
  maskable: { size: 512, scale: 0.56 },
};

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export const dynamicParams = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params;
  const spec = VARIANTS[variant] ?? VARIANTS["512"];
  const mark = Math.round(spec.size * spec.scale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={mark}
          height={mark}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <rect x="3" y="3" width="14" height="5" rx="2.5" fill="white" fillOpacity="0.3" />
          <rect x="6" y="9.5" width="14" height="5" rx="2.5" fill="white" fillOpacity="0.3" />
          <rect x="3" y="16" width="14" height="5" rx="2.5" fill="white" fillOpacity="0.3" />
        </svg>
      </div>
    ),
    { width: spec.size, height: spec.size },
  );
}
