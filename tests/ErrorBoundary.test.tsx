/**
 * Tests for app/components/ErrorBoundary.tsx
 * Error boundary component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.resetModules();
    // Suppress console.error for expected error tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  it('should render children when there is no error', async () => {
    const { ErrorBoundary } = await import('@/app/components/ErrorBoundary');
    
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should be a class component with required methods', async () => {
    const { ErrorBoundary } = await import('@/app/components/ErrorBoundary');

    // ErrorBoundary should be a class component
    expect(ErrorBoundary).toBeDefined();
    expect(ErrorBoundary.prototype).toBeDefined();
    expect(typeof ErrorBoundary.prototype.render).toBe('function');
    expect(typeof ErrorBoundary.prototype.componentDidCatch).toBe('function');
  });

  it('should have getDerivedStateFromError static method', async () => {
    const { ErrorBoundary } = await import('@/app/components/ErrorBoundary');
    
    expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function');
  });

  it('should accept onError prop', async () => {
    const { ErrorBoundary } = await import('@/app/components/ErrorBoundary');
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should accept fallback prop', async () => {
    const { ErrorBoundary } = await import('@/app/components/ErrorBoundary');
    const customFallback = () => <div>Custom error UI</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should accept resetOnPropsChange prop', async () => {
    const { ErrorBoundary } = await import('@/app/components/ErrorBoundary');
    
    render(
      <ErrorBoundary resetOnPropsChange={true}>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should accept resetKeys prop', async () => {
    const { ErrorBoundary } = await import('@/app/components/ErrorBoundary');
    
    render(
      <ErrorBoundary resetKeys={['key1', 'key2']}>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should be a function', async () => {
    const { withErrorBoundary } = await import('@/app/components/ErrorBoundary');
    
    expect(typeof withErrorBoundary).toBe('function');
  });

  it('should wrap component with error boundary', async () => {
    const { withErrorBoundary } = await import('@/app/components/ErrorBoundary');
    
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent />);
    
    expect(screen.getByText('Test component')).toBeInTheDocument();
  });

  it('should set displayName on wrapped component', async () => {
    const { withErrorBoundary } = await import('@/app/components/ErrorBoundary');
    
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });

  it('should accept error boundary props', async () => {
    const { withErrorBoundary } = await import('@/app/components/ErrorBoundary');
    const onError = vi.fn();
    
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent, { onError });
    
    render(<WrappedComponent />);
    
    expect(screen.getByText('Test component')).toBeInTheDocument();
  });
});
