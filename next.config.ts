import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.100"],
  // /vendors was the single-region comparison page before the site covered
  // more than Cape Town. Permanent, because the old URL is not coming back:
  // a comparison is now always scoped to a metro.
  async redirects() {
    return [
      { source: "/vendors", destination: "/cape-town/vendors", permanent: true },
      // The production deployment answers on its Vercel alias as well as on
      // the custom domain, and served the whole site on both. Two hosts with
      // the same content split whatever authority the pages earn, and a
      // canonical tag only asks a crawler to consolidate them. Sending the
      // alias to the domain settles it for crawlers and readers alike.
      //
      // The value is the exact production alias, so preview deployments — on
      // their own generated `*.vercel.app` hostnames — are untouched and go on
      // serving themselves for review.
      {
        source: "/:path*",
        has: [{ type: "host", value: "wood-wiz.vercel.app" }],
        destination: "https://woodwiz.sheetsolved.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
