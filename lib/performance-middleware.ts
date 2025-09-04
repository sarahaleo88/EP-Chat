/**
 * Performance Middleware
 * Tracks and optimizes API response times for sub-100ms performance
 */

import { NextRequest, NextResponse } from 'next/server';

// Performance metrics storage
interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  slowRequests: Array<{
    path: string;
    method: string;
    responseTime: number;
    timestamp: string;
  }>;
  fastRequests: number;
  slowRequestThreshold: number;
}

// Global performance metrics
let performanceMetrics: PerformanceMetrics = {
  requestCount: 0,
  totalResponseTime: 0,
  averageResponseTime: 0,
  slowRequests: [],
  fastRequests: 0,
  slowRequestThreshold: 100, // 100ms threshold for sub-100ms target
};

/**
 * Performance tracking middleware wrapper
 * @param handler - The API route handler
 * @returns Enhanced handler with performance tracking
 */
export function withPerformanceTracking(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();
    const method = request.method;
    const pathname = request.nextUrl.pathname;
    
    try {
      // Execute the original handler
      const response = await handler(request);
      
      // Calculate response time
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      // Track performance metrics
      trackPerformanceMetrics(method, pathname, responseTime, true);
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${responseTime}ms`);
      response.headers.set('X-Performance-Score', calculatePerformanceScore().toString());
      
      // Add cache headers for optimization
      if (method === 'GET' && !pathname.includes('/api/csrf-token')) {
        response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      }
      
      return response;
    } catch (error) {
      // Track failed request
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      trackPerformanceMetrics(method, pathname, responseTime, false);
      
      throw error;
    }
  };
}

/**
 * Track performance metrics for monitoring
 */
function trackPerformanceMetrics(
  method: string,
  path: string,
  responseTime: number,
  success: boolean
): void {
  performanceMetrics.requestCount++;
  performanceMetrics.totalResponseTime += responseTime;
  performanceMetrics.averageResponseTime = Math.round(
    performanceMetrics.totalResponseTime / performanceMetrics.requestCount
  );
  
  // Track fast vs slow requests
  if (responseTime < performanceMetrics.slowRequestThreshold) {
    performanceMetrics.fastRequests++;
  } else {
    // Track slow requests for optimization
    performanceMetrics.slowRequests.push({
      path,
      method,
      responseTime,
      timestamp: new Date().toISOString(),
    });
    
    // Keep only last 50 slow requests
    if (performanceMetrics.slowRequests.length > 50) {
      performanceMetrics.slowRequests = performanceMetrics.slowRequests.slice(-50);
    }
    
    // Log slow requests for debugging
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance] Slow request detected: ${method} ${path} - ${responseTime}ms`);
    }
  }
}

/**
 * Calculate performance score (0-100)
 */
function calculatePerformanceScore(): number {
  if (performanceMetrics.requestCount === 0) return 100;
  
  const fastRequestRatio = performanceMetrics.fastRequests / performanceMetrics.requestCount;
  const avgResponseTimeScore = Math.max(0, 100 - (performanceMetrics.averageResponseTime / 2));
  
  // Weighted score: 70% fast request ratio, 30% average response time
  const score = Math.round((fastRequestRatio * 70) + (avgResponseTimeScore * 0.3));
  return Math.min(100, Math.max(0, score));
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics & {
  performanceScore: number;
  fastRequestRatio: string;
} {
  const fastRequestRatio = performanceMetrics.requestCount > 0
    ? ((performanceMetrics.fastRequests / performanceMetrics.requestCount) * 100).toFixed(1)
    : '100.0';
  
  return {
    ...performanceMetrics,
    performanceScore: calculatePerformanceScore(),
    fastRequestRatio: `${fastRequestRatio}%`,
  };
}

/**
 * Reset performance metrics (for testing)
 */
export function resetPerformanceMetrics(): void {
  performanceMetrics = {
    requestCount: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    slowRequests: [],
    fastRequests: 0,
    slowRequestThreshold: 100,
  };
}

/**
 * Optimize response for better performance
 */
export function optimizeResponse(response: NextResponse, request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  
  // Add compression hint
  response.headers.set('Vary', 'Accept-Encoding');
  
  // Add performance optimization headers
  if (pathname.startsWith('/api/')) {
    // API responses
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    
    // Enable compression for JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      response.headers.set('Content-Encoding', 'gzip');
    }
  }
  
  // Add timing headers for monitoring
  response.headers.set('X-Timestamp', Date.now().toString());
  
  return response;
}

/**
 * Performance monitoring decorator for API routes
 */
export function performanceMonitor(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const startTime = performance.now();
    
    try {
      const result = await method.apply(this, args);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {

      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      console.error(`[Performance] ${target.constructor.name}.${propertyName} failed after ${duration}ms:`, error);
      throw error;
    }
  };
  
  return descriptor;
}

/**
 * Create performance-optimized fetch wrapper
 */
export function createOptimizedFetch() {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const startTime = performance.now();
    
    // Add performance optimizations
    const optimizedOptions: RequestInit = {
      ...options,
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        ...options.headers,
      },
    };
    
    // Add timeout for better performance
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch(url, {
        ...optimizedOptions,
        signal: controller.signal,
      });
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      // Log slow external requests
      if (duration > 1000 && process.env.NODE_ENV === 'development') {
        console.warn(`[Performance] Slow external request: ${url} - ${duration}ms`);
      }
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Memory optimization utilities
 */
export const MemoryOptimizer = {
  /**
   * Clean up old performance data
   */
  cleanup(): void {
    // Keep only recent slow requests
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    performanceMetrics.slowRequests = performanceMetrics.slowRequests.filter(
      req => new Date(req.timestamp).getTime() > oneHourAgo
    );
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  },
  
  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    heapUsed: string;
    heapTotal: string;
    external: string;
    rss: string;
  } {
    const memUsage = process.memoryUsage();
    
    return {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    };
  },
};
