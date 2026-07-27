/** @type {import('next').NextConfig} */

// In production nginx maps /api and /health to the API service. Running the app
// on its own (localhost, previews) there is no such proxy, so point
// API_PROXY_TARGET at an API origin to reproduce that mapping.
const apiProxyTarget = process.env.API_PROXY_TARGET;

const nextConfig = {
  basePath: '/vendor',
  transpilePackages: ['@doorli/types'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: ['140.245.207.93', 'http://140.245.207.93'],
  ...(apiProxyTarget && {
    async rewrites() {
      return {
        beforeFiles: [
          { source: '/api/v1/:path*', destination: `${apiProxyTarget}/api/v1/:path*`, basePath: false },
          { source: '/health', destination: `${apiProxyTarget}/health`, basePath: false },
        ],
      };
    },
  }),
};

module.exports = nextConfig;
