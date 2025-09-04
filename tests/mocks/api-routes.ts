/**
 * Comprehensive API Route Mocking System
 * Provides realistic mock implementations for all API endpoints
 * Following ISO/IEC 29119 testing standards
 */

import { NextRequest, NextResponse } from 'next/server';
import { vi } from 'vitest';

/**
 * Mock CSRF Token API Route
 */
export const mockCSRFTokenRoute = {
  GET: vi.fn().mockImplementation(async (request?: NextRequest) => {
    const token = 'mock-csrf-token-' + Date.now();
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    const response = NextResponse.json({
      token,
      expires,
      success: true,
    });
    
    // Set CSRF cookie
    response.cookies.set('csrf-token', `${token}:${expires}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });
    
    return response;
  }),
  
  POST: vi.fn().mockImplementation(async (request: NextRequest) => {
    const token = 'refreshed-csrf-token-' + Date.now();
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    const response = NextResponse.json({
      token,
      expires,
      success: true,
      refreshed: true,
    });
    
    // Set refreshed CSRF cookie
    response.cookies.set('csrf-token', `${token}:${expires}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });
    
    return response;
  }),
};

/**
 * Mock Health API Route
 */
export const mockHealthRoute = {
  GET: vi.fn().mockImplementation(async (request?: NextRequest) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      responseTime: '5ms',
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: 128,
          total: 512,
          external: 10,
        },
        cpu: {
          loadAverage: [0.1, 0.2, 0.3],
        },
      },
      checks: [
        {
          name: 'storage',
          status: 'healthy',
          responseTime: 2,
          message: 'File system accessible',
        },
        {
          name: 'external_apis',
          status: 'healthy',
          responseTime: 3,
          message: 'API configuration valid',
        },
        {
          name: 'memory',
          status: 'healthy',
          message: 'Memory usage: 128MB (25%)',
        },
        {
          name: 'environment',
          status: 'healthy',
          message: 'All environment variables configured',
        },
      ],
      environment: {
        nodeEnv: 'test',
        timezone: 'UTC',
      },
    };
    
    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }),
};

/**
 * Mock Metrics API Route
 */
export const mockMetricsRoute = {
  GET: vi.fn().mockImplementation(async (request?: NextRequest) => {
    const metricsData = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: '3ms',
      metrics: {
        requests: {
          total: 150,
          successful: 145,
          failed: 5,
          byMethod: { GET: 100, POST: 40, PUT: 8, DELETE: 2 },
          byPath: { '/api/generate': 80, '/api/health': 40, '/api/metrics': 30 },
        },
        errors: {
          total: 5,
          byType: { 'validation_error': 3, 'network_error': 2 },
          recent: [],
        },
        responseTime: {
          average: 85,
          p50: 75,
          p95: 200,
          p99: 350,
          samples: [50, 75, 85, 120, 200],
        },
        security: {
          csrfTokensGenerated: 75,
          csrfTokensValidated: 72,
          csrfTokensRejected: 3,
          securityHeadersApplied: 150,
        },
        performance: {
          bundleSize: '50.0 kB',
          buildTime: '1000ms',
          memoryUsage: {
            current: 128,
            peak: 256,
            average: 180,
          },
        },
      },
      system: {
        memory: {
          rss: 134217728,
          heapTotal: 67108864,
          heapUsed: 33554432,
          external: 10485760,
          arrayBuffers: 5242880,
        },
        platform: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      },
    };
    
    return NextResponse.json(metricsData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }),
};

/**
 * Mock Generate API Route
 */
export const mockGenerateRoute = {
  POST: vi.fn().mockImplementation(async (request: NextRequest) => {
    try {
      const body = await request.json();
      
      // Validate API key
      const apiKey = request.headers.get('authorization')?.replace('Bearer ', '') || 
                    process.env.DEEPSEEK_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key is required', code: 'MISSING_API_KEY' },
          { status: 500 }
        );
      }
      
      if (apiKey === 'invalid-key') {
        return NextResponse.json(
          { error: 'Invalid API key', code: 'INVALID_API_KEY' },
          { status: 401 }
        );
      }
      
      // Validate request body
      if (!body.messages || !Array.isArray(body.messages)) {
        return NextResponse.json(
          { error: 'Invalid request body', code: 'INVALID_REQUEST' },
          { status: 400 }
        );
      }
      
      // Simulate rate limiting
      if (body.messages[0]?.content?.includes('rate-limit-test')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
          { status: 429 }
        );
      }
      
      // Handle streaming responses
      if (body.stream === true) {
        return new NextResponse('data: {"choices":[{"delta":{"content":"Mock response"}}]}\n\n', {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
      
      // Regular response
      const response = {
        id: 'mock-response-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: body.model || 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a mock response for testing purposes.',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      };
      
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  }),
};

/**
 * Mock Preflight API Route
 */
export const mockPreflightRoute = {
  POST: vi.fn().mockImplementation(async (request: NextRequest) => {
    try {
      const body = await request.json();
      
      if (!body.apiKey) {
        return NextResponse.json(
          { 
            valid: false, 
            error: 'API key is required',
            code: 'MISSING_API_KEY'
          },
          { status: 400 }
        );
      }
      
      if (body.apiKey === 'invalid-key') {
        return NextResponse.json({
          valid: false,
          error: 'Invalid API key format or unauthorized',
          code: 'INVALID_API_KEY',
          details: 'The provided API key is not valid',
        }, { status: 200 });
      }
      
      // Valid API key response
      return NextResponse.json({
        valid: true,
        message: 'API key is valid',
        details: {
          keyType: 'production',
          permissions: ['chat.completions'],
          rateLimit: {
            requestsPerMinute: 60,
            tokensPerMinute: 100000,
          },
        },
      }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid request format',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      );
    }
  }),
};

/**
 * Mock Error Scenarios for Testing
 */
export const mockErrorScenarios = {
  malformedJson: vi.fn().mockImplementation(async (request: NextRequest) => {
    return NextResponse.json(
      { error: 'Invalid JSON format', code: 'MALFORMED_JSON' },
      { status: 400 }
    );
  }),
  
  networkTimeout: vi.fn().mockImplementation(async (request: NextRequest) => {
    return NextResponse.json(
      { error: 'Request timeout', code: 'TIMEOUT' },
      { status: 500 }
    );
  }),
};

/**
 * Setup all API route mocks
 */
export function setupAPIRouteMocks() {
  // Mock the actual API route modules
  vi.doMock('@/app/api/csrf-token/route', () => mockCSRFTokenRoute);
  vi.doMock('@/app/api/health/route', () => mockHealthRoute);
  vi.doMock('@/app/api/metrics/route', () => mockMetricsRoute);
  vi.doMock('@/app/api/generate/route', () => mockGenerateRoute);
  vi.doMock('@/app/api/preflight/route', () => mockPreflightRoute);
}

/**
 * Reset all API route mocks
 */
export function resetAPIRouteMocks() {
  mockCSRFTokenRoute.GET.mockClear();
  mockCSRFTokenRoute.POST.mockClear();
  mockHealthRoute.GET.mockClear();
  mockMetricsRoute.GET.mockClear();
  mockGenerateRoute.POST.mockClear();
  mockPreflightRoute.POST.mockClear();
  mockErrorScenarios.malformedJson.mockClear();
  mockErrorScenarios.networkTimeout.mockClear();
}
