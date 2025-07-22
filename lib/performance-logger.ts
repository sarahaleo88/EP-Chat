/**
 * Performance Logger
 * Tracks API response times and performance metrics
 */

export interface PerformanceMetrics {
  requestId: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  errorType?: string;
  cacheHit?: boolean;
  retryCount?: number;
  model?: string;
  tokenCount?: number;
}

export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

/**
 * Performance Logger Class
 */
export class PerformanceLogger {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics: number = 1000; // Keep last 1000 metrics
  private enabled: boolean = true;

  constructor(enabled: boolean = true, maxMetrics: number = 1000) {
    this.enabled = enabled;
    this.maxMetrics = maxMetrics;
  }

  /**
   * Start tracking a request
   */
  startRequest(operation: string, model?: string): string {
    if (!this.enabled) return '';
    
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    // Store initial metric
    const metric: Partial<PerformanceMetrics> = {
      requestId,
      operation,
      startTime,
      retryCount: 0
    };

    if (model) {
      metric.model = model;
    }
    
    // Store in a temporary map for completion
    this.tempMetrics = this.tempMetrics || new Map();
    this.tempMetrics.set(requestId, metric);
    
    return requestId;
  }

  private tempMetrics = new Map<string, Partial<PerformanceMetrics>>();

  /**
   * Complete tracking a request
   */
  endRequest(
    requestId: string, 
    success: boolean, 
    options: {
      errorType?: string;
      cacheHit?: boolean;
      retryCount?: number;
      tokenCount?: number;
      model?: string;
      priority?: number;
    } = {}
  ): void {
    if (!this.enabled || !requestId) return;
    
    const endTime = performance.now();
    const tempMetric = this.tempMetrics.get(requestId);
    
    if (!tempMetric) return;
    
    const metric: PerformanceMetrics = {
      ...tempMetric,
      endTime,
      duration: endTime - tempMetric.startTime!,
      success,
      ...options
    } as PerformanceMetrics;
    
    this.metrics.push(metric);
    this.tempMetrics.delete(requestId);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.operation}: ${metric.duration.toFixed(2)}ms`, {
        success: metric.success,
        cacheHit: metric.cacheHit,
        retryCount: metric.retryCount,
        model: metric.model
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      };
    }

    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    
    const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b);
    const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0
    };
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.tempMetrics.clear();
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log a custom performance event
   */
  logEvent(operation: string, duration: number, success: boolean, metadata?: any): void {
    if (!this.enabled) return;
    
    const metric: PerformanceMetrics = {
      requestId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      startTime: performance.now() - duration,
      endTime: performance.now(),
      duration,
      success,
      ...metadata
    };
    
    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
}

// Global performance logger instance
export const performanceLogger = new PerformanceLogger(
  typeof window !== 'undefined' || process.env.NODE_ENV === 'development'
);

/**
 * Utility function to measure async operations
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: any
): Promise<T> {
  const requestId = performanceLogger.startRequest(operation);
  
  try {
    const result = await fn();
    performanceLogger.endRequest(requestId, true, metadata);
    return result;
  } catch (error) {
    performanceLogger.endRequest(requestId, false, {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      ...metadata
    });
    throw error;
  }
}

/**
 * Utility function to measure sync operations
 */
export function measureSync<T>(
  operation: string,
  fn: () => T,
  metadata?: any
): T {
  const requestId = performanceLogger.startRequest(operation);
  
  try {
    const result = fn();
    performanceLogger.endRequest(requestId, true, metadata);
    return result;
  } catch (error) {
    performanceLogger.endRequest(requestId, false, {
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      ...metadata
    });
    throw error;
  }
}
