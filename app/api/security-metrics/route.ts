/**
 * Security Metrics API Endpoint
 * Provides real-time security monitoring data
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor } from '@/lib/security-monitor';

/**
 * GET /api/security-metrics
 * Returns current security metrics and monitoring data
 */
export async function GET(request: NextRequest) {
  try {
    // Get security metrics
    const metrics = securityMonitor.getMetrics();
    
    // Add additional system health indicators
    const systemHealth = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    // Calculate security score based on recent events
    const securityScore = calculateSecurityScore(metrics);

    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      securityScore,
      metrics,
      systemHealth,
      alerts: getActiveAlerts(metrics),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Security Metrics API] Error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to retrieve security metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate security score based on recent events
 */
function calculateSecurityScore(metrics: any): number {
  let score = 100;
  
  // Deduct points for security events
  score -= metrics.criticalEvents * 20;
  score -= metrics.highSeverityEvents * 10;
  score -= Math.min(metrics.totalEvents * 0.5, 30); // Cap at 30 points
  
  // Ensure score doesn't go below 0
  return Math.max(0, Math.round(score));
}

/**
 * Get active security alerts
 */
function getActiveAlerts(metrics: any): Array<{
  severity: string;
  message: string;
  timestamp: string;
}> {
  const alerts = [];
  const now = new Date();
  
  if (metrics.criticalEvents > 0) {
    alerts.push({
      severity: 'critical',
      message: `${metrics.criticalEvents} critical security events detected in the last hour`,
      timestamp: now.toISOString(),
    });
  }
  
  if (metrics.highSeverityEvents > 5) {
    alerts.push({
      severity: 'high',
      message: `${metrics.highSeverityEvents} high-severity security events detected in the last hour`,
      timestamp: now.toISOString(),
    });
  }
  
  if (metrics.totalEvents > 100) {
    alerts.push({
      severity: 'medium',
      message: `High volume of security events: ${metrics.totalEvents} in the last hour`,
      timestamp: now.toISOString(),
    });
  }
  
  return alerts;
}

/**
 * POST /api/security-metrics
 * Allows manual security event logging (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, severity, details } = body;
    
    // Validate input
    if (!type || !severity || !details) {
      return NextResponse.json(
        { error: 'Missing required fields: type, severity, details' },
        { status: 400 }
      );
    }
    
    // Log the security event
    const eventData: any = {
      type,
      severity,
      source: 'manual_api',
      details,
    };

    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
      eventData.userAgent = userAgent;
    }

    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip');
    if (ip) {
      eventData.ip = ip;
    }

    securityMonitor.logEvent(eventData);
    
    return NextResponse.json(
      {
        status: 'success',
        message: 'Security event logged successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Security Metrics API] Error logging event:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to log security event',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
