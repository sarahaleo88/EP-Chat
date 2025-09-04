/**
 * Custom hook for managing model state with localStorage synchronization
 * 自定义Hook用于管理模型状态，确保与localStorage同步
 */

import { useState, useEffect, useCallback, useRef } from 'react';

type ModelType = 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';

const STORAGE_KEY = 'selected-model';
const DEFAULT_MODEL: ModelType = 'deepseek-chat';

export function useModelState() {
  const [selectedModel, setSelectedModel] = useState<ModelType>(DEFAULT_MODEL);
  const [isInitialized, setIsInitialized] = useState(false);
  const previousModelRef = useRef<ModelType>(DEFAULT_MODEL);

  // Initialize state from localStorage on mount
  useEffect(() => {
    try {
      const savedModel = localStorage.getItem(STORAGE_KEY) as ModelType;

      // Safe development logging
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

      }

      if (savedModel && ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'].includes(savedModel)) {
        setSelectedModel(savedModel);
        previousModelRef.current = savedModel;

        // Safe development logging
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

        }
      } else {
        // Set default if no valid model found
        localStorage.setItem(STORAGE_KEY, DEFAULT_MODEL);
        setSelectedModel(DEFAULT_MODEL);
        previousModelRef.current = DEFAULT_MODEL;

        // Safe development logging
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

        }
      }
    } catch (error) {
      // Safe development logging
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error('[useModelState] Error loading from localStorage:', error);
      }
      setSelectedModel(DEFAULT_MODEL);
      previousModelRef.current = DEFAULT_MODEL;
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Model change handler with enhanced debugging and synchronization
  const handleModelChange = useCallback((model: ModelType) => {
    // Safe development logging
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

    }

    // Skip if it's the same model
    if (selectedModel === model && previousModelRef.current === model) {
      // Safe development logging
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

      }
      return;
    }

    try {
      // Update localStorage first
      localStorage.setItem(STORAGE_KEY, model);

      // Update state
      setSelectedModel(model);
      previousModelRef.current = model;

      // Safe development logging
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

      }
    } catch (error) {
      // Safe development logging
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error('[useModelState] Error during model change:', error);
      }
    }
  }, [selectedModel]);

  // Sync with localStorage changes (for multiple tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newModel = e.newValue as ModelType;

        // Safe development logging
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

        }

        if (['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'].includes(newModel)) {
          setSelectedModel(newModel);
          previousModelRef.current = newModel;
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    selectedModel,
    handleModelChange,
    isInitialized,
    // Expose debugging info in development with safe guard
    ...(typeof window !== 'undefined' && window.location.hostname === 'localhost' && {
      debug: {
        previousModel: previousModelRef.current,
        storageValue: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null,
      }
    })
  };
}
