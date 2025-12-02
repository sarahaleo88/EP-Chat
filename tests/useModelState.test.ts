/**
 * Tests for app/hooks/useModelState.ts
 * Model state management hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModelState } from '@/app/hooks/useModelState';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'location', {
  value: { hostname: 'localhost' },
  writable: true,
});

describe('useModelState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return default model when localStorage is empty', () => {
      const { result } = renderHook(() => useModelState());
      
      expect(result.current.selectedModel).toBe('deepseek-chat');
    });

    it('should load saved model from localStorage', () => {
      localStorageMock.setItem('selected-model', 'deepseek-coder');
      
      const { result } = renderHook(() => useModelState());
      
      // Wait for initialization
      expect(result.current.selectedModel).toBeDefined();
    });

    it('should return isInitialized flag', () => {
      const { result } = renderHook(() => useModelState());
      
      expect(typeof result.current.isInitialized).toBe('boolean');
    });
  });

  describe('handleModelChange', () => {
    it('should update selected model', () => {
      const { result } = renderHook(() => useModelState());
      
      act(() => {
        result.current.handleModelChange('deepseek-coder');
      });
      
      expect(result.current.selectedModel).toBe('deepseek-coder');
    });

    it('should save model to localStorage', () => {
      const { result } = renderHook(() => useModelState());
      
      act(() => {
        result.current.handleModelChange('deepseek-reasoner');
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selected-model', 'deepseek-reasoner');
    });

    it('should not update if same model is selected', () => {
      const { result } = renderHook(() => useModelState());
      
      // First change
      act(() => {
        result.current.handleModelChange('deepseek-coder');
      });
      
      const callCount = localStorageMock.setItem.mock.calls.length;
      
      // Same model again
      act(() => {
        result.current.handleModelChange('deepseek-coder');
      });
      
      // Should not have additional calls
      expect(localStorageMock.setItem.mock.calls.length).toBe(callCount);
    });
  });

  describe('model validation', () => {
    it('should accept deepseek-chat', () => {
      const { result } = renderHook(() => useModelState());
      
      act(() => {
        result.current.handleModelChange('deepseek-chat');
      });
      
      expect(result.current.selectedModel).toBe('deepseek-chat');
    });

    it('should accept deepseek-coder', () => {
      const { result } = renderHook(() => useModelState());
      
      act(() => {
        result.current.handleModelChange('deepseek-coder');
      });
      
      expect(result.current.selectedModel).toBe('deepseek-coder');
    });

    it('should accept deepseek-reasoner', () => {
      const { result } = renderHook(() => useModelState());
      
      act(() => {
        result.current.handleModelChange('deepseek-reasoner');
      });
      
      expect(result.current.selectedModel).toBe('deepseek-reasoner');
    });
  });

  describe('return value structure', () => {
    it('should return selectedModel', () => {
      const { result } = renderHook(() => useModelState());
      expect(result.current.selectedModel).toBeDefined();
    });

    it('should return handleModelChange function', () => {
      const { result } = renderHook(() => useModelState());
      expect(typeof result.current.handleModelChange).toBe('function');
    });

    it('should return isInitialized boolean', () => {
      const { result } = renderHook(() => useModelState());
      expect(typeof result.current.isInitialized).toBe('boolean');
    });
  });
});

