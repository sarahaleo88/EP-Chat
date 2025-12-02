/**
 * DeepSeek API Client Tests
 * Comprehensive test suite for lib/deepseek.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DeepSeekClient, getDeepSeekClient, sendPrompt, sendPromptText } from '@/lib/deepseek';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variable
const originalEnv = process.env;

describe('DeepSeekClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, DEEPSEEK_API_KEY: 'sk-test-api-key-12345' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor and API key validation', () => {
    it('should create client with valid API key', () => {
      const client = new DeepSeekClient('sk-valid-key');
      expect(client).toBeInstanceOf(DeepSeekClient);
    });

    it('should throw error for empty API key when no env var', () => {
      // Empty string is falsy, so it falls back to env var
      // When env var is also not set, it should throw
      process.env.DEEPSEEK_API_KEY = undefined;
      expect(() => new DeepSeekClient('')).toThrow();
    });

    it('should throw error for invalid API key format', () => {
      expect(() => new DeepSeekClient('invalid-key')).toThrow('DeepSeek API 密钥格式不正确，应以sk-开头');
    });

    it('should throw error for null API key', () => {
      process.env.DEEPSEEK_API_KEY = undefined;
      expect(() => new DeepSeekClient()).toThrow();
    });

    it('should use environment variable when no key provided', () => {
      const client = new DeepSeekClient();
      expect(client).toBeInstanceOf(DeepSeekClient);
    });
  });

  describe('sendPrompt', () => {
    it('should send prompt successfully', async () => {
      const mockResponse = new Response(JSON.stringify({ choices: [{ message: { content: 'Hello!' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const client = new DeepSeekClient('sk-test-key');
      const response = await client.sendPrompt('Hello', 'deepseek-chat', { stream: false });

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-test-key',
          }),
        })
      );
    });

    it('should validate prompt is not empty', async () => {
      const client = new DeepSeekClient('sk-test-key');
      await expect(client.sendPrompt('', 'deepseek-chat')).rejects.toThrow('提示内容无效或为空');
    });

    it('should validate prompt is not whitespace only', async () => {
      const client = new DeepSeekClient('sk-test-key');
      await expect(client.sendPrompt('   ', 'deepseek-chat')).rejects.toThrow('提示内容不能为空');
    });

    it('should validate prompt length limit', async () => {
      const client = new DeepSeekClient('sk-test-key');
      const longPrompt = 'a'.repeat(200001);
      await expect(client.sendPrompt(longPrompt, 'deepseek-chat')).rejects.toThrow('提示内容过长，请控制在200,000字符以内');
    });

    it('should validate temperature range', async () => {
      const client = new DeepSeekClient('sk-test-key');
      await expect(client.sendPrompt('Hello', 'deepseek-chat', { temperature: -1 })).rejects.toThrow('temperature参数必须在0-2之间');
      await expect(client.sendPrompt('Hello', 'deepseek-chat', { temperature: 3 })).rejects.toThrow('temperature参数必须在0-2之间');
    });

    it('should validate maxTokens range', async () => {
      const client = new DeepSeekClient('sk-test-key');
      await expect(client.sendPrompt('Hello', 'deepseek-chat', { maxTokens: 0 })).rejects.toThrow('maxTokens参数必须在1-8192之间');
      await expect(client.sendPrompt('Hello', 'deepseek-chat', { maxTokens: 10000 })).rejects.toThrow('maxTokens参数必须在1-8192之间');
    });

    it('should validate topP range', async () => {
      const client = new DeepSeekClient('sk-test-key');
      await expect(client.sendPrompt('Hello', 'deepseek-chat', { topP: -0.1 })).rejects.toThrow('topP参数必须在0-1之间');
      await expect(client.sendPrompt('Hello', 'deepseek-chat', { topP: 1.5 })).rejects.toThrow('topP参数必须在0-1之间');
    });

    it('should include system prompt when provided', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const client = new DeepSeekClient('sk-test-key');
      await client.sendPrompt('Hello', 'deepseek-chat', { systemPrompt: 'You are a helpful assistant' });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0]).toEqual({ role: 'system', content: 'You are a helpful assistant' });
    });

    it('should handle 401 error', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}', { status: 401 }));

      const client = new DeepSeekClient('sk-test-key');
      await expect(client.sendPrompt('Hello', 'deepseek-chat')).rejects.toThrow('API密钥无效，请检查配置');
    });

    it('should handle 429 error', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}', { status: 429 }));

      const client = new DeepSeekClient('sk-test-key');
      await expect(client.sendPrompt('Hello', 'deepseek-chat')).rejects.toThrow('请求过于频繁，请稍后重试');
    });

    it('should handle 402 error', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}', { status: 402 }));

      const client = new DeepSeekClient('sk-test-key');
      await expect(client.sendPrompt('Hello', 'deepseek-chat')).rejects.toThrow('API配额不足，请检查账户余额');
    });

    it('should handle 503 error', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}', { status: 503 }));

      const client = new DeepSeekClient('sk-test-key');
      await expect(client.sendPrompt('Hello', 'deepseek-chat')).rejects.toThrow('DeepSeek服务暂时不可用，请稍后重试');
    });
  });

  describe('handleStreamResponse', () => {
    it('should handle empty response body', async () => {
      const client = new DeepSeekClient('sk-test-key');
      const mockResponse = { body: null } as Response;
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await client.handleStreamResponse(mockResponse, onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: '响应体为空' }));
    });

    it('should parse stream chunks correctly', async () => {
      const client = new DeepSeekClient('sk-test-key');
      const chunks = [
        'data: {"choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
        'data: {"choices":[{"index":0,"delta":{"content":" World"},"finish_reason":null}]}\n\n',
        'data: [DONE]\n\n',
      ];

      const readableStream = new ReadableStream({
        start(controller) {
          chunks.forEach(chunk => controller.enqueue(new TextEncoder().encode(chunk)));
          controller.close();
        },
      });

      const mockResponse = { body: readableStream } as Response;
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await client.handleStreamResponse(mockResponse, onChunk, onComplete, onError);

      expect(onChunk).toHaveBeenCalledWith('Hello');
      expect(onChunk).toHaveBeenCalledWith(' World');
      expect(onComplete).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('getNonStreamResponse', () => {
    it('should extract content from response', async () => {
      const client = new DeepSeekClient('sk-test-key');
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }],
        }),
      } as unknown as Response;

      const result = await client.getNonStreamResponse(mockResponse);
      expect(result).toBe('Test response');
    });

    it('should return empty string when no content', async () => {
      const client = new DeepSeekClient('sk-test-key');
      const mockResponse = {
        json: vi.fn().mockResolvedValue({ choices: [] }),
      } as unknown as Response;

      const result = await client.getNonStreamResponse(mockResponse);
      expect(result).toBe('');
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      // Create a proper mock response with status 200 (which has ok=true)
      const mockResponse = new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const client = new DeepSeekClient('sk-test-key');
      const result = await client.validateApiKey();

      expect(result).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Invalid key'));

      const client = new DeepSeekClient('sk-test-key');
      const result = await client.validateApiKey();

      expect(result).toBe(false);
    });
  });

  describe('getModels', () => {
    it('should return model list from API', async () => {
      const mockResponse = new Response(JSON.stringify({
        data: [{ id: 'deepseek-chat' }, { id: 'deepseek-coder' }],
      }), { status: 200 });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const client = new DeepSeekClient('sk-test-key');
      const models = await client.getModels();

      expect(models).toContain('deepseek-chat');
      expect(models).toContain('deepseek-coder');
    });

    it('should return default models on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      const client = new DeepSeekClient('sk-test-key');
      const models = await client.getModels();

      expect(models).toEqual(['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner']);
    });
  });
});

describe('getDeepSeekClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, DEEPSEEK_API_KEY: 'sk-test-api-key-12345' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return cached client for same API key', () => {
    const client1 = getDeepSeekClient('sk-test-key-abc');
    const client2 = getDeepSeekClient('sk-test-key-abc');
    expect(client1).toBe(client2);
  });

  it('should return different clients for different API keys', () => {
    const client1 = getDeepSeekClient('sk-test-key-one');
    const client2 = getDeepSeekClient('sk-test-key-two');
    expect(client1).not.toBe(client2);
  });

  it('should return default client when no API key provided', () => {
    const client = getDeepSeekClient();
    expect(client).toBeInstanceOf(DeepSeekClient);
  });
});

describe('convenience functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, DEEPSEEK_API_KEY: 'sk-test-api-key-12345' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sendPrompt should use default client', async () => {
    const mockResponse = new Response('{}', { status: 200 });
    mockFetch.mockResolvedValueOnce(mockResponse);

    const response = await sendPrompt('Hello', 'deepseek-chat', { stream: false });
    expect(response.ok).toBe(true);
  });

  it('sendPromptText should return text response', async () => {
    const mockResponse = new Response(JSON.stringify({
      choices: [{ message: { content: 'Response text' } }],
    }), { status: 200 });
    mockFetch.mockResolvedValueOnce(mockResponse);

    const text = await sendPromptText('Hello', 'deepseek-chat');
    expect(text).toBe('Response text');
  });
});
