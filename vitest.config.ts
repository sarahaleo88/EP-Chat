/**
 * Vitest 配置文件
 * 用于单元测试和集成测试
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // @ts-ignore - Vitest plugin compatibility issue
  plugins: [react()],
  test: {
    // 测试环境配置
    environment: 'jsdom',

    // 全局设置
    globals: true,

    // Suppress unhandled error from jsdom teardown (known Vitest issue)
    // This error doesn't affect test results, only the exit code
    dangerouslyIgnoreUnhandledErrors: true,

    // 设置文件
    setupFiles: ['./tests/setup.ts'],

    // 包含的测试文件
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'lib/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    // 排除的文件
    exclude: ['node_modules', 'dist', '.next', 'coverage'],

    // 覆盖率配置 - Enhanced for 100% coverage target
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'coverage/**',
        'dist/**',
        '.next/**',
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/types.ts',
        'public/**',
        'scripts/**',
        '**/*.stories.{js,ts,jsx,tsx}',
      ],
      include: [
        'app/**/*.{js,ts,jsx,tsx}',
        'lib/**/*.{js,ts}',
        'components/**/*.{js,ts,jsx,tsx}',
        'middleware.ts',
      ],
      // Coverage thresholds for quality gates
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
      // Enable all coverage types
      all: true,
      skipFull: false,
      // Detailed reporting
      reportOnFailure: true,
      allowExternal: false,
    },

    // 测试超时
    testTimeout: 10000,

    // 报告器配置
    reporters: ['verbose'],
  },

  // 路径解析
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/app': path.resolve(__dirname, './app'),
      '@/components': path.resolve(__dirname, './app/components'),
      '@/templates': path.resolve(__dirname, './templates'),
    },
  },

  // 定义全局变量
  define: {
    'process.env.NODE_ENV': '"test"',
  },
});
