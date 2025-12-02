/**
 * API Generate Route Tests
 * Comprehensive test suite for app/api/generate/route.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/deepseek', () => ({
  getDeepSeekClient: vi.fn(() => ({
    sendPrompt: vi.fn().mockResolvedValue(new Response('{}', { status: 200 })),
    handleStreamResponse: vi.fn((response, onChunk, onComplete) => {
      onChunk('Test response');
      onComplete();
    }),
    getNonStreamResponse: vi.fn().mockResolvedValue('Test response content'),
  })),
}));

vi.mock('@/lib/model-capabilities', () => ({
  getCapabilityManager: vi.fn(() => ({
    getCapabilities: vi.fn().mockResolvedValue({
      modelName: 'deepseek-chat',
      contextWindow: 128000,
      maxOutputPerRequest: 8192,
      pricing: { inputPer1K: 0.001, outputPer1K: 0.002, reasoningPer1K: 0.003 },
    }),
    calculateOptimalMaxTokens: vi.fn().mockReturnValue(4096),
  })),
}));

vi.mock('@/lib/budget-guardian', () => ({
  getBudgetGuardian: vi.fn(() => ({
    preflightCheck: vi.fn().mockResolvedValue({
      allowed: true,
      costBreakdown: { estimated: { totalCost: 0.01 } },
    }),
    recordUsage: vi.fn(),
  })),
}));

vi.mock('@/lib/session-manager', () => ({
  getApiKeyFromSession: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/csrf', () => ({
  validateCSRFToken: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/error-handler', () => ({
  formatUserFriendlyError: vi.fn((error) => ({
    title: 'Error',
    message: error?.message || 'Unknown error',
    suggestion: 'Please try again',
    retryable: true,
  })),
}));

vi.mock('@/lib/utils', () => ({
  estimateTokens: vi.fn().mockReturnValue(100),
}));

describe('API Generate Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, DEEPSEEK_API_KEY: 'sk-test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST handler', () => {
    it('should return 400 for missing prompt', async () => {
      const { POST } = await import('@/app/api/generate/route');
      
      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({ model: 'deepseek-chat' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('提示');
    });

    it('should return 400 for invalid temperature', async () => {
      const { POST } = await import('@/app/api/generate/route');
      
      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Hello',
          model: 'deepseek-chat',
          temperature: 5, // Invalid: > 2
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('温度');
    });

    it('should return 400 for invalid maxTokens', async () => {
      const { POST } = await import('@/app/api/generate/route');
      
      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Hello',
          model: 'deepseek-chat',
          maxTokens: 10000, // Invalid: > 8192
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('token');
    });

    it('should return 400 for prompt too long', async () => {
      const { POST } = await import('@/app/api/generate/route');
      
      const longPrompt = 'a'.repeat(200001);
      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: longPrompt,
          model: 'deepseek-chat',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('过长');
    });
  });

  describe('OPTIONS handler', () => {
    it('should return CORS headers', async () => {
      const { OPTIONS } = await import('@/app/api/generate/route');
      
      const response = await OPTIONS();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });
});

