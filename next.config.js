/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint enabled during builds - warnings won't block, only errors
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
