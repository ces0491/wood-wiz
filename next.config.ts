import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.100"],
  // /vendors was the single-region comparison page before the site covered
  // more than Cape Town. Permanent, because the old URL is not coming back:
  // a comparison is now always scoped to a metro.
  async redirects() {
    return [
      { source: "/vendors", destination: "/cape-town/vendors", permanent: true },
    ];
  },
};

export default nextConfig;
