/**
 * Utility Functions Tests
 * Comprehensive test suite for utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  delay,
  debounce,
  throttle,
  copyToClipboard,
  formatFileSize,
  generateId,
  getRequiredEnv,
  safeJsonParse,
  getI18nText,
  isMobile,
  getPreferredLanguage,
  estimateTokens,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden');
      expect(result).toBe('base conditional');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).toBe('base valid');
    });

    it('should handle empty strings', () => {
      const result = cn('base', '', 'valid');
      expect(result).toBe('base valid');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('should handle small values', () => {
      expect(formatFileSize(512)).toBe('512 Bytes');
    });
  });

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some timing variance
    });

    it('should handle zero delay', async () => {
      const start = Date.now();
      await delay(0);
      const end = Date.now();
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('copyToClipboard', () => {
    let mockClipboard: any;

    beforeEach(() => {
      // Create a fresh mock clipboard for each test
      mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };

      // Use defineProperty to properly mock the clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true,
        configurable: true,
      });

      // Mock window.isSecureContext
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true,
        configurable: true,
      });
    });

    it('should copy text using clipboard API', async () => {
      const result = await copyToClipboard('test text');
      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
    });

    it('should handle clipboard API failure', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Permission denied'));
      const result = await copyToClipboard('test text');
      expect(result).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1.length).toBe(8); // Default length
    });

    it('should generate IDs with custom length', () => {
      const id = generateId(10);
      expect(id.length).toBe(10);
    });

    it('should generate IDs with different lengths', () => {
      const shortId = generateId(4);
      const longId = generateId(16);
      expect(shortId.length).toBe(4);
      expect(longId.length).toBe(16);
    });

    it('should generate alphanumeric IDs', () => {
      const id = generateId(20);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      debouncedFn();
      vi.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throttle function calls', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to throttled function', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('arg1', 'arg2');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('getRequiredEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return environment variable value', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getRequiredEnv('TEST_VAR')).toBe('test-value');
    });

    it('should throw error for missing environment variable', () => {
      delete process.env.TEST_VAR;
      expect(() => getRequiredEnv('TEST_VAR')).toThrow('缺少必需的环境变量: TEST_VAR');
    });

    it('should throw error for empty environment variable', () => {
      process.env.TEST_VAR = '';
      expect(() => getRequiredEnv('TEST_VAR')).toThrow('缺少必需的环境变量: TEST_VAR');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const json = '{"key": "value", "number": 42}';
      const result = safeJsonParse(json, {});
      expect(result).toEqual({ key: 'value', number: 42 });
    });

    it('should return fallback for invalid JSON', () => {
      const invalidJson = '{"key": invalid}';
      const fallback = { default: true };
      const result = safeJsonParse(invalidJson, fallback);
      expect(result).toBe(fallback);
    });

    it('should handle empty string', () => {
      const result = safeJsonParse('', null);
      expect(result).toBe(null);
    });

    it('should handle different fallback types', () => {
      expect(safeJsonParse('invalid', [])).toEqual([]);
      expect(safeJsonParse('invalid', 'default')).toBe('default');
      expect(safeJsonParse('invalid', 42)).toBe(42);
    });
  });

  describe('getI18nText', () => {
    const mockTexts = {
      en: {
        greeting: 'Hello',
        farewell: 'Goodbye',
      },
      zh: {
        greeting: '你好',
        farewell: '再见',
      },
    };

    it('should return text in requested language', () => {
      expect(getI18nText(mockTexts, 'zh', 'greeting')).toBe('你好');
      expect(getI18nText(mockTexts, 'en', 'greeting')).toBe('Hello');
    });

    it('should fallback to English when key not found in requested language', () => {
      const partialTexts = {
        en: { greeting: 'Hello' },
        zh: {},
      };
      expect(getI18nText(partialTexts, 'zh', 'greeting')).toBe('Hello');
    });

    it('should return fallback when key not found in any language', () => {
      expect(getI18nText(mockTexts, 'en', 'missing')).toBe('missing');
      expect(getI18nText(mockTexts, 'en', 'missing', 'default')).toBe('default');
    });
  });

  describe('isMobile', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should return false in server environment', () => {
      delete (global as any).window;
      expect(isMobile()).toBe(false);
    });

    it('should return true for mobile width', () => {
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 600 },
        writable: true,
        configurable: true,
      });
      expect(isMobile()).toBe(true);
    });

    it('should return false for desktop width', () => {
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 1024 },
        writable: true,
        configurable: true,
      });
      expect(isMobile()).toBe(false);
    });
  });

  describe('getPreferredLanguage', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      global.navigator = originalNavigator;
    });

    it('should return "en" in server environment', () => {
      delete (global as any).window;
      expect(getPreferredLanguage()).toBe('en');
    });

    it('should return "zh" for Chinese locales', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'zh-CN' },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      expect(getPreferredLanguage()).toBe('zh');
    });

    it('should return "en" for English locales', () => {
      Object.defineProperty(global, 'navigator', {
        value: { language: 'en-US' },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      });
      expect(getPreferredLanguage()).toBe('en');
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for English text', () => {
      const text = 'This is a test'; // 4 words, ~16 chars
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    it('should estimate tokens for Chinese text', () => {
      const text = '这是一个测试'; // 5 Chinese characters
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    it('should estimate tokens for mixed text', () => {
      const text = 'Hello 世界'; // Mixed English and Chinese
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
    });

    it('should handle empty text', () => {
      expect(estimateTokens('')).toBe(0);
    });
  });
});
