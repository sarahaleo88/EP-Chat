/**
 * Tests for app/components/CSPNonceProvider.tsx
 * CSP Nonce Provider component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('CSPNonceProvider', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('CSPNonceProvider component', () => {
    it('should import module without errors', async () => {
      const module = await import('@/app/components/CSPNonceProvider');
      
      expect(module).toBeDefined();
    });

    it('should export CSPNonceProvider', async () => {
      const { CSPNonceProvider } = await import('@/app/components/CSPNonceProvider');
      
      expect(CSPNonceProvider).toBeDefined();
    });

    it('should render children', async () => {
      const { CSPNonceProvider } = await import('@/app/components/CSPNonceProvider');
      
      render(
        <CSPNonceProvider>
          <div>Test content</div>
        </CSPNonceProvider>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should accept nonce prop', async () => {
      const { CSPNonceProvider } = await import('@/app/components/CSPNonceProvider');
      
      render(
        <CSPNonceProvider nonce="test-nonce-123">
          <div>Test content</div>
        </CSPNonceProvider>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should accept null nonce', async () => {
      const { CSPNonceProvider } = await import('@/app/components/CSPNonceProvider');
      
      render(
        <CSPNonceProvider nonce={null}>
          <div>Test content</div>
        </CSPNonceProvider>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('useCSPNonce hook', () => {
    it('should export useCSPNonce hook', async () => {
      const { useCSPNonce } = await import('@/app/components/CSPNonceProvider');
      
      expect(useCSPNonce).toBeDefined();
      expect(typeof useCSPNonce).toBe('function');
    });

    it('should return nonce from context', async () => {
      const { CSPNonceProvider, useCSPNonce } = await import('@/app/components/CSPNonceProvider');
      
      const TestComponent = () => {
        const nonce = useCSPNonce();
        return <div data-testid="nonce-value">{nonce || 'no-nonce'}</div>;
      };
      
      render(
        <CSPNonceProvider nonce="test-nonce-456">
          <TestComponent />
        </CSPNonceProvider>
      );
      
      expect(screen.getByTestId('nonce-value').textContent).toBe('test-nonce-456');
    });

    it('should return null when no nonce provided', async () => {
      const { CSPNonceProvider, useCSPNonce } = await import('@/app/components/CSPNonceProvider');
      
      const TestComponent = () => {
        const nonce = useCSPNonce();
        return <div data-testid="nonce-value">{nonce || 'no-nonce'}</div>;
      };
      
      render(
        <CSPNonceProvider>
          <TestComponent />
        </CSPNonceProvider>
      );
      
      expect(screen.getByTestId('nonce-value').textContent).toBe('no-nonce');
    });
  });

  describe('withCSPNonce HOC', () => {
    it('should export withCSPNonce HOC', async () => {
      const { withCSPNonce } = await import('@/app/components/CSPNonceProvider');
      
      expect(withCSPNonce).toBeDefined();
      expect(typeof withCSPNonce).toBe('function');
    });

    it('should wrap component and inject nonce', async () => {
      const { CSPNonceProvider, withCSPNonce } = await import('@/app/components/CSPNonceProvider');
      
      const TestComponent = ({ nonce }: { nonce?: string | null }) => (
        <div data-testid="wrapped-nonce">{nonce || 'no-nonce'}</div>
      );
      
      const WrappedComponent = withCSPNonce(TestComponent);
      
      render(
        <CSPNonceProvider nonce="injected-nonce">
          <WrappedComponent />
        </CSPNonceProvider>
      );
      
      expect(screen.getByTestId('wrapped-nonce').textContent).toBe('injected-nonce');
    });
  });
});

