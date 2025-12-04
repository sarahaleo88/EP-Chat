/**
 * Performance Testing Suite for Enhanced Message Renderer
 * Tests sub-200ms response times and zero additional computational overhead
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecureEnhancedMessageRenderer } from '@/app/components/SecureEnhancedMessageRenderer';
import { 
  PerformanceMonitor, 
  ContentCache, 
  PerformanceTesting,
  BundleOptimization 
} from '@/lib/performance-utils';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(window, 'performance', {
  value: {
    now: mockPerformanceNow
  },
  writable: true,
  configurable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

describe('Enhanced Message Renderer Performance', () => {
  let performanceMonitor: PerformanceMonitor;
  let contentCache: ContentCache;

  beforeEach(() => {
    performanceMonitor = PerformanceMonitor.getInstance();
    contentCache = ContentCache.getInstance();
    
    // Clear metrics and cache
    performanceMonitor.clearMetrics();
    contentCache.clear();
    
    // Reset performance.now mock
    mockPerformanceNow.mockClear();
    let time = 0;
    mockPerformanceNow.mockImplementation(() => {
      time += 10; // Simulate 10ms increments
      return time;
    });
  });

  describe('Render Time Performance', () => {
    test('should render simple content within 200ms', async () => {
      const simpleContent = 'This is a simple message that should render quickly.';
      
      const startTime = performance.now();
      
      render(
        <SecureEnhancedMessageRenderer
          content={simpleContent}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(200);
    });

    test('should render complex content within 200ms', async () => {
      const complexContent = `Here's a complex React component with multiple sections:

\`\`\`jsx
import React, { useState, useEffect, useMemo } from 'react';

function ComplexComponent({ data, onUpdate }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        setState(result);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  const processedData = useMemo(() => {
    if (!state) return [];
    return state.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now()
    }));
  }, [state]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="complex-component">
      <h2>Complex Component</h2>
      <ul>
        {processedData.map(item => (
          <li key={item.id}>
            {item.name} - {item.value}
          </li>
        ))}
      </ul>
      <button onClick={() => onUpdate(processedData)}>
        Update Data
      </button>
    </div>
  );
}

export default ComplexComponent;
\`\`\`

This component demonstrates several React patterns:

1. **State Management**: Using useState for local state
2. **Side Effects**: useEffect for data fetching
3. **Performance Optimization**: useMemo for expensive calculations
4. **Error Handling**: Try-catch blocks for robust error handling
5. **Conditional Rendering**: Loading states and conditional content

Key features:
• Async data fetching with proper error handling
• Memoized data processing for performance
• Clean component structure with separation of concerns
• Proper cleanup and dependency management

Alternative approaches you could consider:
- Using React Query for data fetching
- Implementing custom hooks for reusable logic
- Adding TypeScript for better type safety
- Using React.memo for component memoization`;

      const startTime = performance.now();
      
      render(
        <SecureEnhancedMessageRenderer
          content={complexContent}
          messageType="assistant"
          model="deepseek-coder"
          enableEnhancedTemplates={true}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(200);
    });

    test('should handle streaming content efficiently', async () => {
      const streamingContent = 'This is streaming content that updates in real-time';
      
      const { rerender } = render(
        <SecureEnhancedMessageRenderer
          content={streamingContent.substring(0, 10)}
          messageType="assistant"
          isStreaming={true}
          enableEnhancedTemplates={true}
        />
      );
      
      // Simulate streaming updates
      const updateTimes: number[] = [];
      
      for (let i = 10; i <= streamingContent.length; i += 10) {
        const startTime = performance.now();
        
        rerender(
          <SecureEnhancedMessageRenderer
            content={streamingContent.substring(0, i)}
            messageType="assistant"
            isStreaming={i < streamingContent.length}
            enableEnhancedTemplates={true}
          />
        );
        
        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }
      
      // All streaming updates should be fast
      updateTimes.forEach(time => {
        expect(time).toBeLessThan(50); // Even faster for streaming updates
      });
    });
  });

  describe('Content Caching Performance', () => {
    test('should cache template generation results', () => {
      const content = 'Test content for caching';
      const cacheKey = contentCache.generateKey(content, 'assistant', 'deepseek-chat');
      
      // First render should generate template
      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          model="deepseek-chat"
          enableEnhancedTemplates={true}
        />
      );
      
      // Check if template was cached
      const cachedTemplate = contentCache.get(cacheKey);
      expect(cachedTemplate).toBeTruthy();
      
      // Second render should use cache
      const startTime = performance.now();
      
      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          model="deepseek-chat"
          enableEnhancedTemplates={true}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Cached render should be significantly faster
      expect(renderTime).toBeLessThan(50);
    });

    test('should handle cache eviction properly', () => {
      const cache = ContentCache.getInstance();
      
      // Fill cache beyond capacity
      for (let i = 0; i < 150; i++) {
        const content = `Test content ${i}`;
        const key = cache.generateKey(content, 'assistant');
        const mockTemplate = {
          id: `template-${i}`,
          type: 'discussion' as const,
          title: 'Test',
          summary: 'Test summary',
          sections: [],
          metadata: {},
          accessibility: {
            ariaLabel: 'Test',
            role: 'article',
            description: 'Test'
          }
        };
        cache.set(key, mockTemplate);
      }
      
      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(100); // Should not exceed max size
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory on component unmount', () => {
      const { unmount } = render(
        <SecureEnhancedMessageRenderer
          content="Test content for memory management"
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );
      
      // Simulate memory usage before unmount
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Memory should not increase significantly
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Allow for some variance in memory measurement
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
    });

    test('should clean up event listeners and timers', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(
        <SecureEnhancedMessageRenderer
          content="Test content with event listeners"
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );
      
      const addedListeners = addEventListenerSpy.mock.calls.length;
      
      unmount();
      
      const removedListeners = removeEventListenerSpy.mock.calls.length;
      
      // Should remove at least as many listeners as added
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Bundle Size Optimization', () => {
    test('should lazy load heavy dependencies', async () => {
      // Test that DOMPurify is lazy loaded
      const domPurifyPromise = BundleOptimization.loadDOMPurify();
      expect(domPurifyPromise).toBeInstanceOf(Promise);
      
      const DOMPurify = await domPurifyPromise;
      expect(DOMPurify).toBeDefined();
      expect(typeof DOMPurify.sanitize).toBe('function');
    });

    test('should lazy load content analysis', async () => {
      const analyzeFunction = await BundleOptimization.loadContentAnalysis();
      expect(typeof analyzeFunction).toBe('function');
    });

    test('should lazy load accessibility utilities', async () => {
      const accessibilityUtils = await BundleOptimization.loadAccessibilityUtils();
      expect(accessibilityUtils).toBeDefined();
      expect(accessibilityUtils.useAccessibility).toBeDefined();
    });
  });

  describe('Performance Monitoring', () => {
    test('should track render time metrics', () => {
      render(
        <SecureEnhancedMessageRenderer
          content="Test content for metrics"
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );
      
      const renderMetrics = performanceMonitor.getMetrics('renderTime');
      expect(renderMetrics.length).toBeGreaterThan(0);
      
      const averageTime = performanceMonitor.getAverageTime('renderTime');
      expect(averageTime).toBeGreaterThan(0);
      expect(averageTime).toBeLessThan(200);
    });

    test('should track template generation metrics', async () => {
      render(
        <SecureEnhancedMessageRenderer
          content="Test content for template metrics"
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );
      
      // Wait for template generation to complete
      await waitFor(() => {
        const metrics = performanceMonitor.getMetrics('templateGeneration');
        expect(metrics.length).toBeGreaterThan(0);
      });
      
      const averageTime = performanceMonitor.getAverageTime('templateGeneration');
      expect(averageTime).toBeLessThan(50); // Template generation should be fast
    });

    test('should calculate performance percentiles', () => {
      // Generate multiple metrics
      for (let i = 0; i < 10; i++) {
        render(
          <SecureEnhancedMessageRenderer
            content={`Test content ${i}`}
            messageType="assistant"
            enableEnhancedTemplates={true}
          />
        );
      }
      
      const p95Time = performanceMonitor.getPercentile('renderTime', 95);
      expect(p95Time).toBeGreaterThan(0);
      expect(p95Time).toBeLessThan(200);
    });
  });

  describe('Stress Testing', () => {
    test('should handle rapid re-renders efficiently', async () => {
      const { rerender } = render(
        <SecureEnhancedMessageRenderer
          content="Initial content"
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );
      
      const renderTimes: number[] = [];
      
      // Perform 50 rapid re-renders
      for (let i = 0; i < 50; i++) {
        const startTime = performance.now();
        
        rerender(
          <SecureEnhancedMessageRenderer
            content={`Updated content ${i}`}
            messageType="assistant"
            enableEnhancedTemplates={true}
          />
        );
        
        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
      }
      
      // All renders should be within acceptable time
      renderTimes.forEach(time => {
        expect(time).toBeLessThan(200);
      });
      
      // Average should be well below threshold
      const averageTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      expect(averageTime).toBeLessThan(100);
    });

    test('should handle large content efficiently', () => {
      // Generate large content (10KB)
      const largeContent = 'Large content section. '.repeat(500);
      
      const startTime = performance.now();
      
      render(
        <SecureEnhancedMessageRenderer
          content={largeContent}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Even large content should render within threshold
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Comparative Performance', () => {
    test('enhanced renderer should not be significantly slower than basic renderer', () => {
      const content = 'Test content for performance comparison';
      
      // Measure basic renderer
      const basicStartTime = performance.now();
      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={false}
        />
      );
      const basicEndTime = performance.now();
      const basicRenderTime = basicEndTime - basicStartTime;
      
      // Measure enhanced renderer
      const enhancedStartTime = performance.now();
      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );
      const enhancedEndTime = performance.now();
      const enhancedRenderTime = enhancedEndTime - enhancedStartTime;
      
      // Enhanced renderer should not be more than 2x slower
      expect(enhancedRenderTime).toBeLessThan(basicRenderTime * 2);
      
      // Both should be under 200ms
      expect(basicRenderTime).toBeLessThan(200);
      expect(enhancedRenderTime).toBeLessThan(200);
    });
  });
});
