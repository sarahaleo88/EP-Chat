'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface CSPNonceContextType {
  nonce: string | null;
}

const CSPNonceContext = createContext<CSPNonceContextType>({ nonce: null });

interface CSPNonceProviderProps {
  children: ReactNode;
  nonce?: string | null | undefined;
}

/**
 * CSP Nonce Provider
 * Provides nonce value to child components for CSP compliance
 */
export function CSPNonceProvider({ children, nonce = null }: CSPNonceProviderProps) {
  return (
    <CSPNonceContext.Provider value={{ nonce }}>
      {children}
    </CSPNonceContext.Provider>
  );
}

/**
 * Hook to access CSP nonce
 * @returns nonce string or null
 */
export function useCSPNonce(): string | null {
  const context = useContext(CSPNonceContext);
  return context.nonce;
}

/**
 * Higher-order component to inject nonce into style props
 */
export function withCSPNonce<T extends Record<string, any>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function CSPNonceComponent(props: T) {
    const nonce = useCSPNonce();
    
    // Inject nonce into style elements if present
    const enhancedProps = {
      ...props,
      nonce,
    };

    return <Component {...enhancedProps} />;
  };
}
