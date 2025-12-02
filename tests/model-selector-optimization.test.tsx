/**
 * Model Selector Optimization Tests
 * Validates dropdown functionality and accessibility compliance
 * Updated to match actual ModelSelector component implementation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ModelSelector } from '@/app/components/ModelSelector';

describe('Model Selector - Dropdown Functionality', () => {
  let mockOnModelChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnModelChange = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('🎯 Component Rendering', () => {
    it('should render trigger button with correct title', () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      expect(trigger).toBeTruthy();
      expect(trigger.tagName).toBe('BUTTON');
    });

    it('should display correct icon for selected model', () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      // The button should contain the chat emoji
      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      expect(trigger.textContent).toContain('💬');
    });

    it('should update title when model changes', () => {
      const { rerender } = render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByTitle('当前模型: DeepSeek Chat')).toBeTruthy();

      rerender(
        <ModelSelector
          selectedModel="deepseek-coder"
          onModelChange={mockOnModelChange}
        />
      );

      expect(screen.getByTitle('当前模型: DeepSeek Coder')).toBeTruthy();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });
  });

  describe('⚡ Dropdown Behavior', () => {
    it('should open dropdown on click', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        // All three model options should be visible
        expect(screen.getByText(/DeepSeek Chat/)).toBeTruthy();
        expect(screen.getByText(/DeepSeek Coder/)).toBeTruthy();
        expect(screen.getByText(/DeepSeek Reasoner/)).toBeTruthy();
      });
    });

    it('should close dropdown when clicking trigger again', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');

      // Open
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByText(/DeepSeek Coder/)).toBeTruthy();
      });

      // Close
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.queryByRole('option')).toBeFalsy();
      });
    });

    it('should close dropdown when clicking outside', async () => {
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

      // Click outside (simulate mousedown event)
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByRole('option')).toBeFalsy();
      });
    });
  });

  describe('🔧 Model Selection', () => {
    it('should call onModelChange when selecting a model', async () => {
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

      // Find and click the Coder option
      const coderOption = screen.getByText(/DeepSeek Coder/);
      fireEvent.click(coderOption);

      expect(mockOnModelChange).toHaveBeenCalledWith('deepseek-coder');
    });

    it('should close dropdown after selection', async () => {
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

      const coderOption = screen.getByText(/DeepSeek Coder/);
      fireEvent.click(coderOption);

      await waitFor(() => {
        expect(screen.queryByRole('option')).toBeFalsy();
      });
    });

    it('should select deepseek-reasoner model', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/DeepSeek Reasoner/)).toBeTruthy();
      });

      const reasonerOption = screen.getByText(/DeepSeek Reasoner/);
      fireEvent.click(reasonerOption);

      expect(mockOnModelChange).toHaveBeenCalledWith('deepseek-reasoner');
    });
  });

  describe('♿ Accessibility', () => {
    it('should have correct ARIA attributes on trigger', () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('should update aria-expanded when dropdown opens', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(trigger);

      await waitFor(() => {
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
      });
    });

    it('should have role="option" on dropdown items', async () => {
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
    });

    it('should mark selected option with aria-selected', async () => {
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
        const selectedOption = options.find(opt => opt.getAttribute('aria-selected') === 'true');
        expect(selectedOption).toBeTruthy();
        expect(selectedOption?.textContent).toContain('DeepSeek Chat');
      });
    });
  });

  describe('📱 Visual States', () => {
    it('should show selection indicator for current model', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-coder"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Coder');
      fireEvent.click(trigger);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        const coderOption = options.find(opt => opt.textContent?.includes('DeepSeek Coder'));
        expect(coderOption?.getAttribute('aria-selected')).toBe('true');
      });
    });

    it('should display all model icons correctly', async () => {
      render(
        <ModelSelector
          selectedModel="deepseek-chat"
          onModelChange={mockOnModelChange}
        />
      );

      const trigger = screen.getByTitle('当前模型: DeepSeek Chat');
      fireEvent.click(trigger);

      await waitFor(() => {
        const dropdownContent = document.body.textContent;
        expect(dropdownContent).toContain('💬'); // Chat icon
        expect(dropdownContent).toContain('👨‍💻'); // Coder icon
        expect(dropdownContent).toContain('🧠'); // Reasoner icon
      });
    });
  });
});
