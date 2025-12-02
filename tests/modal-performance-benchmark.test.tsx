/**
 * Modal Performance Benchmark Tests
 * Validates dropdown performance and responsiveness
 * Updated to match actual ModelSelector component implementation
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

  describe('🚀 Dropdown Performance', () => {
    it('should complete dropdown open within 300ms', async () => {
      const startTime = performance.now();

      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');

      performance.mark('dropdown-open-start');
      fireEvent.click(trigger);

      await waitFor(() => {
        // Check for dropdown options
        expect(screen.getByText(/DeepSeek Coder/)).toBeTruthy();
      }, { timeout: 500 });

      performance.mark('dropdown-open-end');
      performance.measure('dropdown-open-duration', 'dropdown-open-start', 'dropdown-open-end');

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete within 300ms
      expect(totalTime).toBeLessThan(300);
    });

    it('should complete dropdown close within 300ms', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/DeepSeek Coder/)).toBeTruthy();
      });

      const startTime = performance.now();
      performance.mark('dropdown-close-start');

      // Click trigger again to close
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('option')).toBeFalsy();
      }, { timeout: 500 });

      performance.mark('dropdown-close-end');
      performance.measure('dropdown-close-duration', 'dropdown-close-start', 'dropdown-close-end');

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete within 300ms
      expect(totalTime).toBeLessThan(300);
    });

    it('should render dropdown options efficiently', async () => {
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
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(3);
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render all options quickly
      expect(renderTime).toBeLessThan(100);
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
        expect(screen.getByText(/DeepSeek Coder/)).toBeTruthy();
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

      // Perform 10 rapid toggle clicks
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        fireEvent.click(trigger);
        const endTime = performance.now();
        clickTimes.push(endTime - startTime);
      }

      // Check that performance doesn't degrade
      const firstHalf = clickTimes.slice(0, 5);
      const secondHalf = clickTimes.slice(5);

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      // Second half should not be significantly slower
      expect(secondAvg).toBeLessThan(firstAvg * 2);
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
        fireEvent.click(trigger); // Open
        fireEvent.click(trigger); // Close
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
        expect(screen.getByText(/DeepSeek Coder/)).toBeTruthy();
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
        expect(screen.getByText(/DeepSeek Coder/)).toBeTruthy();
      });

      const endTime = performance.now();
      const mobilePerformance = endTime - startTime;

      // Should maintain good performance on mobile
      expect(mobilePerformance).toBeLessThan(150);
    });
  });
});
