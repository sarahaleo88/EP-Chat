/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.deepseek\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'deepseek-api-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
  ],
});

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Docker 部署配置
  output: 'standalone',
  // 实验性功能 - 包导入优化
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'date-fns'],
  },

  // Turbopack 配置 (Next.js 15+)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // 服务器外部包配置
  serverExternalPackages: ['crypto-js'],
  // 环境变量配置 - API密钥不暴露给客户端
  // env: {
  //   DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY, // 已移除：防止API密钥泄露
  // },
  // 静态资源优化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  // 压缩配置
  compress: true,
  // 生产环境优化
  productionBrowserSourceMaps: false,
  // Advanced Webpack optimization configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production environment optimizations
    if (!dev && !isServer) {
      // Advanced code splitting optimization
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // React core libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true,
            enforce: true,
          },
          // UI libraries (Heroicons, Headless UI)
          ui: {
            test: /[\\/]node_modules[\\/](@heroicons|@headlessui)[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true,
          },
          // Utility libraries
          utils: {
            test: /[\\/]node_modules[\\/](crypto-js|zod|clsx|tailwind-merge)[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Other vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          // 公共代码
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // 压缩优化
      config.optimization.minimize = true;

      // 模块连接优化
      config.optimization.concatenateModules = true;

      // 副作用优化
      config.optimization.sideEffects = false;

      // Tree shaking 优化
      config.optimization.usedExports = true;

      // 运行时优化
      config.optimization.runtimeChunk = {
        name: 'runtime',
      };

      // 模块 ID 优化
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';

      // Advanced tree shaking for specific libraries
      config.resolve.alias = {
        ...config.resolve.alias,
        // Use ES modules for better tree shaking
        'crypto-js': 'crypto-js/index.js',
      };

      // Exclude large dependencies from client bundle
      if (!isServer) {
        config.externals = config.externals || [];
        // Note: Be careful with externals in Next.js as they can break functionality
      }

      // Advanced minification options
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                ...minimizer.options.terserOptions.compress,
                drop_console: true, // Remove console.log in production
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
              },
              mangle: {
                ...minimizer.options.terserOptions.mangle,
                safari10: true,
              },
            };
          }
        });
      }

      // 压缩器配置
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                ...minimizer.options.terserOptions?.compress,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
              },
              mangle: {
                safari10: true,
              },
            };
          }
        });
      }
    }

    // 别名配置
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };

    return config;
  },
  // 重定向配置
  async redirects() {
    return [];
  },
  // 安全头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Strict script policy - no unsafe-inline in production
              process.env.NODE_ENV === 'production'
                ? "script-src 'self' 'nonce-{NONCE_PLACEHOLDER}'"
                : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.deepseek.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests"
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
