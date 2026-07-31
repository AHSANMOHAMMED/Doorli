import type { NextConfig } from "next";
import path from "node:path";

const rootNodeModules = path.join(__dirname, "..", "..", "node_modules");

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // OCI public IP — required so client hydration works in `next dev`
  allowedDevOrigins: ["140.245.207.93", "http://140.245.207.93"],
  turbopack: {
    root: path.join(__dirname),
    resolveAlias: {
      clsx: path.join(rootNodeModules, "clsx"),
      "tailwind-merge": path.join(rootNodeModules, "tailwind-merge"),
    },
  },
};

export default nextConfig;