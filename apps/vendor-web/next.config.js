/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@doorli/types'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
