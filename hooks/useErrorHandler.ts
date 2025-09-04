import { useCallback, useState } from 'react';
import { formatUserFriendlyError } from '../lib/error-handler';
import type { DeepSeekModel } from '../lib/types';

/**
 * Error context information for better error tracking and debugging
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  model?: DeepSeekModel;
  userId?: string;
  requestId?: string;
  timestamp?: number;
  additionalData?: Record<string, any>;
}

/**
 * Error handling result
 */
export interface ErrorHandlingResult {
  userMessage: string;
  errorId: string;
  shouldRetry: boolean;
  retryDelay: number | undefined;
}

/**
 * Error reporting function type
 */
type ErrorReporter = (error: Error, context: ErrorContext, errorId: string) => void;

/**
 * Default error reporter - logs to console in development
 */
const defaultErrorReporter: ErrorReporter = (error, context, errorId) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error [${errorId}]`);
    console.error('Error:', error);

    console.groupEnd();
  }
  
  // In production, you might want to send to an error tracking service
  // Example: Sentry.captureException(error, { contexts: { errorContext: context } });
};

/**
 * Generate a unique error ID for tracking
 */
const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Centralized error handling hook
 * Provides consistent error handling, logging, and user feedback across the application
 */
export function useErrorHandler(customErrorReporter?: ErrorReporter) {
  const [lastError, setLastError] = useState<ErrorHandlingResult | null>(null);
  const errorReporter = customErrorReporter || defaultErrorReporter;

  /**
   * Main error handling function
   * @param error - The error that occurred
   * @param context - Additional context about where/how the error occurred
   * @returns Error handling result with user-friendly message and metadata
   */
  const handleError = useCallback((
    error: Error | unknown, 
    context: ErrorContext = {}
  ): ErrorHandlingResult => {
    // Ensure we have an Error object
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Generate unique error ID
    const errorId = generateErrorId();
    
    // Enhance context with timestamp
    const enhancedContext: ErrorContext = {
      ...context,
      timestamp: Date.now(),
    };
    
    // Get user-friendly error message
    const friendlyError = formatUserFriendlyError(errorObj, context.model);
    const userMessage = `❌ **${friendlyError.title}**

${friendlyError.message}

💡 **建议：**
${friendlyError.suggestion}

${friendlyError.retryable ? '您可以重新尝试。' : '请检查设置后重试。'}`;

    // Determine if retry is appropriate
    const shouldRetry = shouldAutoRetry(errorObj);
    const retryDelay = shouldRetry ? getRetryDelay(errorObj) : undefined;

    // Create error handling result
    const result: ErrorHandlingResult = {
      userMessage,
      errorId,
      shouldRetry,
      retryDelay,
    };
    
    // Report the error
    errorReporter(errorObj, enhancedContext, errorId);
    
    // Update last error state
    setLastError(result);
    
    return result;
  }, [errorReporter]);

  /**
   * Handle API errors specifically
   * @param error - API error
   * @param context - API call context
   * @returns Error handling result
   */
  const handleApiError = useCallback((
    error: Error | unknown,
    context: Omit<ErrorContext, 'component'> & { endpoint?: string }
  ): ErrorHandlingResult => {
    return handleError(error, {
      ...context,
      component: 'API',
      action: context.endpoint || 'unknown_endpoint',
    });
  }, [handleError]);

  /**
   * Handle component errors
   * @param error - Component error
   * @param componentName - Name of the component where error occurred
   * @param context - Additional context
   * @returns Error handling result
   */
  const handleComponentError = useCallback((
    error: Error | unknown,
    componentName: string,
    context: Omit<ErrorContext, 'component'> = {}
  ): ErrorHandlingResult => {
    return handleError(error, {
      ...context,
      component: componentName,
    });
  }, [handleError]);

  /**
   * Handle async operation errors
   * @param error - Async operation error
   * @param operationName - Name of the async operation
   * @param context - Additional context
   * @returns Error handling result
   */
  const handleAsyncError = useCallback((
    error: Error | unknown,
    operationName: string,
    context: Omit<ErrorContext, 'action'> = {}
  ): ErrorHandlingResult => {
    return handleError(error, {
      ...context,
      action: operationName,
    });
  }, [handleError]);

  /**
   * Clear the last error
   */
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  /**
   * Check if an error should trigger an automatic retry
   * @param error - The error to check
   * @returns Whether the error should trigger a retry
   */
  const shouldAutoRetry = (error: Error): boolean => {
    const errorMessage = error.message.toLowerCase();
    
    // Network errors that might be temporary
    if (errorMessage.includes('network') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('fetch')) {
      return true;
    }
    
    // Rate limiting errors
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests')) {
      return true;
    }
    
    // Server errors (5xx)
    if (errorMessage.includes('internal server error') ||
        errorMessage.includes('service unavailable') ||
        errorMessage.includes('bad gateway')) {
      return true;
    }
    
    return false;
  };

  /**
   * Get appropriate retry delay based on error type
   * @param error - The error to analyze
   * @returns Retry delay in milliseconds
   */
  const getRetryDelay = (error: Error): number => {
    const errorMessage = error.message.toLowerCase();
    
    // Rate limiting - longer delay
    if (errorMessage.includes('rate limit')) {
      return 5000; // 5 seconds
    }
    
    // Network issues - medium delay
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return 2000; // 2 seconds
    }
    
    // Server errors - short delay
    return 1000; // 1 second
  };

  return {
    handleError,
    handleApiError,
    handleComponentError,
    handleAsyncError,
    clearError,
    lastError,
  };
}

/**
 * Error boundary hook for React components
 * Use this in combination with React Error Boundaries
 */
export function useErrorBoundary() {
  const { handleComponentError } = useErrorHandler();
  
  return {
    captureError: (error: Error, errorInfo: { componentStack: string }) => {
      handleComponentError(error, 'ErrorBoundary', {
        additionalData: { componentStack: errorInfo.componentStack }
      });
    }
  };
}
