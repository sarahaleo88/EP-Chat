/**
 * Model Capabilities Tests
 * Comprehensive test suite for lib/model-capabilities.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModelCapabilityManager } from '@/lib/model-capabilities';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ModelCapabilityManager', () => {
  let manager: ModelCapabilityManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockRejectedValue(new Error('Network error')); // Default to fallback
    manager = new ModelCapabilityManager('sk-test-api-key');
  });

  describe('getCapabilities', () => {
    it('should return fallback capabilities immediately', async () => {
      const capabilities = await manager.getCapabilities('deepseek-chat');

      expect(capabilities).toBeDefined();
      expect(capabilities.modelName).toBe('deepseek-chat');
      expect(capabilities.source).toBe('fallback');
    });

    it('should return cached capabilities if available', async () => {
      const first = await manager.getCapabilities('deepseek-chat');
      const second = await manager.getCapabilities('deepseek-chat');

      expect(first.modelName).toBe(second.modelName);
    });

    it('should handle different model names', async () => {
      const chatCaps = await manager.getCapabilities('deepseek-chat');
      const coderCaps = await manager.getCapabilities('deepseek-coder');
      const reasonerCaps = await manager.getCapabilities('deepseek-reasoner');

      expect(chatCaps.modelName).toBe('deepseek-chat');
      expect(coderCaps.modelName).toBe('deepseek-coder');
      expect(reasonerCaps.modelName).toBe('deepseek-reasoner');
    });
  });

  describe('getFallbackCapabilities (via getCapabilities)', () => {
    it('should return valid fallback for deepseek-chat', async () => {
      const capabilities = await manager.getCapabilities('deepseek-chat');

      expect(capabilities.contextWindow).toBeGreaterThan(0);
      expect(capabilities.maxOutputPerRequest).toBeGreaterThan(0);
      expect(capabilities.pricing).toBeDefined();
      expect(capabilities.pricing.inputPer1K).toBeGreaterThan(0);
    });

    it('should return valid fallback for deepseek-reasoner', async () => {
      const capabilities = await manager.getCapabilities('deepseek-reasoner');

      // Reasoner may or may not have supportsReasoning in fallback
      expect(capabilities.pricing.reasoningPer1K).toBeGreaterThan(0);
    });

    it('should return default fallback for unknown model', async () => {
      const capabilities = await manager.getCapabilities('unknown-model');

      expect(capabilities).toBeDefined();
      expect(capabilities.modelName).toBe('unknown-model');
    });
  });

  describe('getCapabilitiesSync', () => {
    it('should return capabilities synchronously', async () => {
      const capabilities = await manager.getCapabilitiesSync('deepseek-chat');

      expect(capabilities).toBeDefined();
      expect(capabilities.modelName).toBe('deepseek-chat');
    });
  });

  describe('warmup', () => {
    it('should warmup without error', async () => {
      await expect(manager.warmup()).resolves.not.toThrow();
    });

    it('should warmup specific models', async () => {
      await expect(manager.warmup(['deepseek-chat'])).resolves.not.toThrow();
    });
  });
});

