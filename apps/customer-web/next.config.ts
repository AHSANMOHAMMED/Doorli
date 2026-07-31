import type { NextConfig } from "next";
import path from "node:path";

const rootNodeModules = path.join(__dirname, "..", "..", "node_modules");

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // OCI public IP — required so client hydration works in `next dev`
  allowedDevOrigins: ["140.245.207.93", "http://140.245.207.93"],
  turbopack: {
    resolveAlias: {
      "@doorli/design-tokens": path.join(rootNodeModules, "@doorli/design-tokens"),
      "@stripe/stripe-js": path.join(rootNodeModules, "@stripe/stripe-js"),
      clsx: path.join(rootNodeModules, "clsx"),
      "framer-motion": path.join(rootNodeModules, "framer-motion"),
      "lucide-react": path.join(rootNodeModules, "lucide-react"),
      "tailwind-merge": path.join(rootNodeModules, "tailwind-merge"),
    },
  },
};

export default nextConfig;