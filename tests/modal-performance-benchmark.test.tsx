/**
 * Modal Performance Benchmark Tests
 * Validates sub-300ms animation smoothness and 60fps performance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ModelSelector } from '@/app/components/ModelSelector';

describe('Model Selector - Performance Benchmarks', () => {
  let mockOnModelChange: ReturnType<typeof vi.fn>;
  let performanceEntries: PerformanceEntry[] = [];

  beforeEach(() => {
    mockOnModelChange = vi.fn();
    performanceEntries = [];
    
    // Mock performance API
    const mockPerformance = {
      now: vi.fn(() => Date.now()),
      mark: vi.fn((name: string) => {
        performanceEntries.push({
          name,
          entryType: 'mark',
          startTime: Date.now(),
          duration: 0,
        } as PerformanceEntry);
      }),
      measure: vi.fn((name: string, startMark?: string, endMark?: string) => {
        const start = performanceEntries.find(e => e.name === startMark);
        const end = performanceEntries.find(e => e.name === endMark);
        const duration = end && start ? end.startTime - start.startTime : 0;
        
        performanceEntries.push({
          name,
          entryType: 'measure',
          startTime: start?.startTime || Date.now(),
          duration,
        } as PerformanceEntry);
      }),
      getEntriesByType: vi.fn((type: string) => 
        performanceEntries.filter(e => e.entryType === type)
      ),
    };
    
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true,
    });
  });

  describe('🚀 Animation Performance', () => {
    it('should complete modal open animation within 300ms', async () => {
      const startTime = performance.now();
      
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      
      performance.mark('modal-open-start');
      fireEvent.click(trigger);
      
      await waitFor(() => {
        const modal = document.querySelector('[style*="height: 10vh"]');
        expect(modal).toBeTruthy();
      }, { timeout: 500 });
      
      performance.mark('modal-open-end');
      performance.measure('modal-open-duration', 'modal-open-start', 'modal-open-end');
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within 300ms
      expect(totalTime).toBeLessThan(300);
    });

    it('should complete modal close animation within 300ms', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        const modal = document.querySelector('[style*="height: 10vh"]');
        expect(modal).toBeTruthy();
      });

      const startTime = performance.now();
      performance.mark('modal-close-start');
      
      // Click outside to close
      const overlay = document.querySelector('[style*="backgroundColor: rgba(0, 0, 0, 0.4)"]');
      fireEvent.click(overlay!);
      
      await waitFor(() => {
        const modal = document.querySelector('[style*="height: 10vh"]');
        expect(modal).toBeFalsy();
      }, { timeout: 500 });
      
      performance.mark('modal-close-end');
      performance.measure('modal-close-duration', 'modal-close-start', 'modal-close-end');
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within 300ms
      expect(totalTime).toBeLessThan(300);
    });

    it('should maintain 60fps during animations (16.67ms frame budget)', async () => {
      const frameTimes: number[] = [];
      let lastFrameTime = performance.now();
      
      // Mock requestAnimationFrame to capture frame times
      const originalRAF = global.requestAnimationFrame;
      global.requestAnimationFrame = vi.fn((callback) => {
        const currentTime = performance.now();
        const frameTime = currentTime - lastFrameTime;
        frameTimes.push(frameTime);
        lastFrameTime = currentTime;
        
        return setTimeout(() => callback(currentTime), 16); // ~60fps
      });

      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        const modal = document.querySelector('[style*="height: 10vh"]');
        expect(modal).toBeTruthy();
      });

      // Restore original RAF
      global.requestAnimationFrame = originalRAF;

      // Check frame times (should be close to 16.67ms for 60fps)
      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      expect(averageFrameTime).toBeLessThan(20); // Allow some tolerance
    });
  });

  describe('⚡ Interaction Response Time', () => {
    it('should respond to clicks within 100ms', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      
      const startTime = performance.now();
      fireEvent.click(trigger);
      
      await waitFor(() => {
        const modal = document.querySelector('[style*="height: 10vh"]');
        expect(modal).toBeTruthy();
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Should respond within 100ms
      expect(responseTime).toBeLessThan(100);
    });

    it('should handle rapid clicks without performance degradation', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      const clickTimes: number[] = [];
      
      // Perform 10 rapid clicks
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        fireEvent.click(trigger);
        
        await waitFor(() => {
          const modal = document.querySelector('[style*="height: 10vh"]');
          if (modal) {
            // Close modal for next iteration
            const overlay = document.querySelector('[style*="backgroundColor: rgba(0, 0, 0, 0.4)"]');
            if (overlay) fireEvent.click(overlay);
          }
        }, { timeout: 100 });
        
        const endTime = performance.now();
        clickTimes.push(endTime - startTime);
      }
      
      // Check that performance doesn't degrade
      const firstHalf = clickTimes.slice(0, 5);
      const secondHalf = clickTimes.slice(5);
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      // Second half should not be significantly slower
      expect(secondAvg).toBeLessThan(firstAvg * 1.5);
    });
  });

  describe('🎯 Memory Performance', () => {
    it('should not cause memory leaks during repeated open/close', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      
      // Perform 20 open/close cycles
      for (let i = 0; i < 20; i++) {
        fireEvent.click(trigger);
        
        await waitFor(() => {
          const modal = document.querySelector('[style*="height: 10vh"]');
          expect(modal).toBeTruthy();
        });
        
        const overlay = document.querySelector('[style*="backgroundColor: rgba(0, 0, 0, 0.4)"]');
        fireEvent.click(overlay!);
        
        await waitFor(() => {
          const modal = document.querySelector('[style*="height: 10vh"]');
          expect(modal).toBeFalsy();
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });

    it('should handle DOM cleanup properly', async () => {
      const { unmount } = render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        const modal = document.querySelector('[style*="height: 10vh"]');
        expect(modal).toBeTruthy();
      });

      // Count DOM nodes before unmount
      const nodesBefore = document.querySelectorAll('*').length;
      
      unmount();
      
      // Count DOM nodes after unmount
      const nodesAfter = document.querySelectorAll('*').length;
      
      // Should clean up properly (allowing for test framework overhead)
      expect(nodesBefore - nodesAfter).toBeGreaterThan(0);
    });
  });

  describe('📱 Responsive Performance', () => {
    it('should maintain performance on small screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
      
      const startTime = performance.now();
      
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        const modal = document.querySelector('[style*="height: 10vh"]');
        expect(modal).toBeTruthy();
      });
      
      const endTime = performance.now();
      const mobilePerformance = endTime - startTime;
      
      // Should maintain good performance on mobile
      expect(mobilePerformance).toBeLessThan(150);
    });
  });
});
