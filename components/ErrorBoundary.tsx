/**
 * Advanced Error Boundary System
 * Provides comprehensive error handling with recovery mechanisms and monitoring
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isRecovering: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  enableReporting?: boolean;
  level?: 'page' | 'component' | 'critical';
}

/**
 * Advanced Error Boundary with recovery and monitoring capabilities
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = generateErrorId();
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting = true } = this.props;
    const errorId = this.state.errorId || generateErrorId();

    // Update state with error info
    this.setState({
      errorInfo,
      errorId,
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo, errorId);
    }

    // Report error to monitoring service
    if (enableReporting) {
      this.reportError(error, errorInfo, errorId);
    }

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary Caught Error [${errorId}]`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'component',
      retryCount: this.state.retryCount,
    };

    // Send to monitoring service (implement based on your monitoring solution)
    if (typeof window !== 'undefined') {
      // Example: Send to your error reporting service
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(reportingError => {
        console.error('Failed to report error:', reportingError);
      });
    }
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn(`Max retries (${maxRetries}) reached for error boundary`);
      return;
    }

    this.setState({ isRecovering: true });

    // Exponential backoff: 1s, 2s, 4s, etc.
    const delay = Math.pow(2, retryCount) * 1000;

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: retryCount + 1,
        isRecovering: false,
      });
    }, delay);
  };

  /**
   * Reset error boundary state
   */
  private handleReset = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
    });
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorId, retryCount, isRecovering } = this.state;
    const { children, fallback, enableRetry = true, maxRetries = 3 } = this.props;

    if (hasError && error) {
      // Show custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Show recovery UI
      return (
        <ErrorFallback
          error={error}
          errorId={errorId}
          retryCount={retryCount}
          maxRetries={maxRetries}
          isRecovering={isRecovering}
          enableRetry={enableRetry}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
        />
      );
    }

    return children;
  }
}

/**
 * Error Fallback UI Component
 */
interface ErrorFallbackProps {
  error: Error;
  errorId: string | null;
  retryCount: number;
  maxRetries: number;
  isRecovering: boolean;
  enableRetry: boolean;
  onRetry: () => void;
  onReset: () => void;
}

function ErrorFallback({
  error,
  errorId,
  retryCount,
  maxRetries,
  isRecovering,
  enableRetry,
  onRetry,
  onReset,
}: ErrorFallbackProps) {
  const canRetry = enableRetry && retryCount < maxRetries;

  return (
    <div className="error-boundary-fallback" style={{
      padding: '2rem',
      margin: '1rem',
      border: '2px solid #ef4444',
      borderRadius: '8px',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⚠️</span>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
          Something went wrong
        </h2>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#7f1d1d' }}>
          <strong>Error:</strong> {error.message}
        </p>
        {errorId && (
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#991b1b' }}>
            <strong>Error ID:</strong> {errorId}
          </p>
        )}
        {retryCount > 0 && (
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#991b1b' }}>
            <strong>Retry attempts:</strong> {retryCount}/{maxRetries}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {canRetry && (
          <button
            onClick={onRetry}
            disabled={isRecovering}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isRecovering ? '#9ca3af' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRecovering ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {isRecovering ? 'Retrying...' : 'Try Again'}
          </button>
        )}

        <button
          onClick={onReset}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Reset
        </button>

        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Reload Page
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '1rem', fontSize: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            Error Details (Development)
          </summary>
          <pre style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.625rem',
            color: '#374151',
          }}>
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for error reporting in functional components
 */
export function useErrorHandler() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    const errorId = generateErrorId();
    
    // Log error
    console.error(`Error in ${context || 'component'}:`, error);
    
    // Report to monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(reportingError => {
        console.error('Failed to report error:', reportingError);
      });
    }
    
    return errorId;
  }, []);

  return { reportError };
}
