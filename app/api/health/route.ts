/**
 * Health Check API Endpoint
 * Provides comprehensive system health status for monitoring and load balancers
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/health
 * Returns comprehensive health status information
 */
export async function GET(request?: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Basic health checks
    const healthChecks = await performHealthChecks();
    
    const responseTime = Date.now() - startTime;
    
    // Determine overall health status
    const isHealthy = healthChecks.every(check => check.status === 'healthy');
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        cpu: {
          loadAverage: process.platform !== 'win32' ? (process as any).loadavg() : [0, 0, 0],
        },
      },
      checks: healthChecks,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Health Check] Error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Perform comprehensive health checks
 */
async function performHealthChecks(): Promise<Array<{
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  responseTime?: number;
  message?: string;
}>> {
  const checks = [];
  
  // Database/Storage health check
  checks.push(await checkStorage());
  
  // External API health check
  checks.push(await checkExternalAPIs());
  
  // Memory health check
  checks.push(checkMemoryUsage());
  
  // Environment variables check
  checks.push(checkEnvironmentVariables());
  
  return checks;
}

/**
 * Check storage/database connectivity
 */
async function checkStorage(): Promise<{
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  responseTime?: number;
  message?: string;
}> {
  const startTime = Date.now();
  
  try {
    // For this application, we don't have a persistent database
    // but we can check file system access
    const fs = require('fs').promises;
    await fs.access('./package.json');
    
    return {
      name: 'storage',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      message: 'File system accessible',
    };
  } catch (error) {
    return {
      name: 'storage',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: 'File system access failed',
    };
  }
}

/**
 * Check external API connectivity
 */
async function checkExternalAPIs(): Promise<{
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  responseTime?: number;
  message?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Check if DeepSeek API key is configured
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return {
        name: 'external_apis',
        status: 'warning',
        responseTime: Date.now() - startTime,
        message: 'DeepSeek API key not configured',
      };
    }
    
    // Basic connectivity check (without making actual API call to avoid costs)
    return {
      name: 'external_apis',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      message: 'API configuration valid',
    };
  } catch (error) {
    return {
      name: 'external_apis',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: 'External API check failed',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemoryUsage(): {
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message?: string;
} {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  const usagePercentage = (heapUsedMB / heapTotalMB) * 100;
  
  let status: 'healthy' | 'unhealthy' | 'warning' = 'healthy';
  let message = `Memory usage: ${Math.round(heapUsedMB)}MB (${Math.round(usagePercentage)}%)`;
  
  if (usagePercentage > 90) {
    status = 'unhealthy';
    message += ' - Critical memory usage';
  } else if (usagePercentage > 75) {
    status = 'warning';
    message += ' - High memory usage';
  }
  
  return {
    name: 'memory',
    status,
    message,
  };
}

/**
 * Check critical environment variables
 */
function checkEnvironmentVariables(): {
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message?: string;
} {
  const requiredEnvVars = ['NODE_ENV'];
  const optionalEnvVars = ['DEEPSEEK_API_KEY'];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    return {
      name: 'environment',
      status: 'unhealthy',
      message: `Missing required environment variables: ${missing.join(', ')}`,
    };
  }
  
  if (missingOptional.length > 0) {
    return {
      name: 'environment',
      status: 'warning',
      message: `Missing optional environment variables: ${missingOptional.join(', ')}`,
    };
  }
  
  return {
    name: 'environment',
    status: 'healthy',
    message: 'All environment variables configured',
  };
}
