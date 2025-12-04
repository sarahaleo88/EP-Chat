/**
 * Advanced Security Monitoring System
 * Provides comprehensive security event logging, anomaly detection, and alerting
 */

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'authentication' | 'authorization' | 'input_validation' | 'csrf' | 'rate_limit' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: Record<string, any>;
  userAgent?: string;
  ip?: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  eventsByType: Record<string, number>;
  lastUpdated: Date;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory
  private alertThresholds = {
    criticalEventsPerMinute: 5,
    highSeverityEventsPerMinute: 10,
    totalEventsPerMinute: 50,
  };

  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event,
    };

    this.events.push(securityEvent);

    // Maintain event limit
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Check for alerts
    this.checkAlerts(securityEvent);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {

    }
  }

  /**
   * Log authentication events
   */
  logAuthentication(success: boolean, details: Record<string, any>, request?: Request): void {
    const eventData: Omit<SecurityEvent, 'id' | 'timestamp'> = {
      type: 'authentication',
      severity: success ? 'low' : 'medium',
      source: 'auth_system',
      details: {
        success,
        ...details,
      },
    };

    const userAgent = request?.headers.get('user-agent');
    if (userAgent) {
      eventData.userAgent = userAgent;
    }

    const ip = this.getClientIP(request);
    if (ip) {
      eventData.ip = ip;
    }

    this.logEvent(eventData);
  }

  /**
   * Log CSRF protection events
   */
  logCSRF(valid: boolean, details: Record<string, any>, request?: Request): void {
    const eventData: Omit<SecurityEvent, 'id' | 'timestamp'> = {
      type: 'csrf',
      severity: valid ? 'low' : 'high',
      source: 'csrf_protection',
      details: {
        valid,
        ...details,
      },
    };

    const userAgent = request?.headers.get('user-agent');
    if (userAgent) {
      eventData.userAgent = userAgent;
    }

    const ip = this.getClientIP(request);
    if (ip) {
      eventData.ip = ip;
    }

    this.logEvent(eventData);
  }

  /**
   * Log input validation events
   */
  logInputValidation(valid: boolean, input: string, details: Record<string, any>, request?: Request): void {
    const eventData: Omit<SecurityEvent, 'id' | 'timestamp'> = {
      type: 'input_validation',
      severity: valid ? 'low' : 'medium',
      source: 'input_validator',
      details: {
        valid,
        inputLength: input.length,
        inputType: typeof input,
        ...details,
      },
    };

    const userAgent = request?.headers.get('user-agent');
    if (userAgent) {
      eventData.userAgent = userAgent;
    }

    const ip = this.getClientIP(request);
    if (ip) {
      eventData.ip = ip;
    }

    this.logEvent(eventData);
  }

  /**
   * Log rate limiting events
   */
  logRateLimit(exceeded: boolean, details: Record<string, any>, request?: Request): void {
    const eventData: Omit<SecurityEvent, 'id' | 'timestamp'> = {
      type: 'rate_limit',
      severity: exceeded ? 'medium' : 'low',
      source: 'rate_limiter',
      details: {
        exceeded,
        ...details,
      },
    };

    const userAgent = request?.headers.get('user-agent');
    if (userAgent) {
      eventData.userAgent = userAgent;
    }

    const ip = this.getClientIP(request);
    if (ip) {
      eventData.ip = ip;
    }

    this.logEvent(eventData);
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(activity: string, details: Record<string, any>, request?: Request): void {
    const eventData: Omit<SecurityEvent, 'id' | 'timestamp'> = {
      type: 'suspicious_activity',
      severity: 'high',
      source: 'anomaly_detector',
      details: {
        activity,
        ...details,
      },
    };

    const userAgent = request?.headers.get('user-agent');
    if (userAgent) {
      eventData.userAgent = userAgent;
    }

    const ip = this.getClientIP(request);
    if (ip) {
      eventData.ip = ip;
    }

    this.logEvent(eventData);
  }

  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(event => event.timestamp >= oneHourAgo);
    
    const eventsByType: Record<string, number> = {};
    let criticalEvents = 0;
    let highSeverityEvents = 0;

    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      if (event.severity === 'critical') {
        criticalEvents++;
      } else if (event.severity === 'high') {
        highSeverityEvents++;
      }
    });

    return {
      totalEvents: recentEvents.length,
      criticalEvents,
      highSeverityEvents,
      eventsByType,
      lastUpdated: now,
    };
  }

  /**
   * Check for security alerts
   */
  private checkAlerts(event: SecurityEvent): void {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    const recentEvents = this.events.filter(e => e.timestamp >= oneMinuteAgo);
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highSeverityEvents = recentEvents.filter(e => e.severity === 'high').length;
    
    // Check thresholds
    if (criticalEvents >= this.alertThresholds.criticalEventsPerMinute) {
      this.triggerAlert('critical', `${criticalEvents} critical security events in the last minute`);
    } else if (highSeverityEvents >= this.alertThresholds.highSeverityEventsPerMinute) {
      this.triggerAlert('high', `${highSeverityEvents} high-severity security events in the last minute`);
    } else if (recentEvents.length >= this.alertThresholds.totalEventsPerMinute) {
      this.triggerAlert('medium', `${recentEvents.length} total security events in the last minute`);
    }
  }

  /**
   * Trigger security alert
   */
  private triggerAlert(severity: string, message: string): void {
    console.warn(`[Security Alert - ${severity.toUpperCase()}] ${message}`);
    
    // In production, this would integrate with alerting systems
    // like PagerDuty, Slack, email notifications, etc.
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract client IP from request
   */
  private getClientIP(request?: Request): string | undefined {
    if (!request) {return undefined;}
    
    return request.headers.get('x-forwarded-for') ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           undefined;
  }

  /**
   * Clear old events (for memory management)
   */
  clearOldEvents(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp >= cutoff);
  }
}

// Global security monitor instance
export const securityMonitor = new SecurityMonitor();

// Export types for external use
export type { SecurityEvent, SecurityMetrics };
