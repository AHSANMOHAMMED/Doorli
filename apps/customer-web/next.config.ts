import path from 'node:path';
import type { NextConfig } from 'next';

const apiOrigin = process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: ['140.245.207.93', 'http://140.245.207.93'],
  output: 'standalone',
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${apiOrigin}/api/v1/:path*` }];
  },
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
};

export default nextConfig;
