/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/vendor',
  transpilePackages: ['@doorli/types'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: ['140.245.207.93', 'http://140.245.207.93'],
};

module.exports = nextConfig;
