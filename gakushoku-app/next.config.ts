import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  /* 
    Note: 'eslint' property is removed because it is no longer supported 
    in next.config.ts for Next.js 16+. Linting should be managed via 
    eslint.config.mjs and CLI.
  */
};

export default withPWA(nextConfig);
