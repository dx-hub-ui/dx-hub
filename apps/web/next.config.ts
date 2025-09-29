import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dx/ui"],
  experimental: {
    instrumentationHook: true,
  },
  productionBrowserSourceMaps: true,
};

export default nextConfig;
