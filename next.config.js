/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint enabled during builds - warnings won't block, only errors
    ignoreDuringBuilds: false,
  },

  // 🚀 P2-1: Bundle Size Optimization
  // Enable production optimizations
  compiler: {
    // Remove console.log in production (except errors/warnings)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Enable experimental optimizations
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: ['@heroicons/react', 'lodash'],
  },

  // Compress responses
  compress: true,

  // Generate standalone output for Docker (already in use)
  output: 'standalone',
};

module.exports = nextConfig;
