/**
 * Comprehensive Browser API Mocking System
 * Provides realistic mock implementations for browser APIs
 * Following ISO/IEC 29119 testing standards
 */

import { vi } from 'vitest';

/**
 * Mock Clipboard API
 */
export const mockClipboardAPI = {
  writeText: vi.fn().mockResolvedValue(undefined),
  readText: vi.fn().mockResolvedValue('mock clipboard content'),
};

/**
 * Mock Navigator API
 */
export const mockNavigator = {
  clipboard: mockClipboardAPI,
  userAgent: 'Mozilla/5.0 (Test Environment) TestRunner/1.0',
  language: 'en-US',
  languages: ['en-US', 'en'],
  platform: 'Test',
  cookieEnabled: true,
  onLine: true,
  geolocation: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  permissions: {
    query: vi.fn().mockResolvedValue({ state: 'granted' }),
  },
  serviceWorker: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: { state: 'activated' },
      scope: '/',
      update: vi.fn(),
      unregister: vi.fn().mockResolvedValue(true),
    }),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: { state: 'activated' },
      scope: '/',
      update: vi.fn(),
      unregister: vi.fn().mockResolvedValue(true),
    }),
    controller: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
};

/**
 * Mock Window API
 */
export const mockWindow = {
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  history: {
    length: 1,
    state: null,
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    pushState: vi.fn(),
    replaceState: vi.fn(),
  },
  screen: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
    pixelDepth: 24,
  },
  innerWidth: 1920,
  innerHeight: 1080,
  outerWidth: 1920,
  outerHeight: 1080,
  devicePixelRatio: 1,
  scrollX: 0,
  scrollY: 0,
  pageXOffset: 0,
  pageYOffset: 0,
  localStorage: {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  },
  sessionStorage: {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  setTimeout: vi.fn().mockImplementation((fn, delay) => {
    return setTimeout(fn, delay);
  }),
  clearTimeout: vi.fn().mockImplementation((id) => {
    clearTimeout(id);
  }),
  setInterval: vi.fn().mockImplementation((fn, delay) => {
    return setInterval(fn, delay);
  }),
  clearInterval: vi.fn().mockImplementation((id) => {
    clearInterval(id);
  }),
  requestAnimationFrame: vi.fn().mockImplementation((fn) => {
    return setTimeout(fn, 16); // ~60fps
  }),
  cancelAnimationFrame: vi.fn(),
  fetch: vi.fn(),
  console: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
};

/**
 * Mock Document API
 */
export const mockDocument = {
  cookie: '',
  title: 'Test Document',
  URL: 'http://localhost:3000',
  domain: 'localhost',
  referrer: '',
  readyState: 'complete',
  visibilityState: 'visible',
  hidden: false,
  createElement: vi.fn().mockImplementation((tagName: string) => ({
    tagName: tagName.toUpperCase(),
    innerHTML: '',
    textContent: '',
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn().mockReturnValue(false),
      toggle: vi.fn(),
    },
    setAttribute: vi.fn(),
    getAttribute: vi.fn().mockReturnValue(null),
    removeAttribute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn().mockReturnValue(null),
    querySelectorAll: vi.fn().mockReturnValue([]),
  })),
  getElementById: vi.fn().mockReturnValue(null),
  getElementsByClassName: vi.fn().mockReturnValue([]),
  getElementsByTagName: vi.fn().mockReturnValue([]),
  querySelector: vi.fn().mockReturnValue(null),
  querySelectorAll: vi.fn().mockReturnValue([]),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  createEvent: vi.fn().mockReturnValue({
    initEvent: vi.fn(),
  }),
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn().mockReturnValue(null),
    querySelectorAll: vi.fn().mockReturnValue([]),
  },
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn().mockReturnValue(null),
    querySelectorAll: vi.fn().mockReturnValue([]),
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn().mockReturnValue(false),
      toggle: vi.fn(),
    },
  },
};

/**
 * Mock Performance API
 */
export const mockPerformance = {
  now: vi.fn().mockImplementation(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn().mockReturnValue([]),
  getEntriesByName: vi.fn().mockReturnValue([]),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  timing: {
    navigationStart: Date.now() - 1000,
    loadEventEnd: Date.now(),
    domContentLoadedEventEnd: Date.now() - 500,
  },
};

/**
 * Setup all browser API mocks
 */
export function setupBrowserAPIMocks() {
  // Setup Navigator mock
  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true,
    configurable: true,
  });

  // Setup Window mock
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
    configurable: true,
  });

  // Setup Document mock
  Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true,
    configurable: true,
  });

  // Setup Performance mock
  Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true,
    configurable: true,
  });

  // Setup additional globals
  Object.defineProperty(global, 'localStorage', {
    value: mockWindow.localStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: mockWindow.sessionStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global, 'fetch', {
    value: mockWindow.fetch,
    writable: true,
    configurable: true,
  });
}

/**
 * Reset all browser API mocks
 */
export function resetBrowserAPIMocks() {
  // Reset Navigator mocks
  mockClipboardAPI.writeText.mockClear();
  mockClipboardAPI.readText.mockClear();
  mockNavigator.serviceWorker.register.mockClear();

  // Reset Window mocks
  mockWindow.localStorage.getItem.mockClear();
  mockWindow.localStorage.setItem.mockClear();
  mockWindow.sessionStorage.getItem.mockClear();
  mockWindow.sessionStorage.setItem.mockClear();
  mockWindow.addEventListener.mockClear();
  mockWindow.fetch.mockClear();

  // Reset Document mocks
  mockDocument.createElement.mockClear();
  mockDocument.getElementById.mockClear();
  mockDocument.querySelector.mockClear();
  mockDocument.addEventListener.mockClear();

  // Reset Performance mocks
  mockPerformance.now.mockClear();
  mockPerformance.mark.mockClear();
  mockPerformance.measure.mockClear();
}

/**
 * Create specific mock scenarios for testing
 */
export const mockScenarios = {
  // Clipboard API unavailable
  noClipboardAPI: () => {
    Object.defineProperty(mockNavigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  },

  // Clipboard API fails
  clipboardAPIFails: () => {
    mockClipboardAPI.writeText.mockRejectedValue(new Error('Clipboard access denied'));
  },

  // Offline mode
  offlineMode: () => {
    Object.defineProperty(mockNavigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
  },

  // Mobile viewport
  mobileViewport: () => {
    Object.defineProperty(mockWindow, 'innerWidth', {
      value: 375,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockWindow, 'innerHeight', {
      value: 667,
      writable: true,
      configurable: true,
    });
  },

  // Service worker unavailable
  noServiceWorker: () => {
    Object.defineProperty(mockNavigator, 'serviceWorker', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  },
};
