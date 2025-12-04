/**
 * 测试环境设置文件
 * 配置全局测试环境和模拟
 */

import '@testing-library/jest-dom';
import { vi, afterEach, beforeEach } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';
import { setupTemplateMocks, resetTemplateMocks } from './mocks/templates';

// Set up global variables for Node.js compatibility
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// 模拟环境变量
process.env.DEEPSEEK_API_KEY = 'test-api-key';
(process.env as any).NODE_ENV = 'test';

// 模拟 Next.js 路由
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// 模拟 fetch API
global.fetch = vi.fn();

// 模拟 ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟 IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// 模拟 sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
});

// Enhanced clipboard API mock with proper error handling
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
  readText: vi.fn().mockResolvedValue(''),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
  configurable: true,
});

// Mock crypto API for CSRF token generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    randomUUID: vi.fn().mockImplementation(() =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      })
    ),
  },
  writable: true,
  configurable: true,
});

// 模拟 console 方法（避免测试输出污染）
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// 全局测试工具函数
(global as any).createMockTemplate = () => ({
  schemaVersion: '1.0.0',
  title: 'Test Template',
  scenario: 'code' as const,
  lang: 'zh' as const,
  mode: 'full' as const,
  spec: {
    tech: {
      language: 'TypeScript',
      framework: 'N/A',
    },
    features: ['Feature 1', 'Feature 2'],
    io: {
      input: 'string',
      output: 'object',
    },
    codeRules: ['Rule 1', 'Rule 2'],
  },
});

(global as any).createMockPromptSpec = () => ({
  scenario: 'code' as const,
  lang: 'zh' as const,
  mode: 'full' as const,
  template: (global as any).createMockTemplate(),
  userInput: 'Test user input',
  model: 'deepseek-chat' as const,
});

// 清理函数
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// 全局错误处理
process.on('unhandledRejection', reason => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled Rejection:', reason);
  }
});

process.on('uncaughtException', error => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Uncaught Exception:', error);
  }
});

// Setup and teardown for enhanced mocking
beforeEach(() => {
  vi.clearAllMocks();
  setupTemplateMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetTemplateMocks();
});
