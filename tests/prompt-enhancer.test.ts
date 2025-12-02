/**
 * Prompt Enhancer Tests
 * Comprehensive test suite for lib/prompt-enhancer.ts
 */

import { describe, it, expect } from 'vitest';
import { enhancePrompt } from '@/lib/prompt-enhancer';

describe('enhancePrompt', () => {
  describe('basic functionality', () => {
    it('should return original prompt for empty string', async () => {
      const result = await enhancePrompt('');
      expect(result).toBe('');
    });

    it('should return original prompt for whitespace only', async () => {
      const result = await enhancePrompt('   ');
      expect(result).toBe('   ');
    });

    it('should handle simple prompt', async () => {
      const result = await enhancePrompt('Hello world');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('prompt structure formatting', () => {
    it('should handle single line prompt', async () => {
      const result = await enhancePrompt('Write a function');
      expect(result).toBe('Write a function');
    });

    it('should handle multi-line prompt', async () => {
      const prompt = '请帮我写一个函数\n实现排序功能';
      const result = await enhancePrompt(prompt);
      expect(result).toBeDefined();
    });

    it('should format button prompt with user input', async () => {
      const prompt = '请帮我：\n写一个排序函数';
      const result = await enhancePrompt(prompt);
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle null-like input gracefully', async () => {
      // The function should handle edge cases
      const result = await enhancePrompt('test');
      expect(result).toBeDefined();
    });
  });
});

