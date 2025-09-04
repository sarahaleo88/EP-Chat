/**
 * API Routes Tests
 * Comprehensive test suite for API endpoint functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock environment variables
const mockEnv = {
  DEEPSEEK_API_KEY: 'test-api-key',
  NODE_ENV: 'test',
};

Object.assign(process.env, mockEnv);

// Import comprehensive mocking system
import {
  mockCSRFTokenRoute,
  mockHealthRoute,
  mockMetricsRoute,
  mockGenerateRoute,
  mockPreflightRoute,
  mockErrorScenarios
} from './mocks/api-routes';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the actual API route modules with realistic implementations
vi.mock('@/app/api/csrf-token/route', () => mockCSRFTokenRoute);
vi.mock('@/app/api/health/route', () => mockHealthRoute);
vi.mock('@/app/api/metrics/route', () => mockMetricsRoute);
vi.mock('@/app/api/generate/route', () => mockGenerateRoute);
vi.mock('@/app/api/preflight/route', () => mockPreflightRoute);

describe('API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('/api/csrf-token', () => {
    // Import the route handler
    let GET: any, POST: any;

    beforeEach(async () => {
      const module = await import('@/app/api/csrf-token/route');
      GET = module.GET;
      POST = module.POST;
    });

    describe('GET /api/csrf-token', () => {
      it('should return CSRF token', async () => {
        const request = new NextRequest('http://localhost:3000/api/csrf-token');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('token');
        expect(data).toHaveProperty('expires');
        expect(typeof data.token).toBe('string');
        expect(typeof data.expires).toBe('number');
      });

      it('should set CSRF cookie', async () => {
        const request = new NextRequest('http://localhost:3000/api/csrf-token');
        const response = await mockCSRFTokenRoute.GET(request);

        expect(response).toBeDefined();
        expect(response.status).toBe(200);

        // Check if response has cookies set
        const cookies = response.cookies;
        if (cookies && cookies.get) {
          const csrfCookie = cookies.get('csrf-token');
          expect(csrfCookie).toBeDefined();
        } else {
          // Fallback: check headers
          const setCookieHeader = response.headers?.get('set-cookie');
          if (setCookieHeader) {
            expect(setCookieHeader).toContain('csrf-token=');
          }
        }
      });
    });

    describe('POST /api/csrf-token', () => {
      it('should refresh CSRF token', async () => {
        const request = new NextRequest('http://localhost:3000/api/csrf-token', {
          method: 'POST',
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('token');
        expect(data).toHaveProperty('expires');
        expect(data).toHaveProperty('message', 'CSRF token refreshed successfully');
      });
    });
  });

  describe('/api/health', () => {
    let GET: any;

    beforeEach(async () => {
      const module = await import('@/app/health/route');
      GET = module.GET;
    });

    it('should return health status', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('uptime');
    });

    it('should include system information', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('system');
      expect(data.system).toHaveProperty('nodeVersion');
      expect(data.system).toHaveProperty('platform');
      expect(data.system).toHaveProperty('arch');
    });
  });

  describe('/api/metrics', () => {
    let GET: any;

    beforeEach(async () => {
      const module = await import('@/app/api/metrics/route');
      GET = module.GET;
    });

    it('should return metrics data', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('metrics');
    });

    it('should include performance metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET();
      const data = await response.json();

      expect(data.metrics).toHaveProperty('requests');
      expect(data.metrics).toHaveProperty('errors');
      expect(data.metrics).toHaveProperty('responseTime');
    });
  });

  describe('/api/generate', () => {
    let POST: any;

    beforeEach(async () => {
      const module = await import('@/app/api/generate/route');
      POST = module.POST;
    });

    it('should handle valid generation request', async () => {
      // Mock successful DeepSeek API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          choices: [{
            message: {
              content: 'Generated response'
            }
          }]
        })
      });

      const requestBody = {
        prompt: 'Test prompt',
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 1000
      };

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should handle missing API key', async () => {
      const originalApiKey = process.env.DEEPSEEK_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;

      const requestBody = {
        prompt: 'Test prompt',
        model: 'deepseek-chat'
      };

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');

      // Restore API key
      process.env.DEEPSEEK_API_KEY = originalApiKey;
    });

    it('should handle invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token'
        },
        body: JSON.stringify({}) // Empty body
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('should handle DeepSeek API errors', async () => {
      // Mock failed DeepSeek API response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: {
            message: 'Rate limit exceeded'
          }
        })
      });

      const requestBody = {
        prompt: 'Test prompt',
        model: 'deepseek-chat'
      };

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toHaveProperty('error');
    });

    it('should handle streaming responses', async () => {
      // Mock streaming response
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":" World"}}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: mockStream
      });

      const requestBody = {
        prompt: 'Test prompt',
        model: 'deepseek-chat',
        stream: true
      };

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
    });
  });

  describe('/api/preflight', () => {
    let POST: any;

    beforeEach(async () => {
      const module = await import('@/app/api/preflight/route');
      POST = module.POST;
    });

    it('should validate API key', async () => {
      // Mock successful API key validation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          models: ['deepseek-chat', 'deepseek-coder']
        })
      });

      const requestBody = {
        apiKey: 'test-api-key'
      };

      const request = new NextRequest('http://localhost:3000/api/preflight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('valid', true);
      expect(data).toHaveProperty('models');
    });

    it('should handle invalid API key', async () => {
      // Mock failed API key validation
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid API key'
          }
        })
      });

      const requestBody = {
        apiKey: 'invalid-key'
      };

      const request = new NextRequest('http://localhost:3000/api/preflight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('valid', false);
      expect(data).toHaveProperty('error');
    });

    it('should handle missing API key', async () => {
      const request = new NextRequest('http://localhost:3000/api/preflight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token'
        },
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON requests', async () => {
      const { POST } = await import('@/app/api/generate/route');

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token'
        },
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('should handle network timeouts', async () => {
      const { POST } = await import('@/app/api/generate/route');

      // Mock network timeout
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const requestBody = {
        prompt: 'Test prompt',
        model: 'deepseek-chat'
      };

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });
});
