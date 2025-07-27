/**
 * Debounce hook for optimizing API calls
 * Prevents rapid-fire requests and improves performance
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounce hook that delays execution until after delay has passed
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook that delays function execution
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @param deps - Dependencies array
 * @returns Debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef<T>(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Debounced async callback with cancellation support
 * @param callback - Async function to debounce
 * @param delay - Delay in milliseconds
 * @param deps - Dependencies array
 * @returns Object with debounced function and cancel method
 */
export function useDebouncedAsyncCallback<
  T extends (...args: any[]) => Promise<any>,
>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): {
  debouncedCallback: T;
  cancel: () => void;
  isPending: boolean;
} {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef<T>(callback);
  const [isPending, setIsPending] = useState(false);
  const abortControllerRef = useRef<AbortController>();

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setIsPending(false);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      // Cancel any pending execution
      cancel();
      setIsPending(true);

      return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            // Create new abort controller for this execution
            abortControllerRef.current = new AbortController();

            const result = await callbackRef.current(...args);
            setIsPending(false);
            resolve(result);
          } catch (error) {
            setIsPending(false);
            reject(error);
          }
        }, delay);
      });
    }) as T,
    [delay, cancel]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    debouncedCallback,
    cancel,
    isPending,
  };
}

/**
 * Hook for debouncing search/filter operations
 * @param searchTerm - Search term to debounce
 * @param delay - Delay in milliseconds (default: 200ms - optimized for faster response)
 * @returns Object with debounced search term and loading state
 */
export function useDebouncedSearch(
  searchTerm: string,
  delay: number = 200
): {
  debouncedSearchTerm: string;
  isSearching: boolean;
} {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);

    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return {
    debouncedSearchTerm,
    isSearching,
  };
}
