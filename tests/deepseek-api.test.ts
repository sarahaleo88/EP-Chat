/**
 * DeepSeek API Tests
 * Comprehensive test suite for lib/deepseek-api.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DeepSeekApiClient } from '@/lib/deepseek-api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DeepSeekApiClient', () => {
  let client: DeepSeekApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new DeepSeekApiClient('sk-test-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with API key', () => {
      const c = new DeepSeekApiClient('sk-test-key');
      expect(c).toBeDefined();
    });
  });

  describe('chat', () => {
    it('should send chat request successfully', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [{
          index: 0,
          message: { role: 'assistant', content: 'Hello!' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.chat([
        { role: 'user', content: 'Hello' },
      ]);

      expect(result).toBeDefined();
      expect(result.choices).toBeDefined();
    });

    it('should use default options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'deepseek-chat',
          choices: [{ index: 0, message: { role: 'assistant', content: 'Hi' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
        }),
      });

      await client.chat([{ role: 'user', content: 'Hi' }]);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('deepseek.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should accept custom options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'deepseek-coder',
          choices: [{ index: 0, message: { role: 'assistant', content: 'Code' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      });

      await client.chat(
        [{ role: 'user', content: 'Write code' }],
        'deepseek-coder',
        { temperature: 0.5, max_tokens: 1000 }
      );

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: { message: 'Invalid API key', type: 'authentication_error' },
        }),
      });

      await expect(client.chat([{ role: 'user', content: 'Hello' }]))
        .rejects.toThrow();
    });
  });
});

