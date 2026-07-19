import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // OCI public IP — required so client hydration works in `next dev`
  allowedDevOrigins: ["140.245.207.93", "http://140.245.207.93"],
};

export default nextConfig;
