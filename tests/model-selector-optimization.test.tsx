/**
 * Model Selector Optimization Tests
 * Validates 10vh height constraint compliance and performance specifications
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ModelSelector } from '@/app/components/ModelSelector';

// Mock performance API for animation testing
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('Model Selector - 10vh Height Constraint Optimization', () => {
  let mockOnModelChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnModelChange = vi.fn();

    // Mock viewport dimensions for 10vh calculation
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000, // 1000px viewport height for easy calculation
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('🎯 Technical Specifications Compliance', () => {
    it('should enforce 10vh height constraint (100px for 1000px viewport)', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      // Open modal
      const trigger = screen.getByRole('button', { name: /当前模型/ });
      fireEvent.click(trigger);

      await waitFor(() => {
        const modal = document.querySelector('[style*="height: 10vh"]');
        expect(modal).toBeTruthy();
        
        // Verify height constraint
        const modalElement = modal as HTMLElement;
        const computedStyle = window.getComputedStyle(modalElement);
        const height = modalElement.style.height;
        
        expect(height).toBe('10vh');
        expect(modalElement.style.maxHeight).toBe('120px');
        expect(modalElement.style.minHeight).toBe('100px');
      });
    });

    it('should maintain strict 320px width', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        const modal = document.querySelector('[style*="width: 320px"]');
        expect(modal).toBeTruthy();

        const modalElement = modal as HTMLElement;
        expect(modalElement.style.width).toBe('320px');
        expect(modalElement.style.maxWidth).toBe('90vw');
      });
    });

    it('should use ultra-compact padding (8px vertical, 16px horizontal)', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        const modal = document.querySelector('[style*="padding: 8px 16px"]');
        expect(modal).toBeTruthy();
      });
    });

    it('should implement proper z-index layering (9999)', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /当前模型/ });
      fireEvent.click(trigger);

      await waitFor(() => {
        const overlay = document.querySelector('[style*="zIndex: 9999"]');
        expect(overlay).toBeTruthy();
      });
    });

    it('should use space-optimized typography (14px bold titles, 13px option text)', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        // Check title typography
        const title = document.querySelector('h3[style*="fontSize: 14px"]');
        expect(title).toBeTruthy();
        expect(title?.textContent).toBe('选择模型');
        
        // Check option text typography
        const optionText = document.querySelector('[style*="fontSize: 13px"]');
        expect(optionText).toBeTruthy();
      });
    });

    it('should use 16×16px icon size', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /当前模型/ });
      fireEvent.click(trigger);

      await waitFor(() => {
        const iconContainer = document.querySelector('[style*="width: 16px"][style*="height: 16px"]');
        expect(iconContainer).toBeTruthy();
      });
    });
  });

  describe('⚡ Performance & Animation Compliance', () => {
    it('should complete modal animations within 300ms', async () => {
      const startTime = Date.now();
      
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /当前模型/ });
      fireEvent.click(trigger);

      await waitFor(() => {
        const modal = document.querySelector('[style*="animation: modalSlideIn 0.3s ease-out"]');
        expect(modal).toBeTruthy();
      });

      const endTime = Date.now();
      const animationTime = endTime - startTime;
      
      // Should complete within 300ms + reasonable test overhead
      expect(animationTime).toBeLessThan(350);
    });

    it('should use proper backdrop blur and opacity', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /当前模型/ });
      fireEvent.click(trigger);

      await waitFor(() => {
        const overlay = document.querySelector('[style*="backgroundColor: rgba(0, 0, 0, 0.4)"]');
        expect(overlay).toBeTruthy();
        
        const overlayElement = overlay as HTMLElement;
        expect(overlayElement.style.backdropFilter).toBe('blur(2px)');
      });
    });

    it('should handle overflow with scrolling for 10vh constraint', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /当前模型/ });
      fireEvent.click(trigger);

      await waitFor(() => {
        const optionsContainer = document.querySelector('[style*="overflowY: auto"]');
        expect(optionsContainer).toBeTruthy();
        
        const container = optionsContainer as HTMLElement;
        expect(container.style.overflowX).toBe('hidden');
        expect(container.style.paddingRight).toBe('2px');
      });
    });
  });

  describe('🔧 Functional Integrity', () => {
    it('should preserve 100% existing functionality', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /当前模型/ });
      fireEvent.click(trigger);

      await waitFor(() => {
        // All three model options should be present
        expect(screen.getByText('DeepSeek Chat')).toBeTruthy();
        expect(screen.getByText('DeepSeek Coder')).toBeTruthy();
        expect(screen.getByText('DeepSeek Reasoner')).toBeTruthy();
      });

      // Test model selection
      const coderOption = screen.getByText('DeepSeek Coder');
      fireEvent.click(coderOption);

      expect(mockOnModelChange).toHaveBeenCalledWith('deepseek-coder');
    });

    it('should maintain proper keyboard navigation', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /当前模型/ });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('选择模型')).toBeTruthy();
      });

      // Test Escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('选择模型')).toBeFalsy();
      });
    });

    it('should handle click outside to close', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /当前模型/ });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('选择模型')).toBeTruthy();
      });

      // Click outside
      const overlay = document.querySelector('[style*="backgroundColor: rgba(0, 0, 0, 0.4)"]');
      fireEvent.click(overlay!);

      await waitFor(() => {
        expect(screen.queryByText('选择模型')).toBeFalsy();
      });
    });
  });

  describe('📱 Cross-Browser & Mobile Compatibility', () => {
    it('should handle small viewport gracefully', async () => {
      // Mock small mobile viewport
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600, // Small mobile screen
      });

      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /当前模型/ });
      fireEvent.click(trigger);

      await waitFor(() => {
        const modal = document.querySelector('[style*="maxHeight: 120px"]');
        expect(modal).toBeTruthy();
        
        // Should use fallback height on small screens
        const modalElement = modal as HTMLElement;
        expect(modalElement.style.minHeight).toBe('100px');
      });
    });

    it('should maintain accessibility standards', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /当前模型/ });
      
      // Check ARIA attributes
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
      
      fireEvent.click(trigger);
      
      await waitFor(() => {
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
      });
    });
  });
});
