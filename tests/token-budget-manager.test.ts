/**
 * Token Budget Manager Tests
 * Comprehensive test suite for lib/token-budget-manager.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenBudgetManager } from '@/lib/token-budget-manager';

describe('TokenBudgetManager', () => {
  let manager: TokenBudgetManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new TokenBudgetManager('deepseek-chat');
  });

  describe('constructor', () => {
    it('should create manager for deepseek-chat', () => {
      const mgr = new TokenBudgetManager('deepseek-chat');
      expect(mgr).toBeDefined();
    });

    it('should create manager for deepseek-coder', () => {
      const mgr = new TokenBudgetManager('deepseek-coder');
      expect(mgr).toBeDefined();
    });

    it('should create manager for deepseek-reasoner', () => {
      const mgr = new TokenBudgetManager('deepseek-reasoner');
      expect(mgr).toBeDefined();
    });

    it('should use default config for unknown model', () => {
      const mgr = new TokenBudgetManager('unknown-model');
      expect(mgr).toBeDefined();
    });
  });

  describe('calculateBudget', () => {
    it('should calculate budget for simple messages', () => {
      const messages = [
        { role: 'user', content: 'Hello, how are you?' },
      ];

      const result = manager.calculateBudget(messages);

      expect(result).toBeDefined();
      expect(result.inputTokens).toBeGreaterThan(0);
      expect(result.maxTokens).toBeGreaterThan(0);
      expect(result.strategy).toBeDefined();
    });

    it('should handle long input messages', () => {
      const longContent = 'a'.repeat(100000);
      const messages = [
        { role: 'user', content: longContent },
      ];

      const result = manager.calculateBudget(messages);

      expect(result.inputTokens).toBeGreaterThan(0);
      expect(result.needsTruncation).toBeDefined();
    });

    it('should respect requested max tokens', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
      ];

      const result = manager.calculateBudget(messages, 1000);

      expect(result.maxTokens).toBeLessThanOrEqual(8192);
    });

    it('should handle multiple messages', () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];

      const result = manager.calculateBudget(messages);

      expect(result.inputTokens).toBeGreaterThan(0);
    });

    it('should handle Chinese text', () => {
      const messages = [
        { role: 'user', content: '你好，请帮我写一段代码' },
      ];

      const result = manager.calculateBudget(messages);

      expect(result.inputTokens).toBeGreaterThan(0);
    });

    it('should indicate continuation capability', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
      ];

      const result = manager.calculateBudget(messages);

      expect(typeof result.canContinue).toBe('boolean');
    });
  });

  describe('getModelConfig', () => {
    it('should return config for deepseek-chat', () => {
      const mgr = new TokenBudgetManager('deepseek-chat');
      const config = mgr.getModelConfig();

      expect(config.contextWindow).toBe(128000);
      expect(config.maxOutputTokens).toBe(8192);
    });

    it('should return config for deepseek-reasoner', () => {
      const mgr = new TokenBudgetManager('deepseek-reasoner');
      const config = mgr.getModelConfig();

      expect(config.contextWindow).toBe(128000);
      expect(config.minOutputTokens).toBe(2048);
    });
  });

});

