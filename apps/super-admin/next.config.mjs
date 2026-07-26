/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: ['140.245.207.93', 'http://140.245.207.93'],
};

export default nextConfig;
