/**
 * EP 应用根布局组件
 * 提供全局样式、字体和元数据配置
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/globals.scss'; // 全局样式

// 字体配置
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// 元数据配置
export const metadata: Metadata = {
  title: {
    default: 'EP - Enhanced Prompt | 增强提示生成器',
    template: '%s | EP - Enhanced Prompt',
  },
  description:
    '超轻量级、超快速的提示增强 Web 应用，帮助 Claude Code 一次性生成完整项目',
  keywords: [
    'prompt',
    'enhancement',
    'claude',
    'deepseek',
    'code generation',
    'web development',
    '提示增强',
    '代码生成',
  ],
  authors: [{ name: 'EP Team' }],
  creator: 'EP Team',
  publisher: 'EP Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ep-enhanced-prompt.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'zh-CN': '/zh',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://ep-enhanced-prompt.vercel.app',
    title: 'EP - Enhanced Prompt | 增强提示生成器',
    description: '超轻量级、超快速的提示增强 Web 应用',
    siteName: 'EP - Enhanced Prompt',
    images: [
      {
        url: '/shamrock-logo.png',
        width: 1200,
        height: 630,
        alt: 'EP - Enhanced Prompt',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EP - Enhanced Prompt | 增强提示生成器',
    description: '超轻量级、超快速的提示增强 Web 应用',
    images: ['/shamrock-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/shamrock-icon.svg', type: 'image/svg+xml', sizes: '32x32' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [
      { url: '/shamrock-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
};

// Viewport 配置（Next.js 15 要求）
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#22c55e' },
    { media: '(prefers-color-scheme: dark)', color: '#4ade80' },
  ],
};

/**
 * 根布局组件
 * @param children - 子组件
 * @returns JSX 元素
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <head>
        {/* Favicon 链接 */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" href="/shamrock-icon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/shamrock-icon.svg" />

        {/* 预加载关键资源 */}
        <link rel="preload" href="/shamrock-logo.png" as="image" />
        <link rel="dns-prefetch" href="https://api.deepseek.com" />

        {/* 安全策略 */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="origin-when-cross-origin" />

        {/* PWA 支持 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="application-name" content="EP Chat" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EP Chat" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#22c55e" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/icons/icon-192.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="512x512"
          href="/icons/icon-512.png"
        />

        {/* 性能优化 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* 跳过导航链接（无障碍访问） */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-shamrock-500 text-white px-4 py-2 rounded-lg z-50"
        >
          跳转到主要内容
        </a>

        {/* 主要内容区域 - 使用现代主题系统 */}
        <div id="main-content" className="light">
          {children}
        </div>

        {/* 全局脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 主题检测和设置
              (function() {
                const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
              
              // 性能监控 (仅开发环境)
              if (typeof window !== 'undefined' && 'performance' in window && process.env.NODE_ENV === 'development') {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData && perfData.loadEventEnd > 0) {
                      if (process.env.NODE_ENV === 'development') {

                      }
                    }
                  }, 0);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
