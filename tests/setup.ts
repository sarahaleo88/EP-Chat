/**
 * 测试环境设置文件
 * 配置全局测试环境和模拟
 */

import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

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
});

// 模拟 clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
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
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});
