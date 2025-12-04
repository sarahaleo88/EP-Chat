import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, errorId: string) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

/**
 * Generate a unique error ID
 */
const generateErrorId = (): string => {
  return `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  onRetry: () => void;
}> = ({ error, errorInfo, errorId, onRetry }) => (
  <div className="error-boundary-container p-6 m-4 border border-red-300 rounded-lg bg-red-50">
    <div className="flex items-center mb-4">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">
          应用程序遇到了一个错误
        </h3>
      </div>
    </div>
    
    <div className="mb-4">
      <p className="text-sm text-red-700">
        很抱歉，应用程序遇到了一个意外错误。我们已经记录了这个问题，请尝试刷新页面或稍后再试。
      </p>
    </div>

    {process.env.NODE_ENV === 'development' && (
      <details className="mb-4">
        <summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
          错误详情 (开发模式)
        </summary>
        <div className="mt-2 p-3 bg-red-100 rounded border">
          <p className="text-xs text-red-800 font-mono mb-2">
            <strong>错误ID:</strong> {errorId}
          </p>
          <p className="text-xs text-red-800 font-mono mb-2">
            <strong>错误信息:</strong> {error.message}
          </p>
          <p className="text-xs text-red-800 font-mono mb-2">
            <strong>错误堆栈:</strong>
          </p>
          <pre className="text-xs text-red-800 font-mono whitespace-pre-wrap overflow-auto max-h-32">
            {error.stack}
          </pre>
          {errorInfo.componentStack && (
            <>
              <p className="text-xs text-red-800 font-mono mb-2 mt-3">
                <strong>组件堆栈:</strong>
              </p>
              <pre className="text-xs text-red-800 font-mono whitespace-pre-wrap overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </>
          )}
        </div>
      </details>
    )}

    <div className="flex space-x-3">
      <button
        onClick={onRetry}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        重试
      </button>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        刷新页面
      </button>
    </div>
  </div>
);

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError && this.state.errorId) {
      this.props.onError(error, errorInfo, this.state.errorId);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.group(`🚨 Error Boundary Caught Error [${this.state.errorId}]`);
      // eslint-disable-next-line no-console
      console.error('Error:', error);
      // eslint-disable-next-line no-console
      console.error('Error Info:', errorInfo);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetOnPropsChange is true and props changed
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    // Reset error state if resetKeys changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys![idx] !== resetKey
      );
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error && errorInfo && errorId) {
      // Render custom fallback UI if provided
      if (fallback) {
        return fallback(error, errorInfo, errorId);
      }

      // Render default fallback UI
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          onRetry={this.resetErrorBoundary}
        />
      );
    }

    // Render children normally
    return children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
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

export default ErrorBoundary;
