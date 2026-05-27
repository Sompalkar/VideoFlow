import type { NextConfig } from "next";

// Fix Node 25 experimental localStorage crash
if (typeof globalThis !== "undefined" && globalThis.localStorage) {
  delete (globalThis as any).localStorage;
}

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  /* config options here */
};

export default nextConfig;
