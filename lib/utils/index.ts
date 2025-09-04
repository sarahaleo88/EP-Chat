/**
 * Utility functions barrel export
 * Optimized for tree shaking and bundle size reduction
 */

import React from 'react';

// Re-export only the functions we actually use to enable better tree shaking
export { estimateTokens } from '../utils';
export { formatUserFriendlyError, shouldAutoRetry, getRetryDelay } from '../error-handler';
export { validateDeepSeekModel, safeValidateDeepSeekModel } from '../types';

// Lazy-loaded heavy utilities
export const getTemplateCacheStats = () => 
  import('../template-registry').then(mod => mod.getTemplateCacheStats);

export const forceCleanTemplateCache = () => 
  import('../template-registry').then(mod => mod.forceCleanTemplateCache);

export const clearTemplateCache = () => 
  import('../template-registry').then(mod => mod.clearTemplateCache);

// Performance utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memory optimization utilities
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn);
};

// Bundle size monitoring
export const getBundleInfo = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      transferSize: navigation.transferSize,
      encodedBodySize: navigation.encodedBodySize,
      decodedBodySize: navigation.decodedBodySize,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
    };
  }
  return null;
};
