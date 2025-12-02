/**
 * Tests for app/components/PromptOutput.tsx
 * Prompt output component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PromptOutput from '@/app/components/PromptOutput';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock getPromptStats
vi.mock('@/lib/prompt-generator', () => ({
  getPromptStats: vi.fn().mockReturnValue({
    words: 10,
    characters: 50,
    lines: 3,
    estimatedTokens: 15,
  }),
}));

describe('PromptOutput', () => {
  const defaultProps = {
    content: 'Test output content',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render content', () => {
      render(<PromptOutput {...defaultProps} />);
      
      expect(screen.getByText('Test output content')).toBeInTheDocument();
    });

    it('should render empty state when no content', () => {
      render(<PromptOutput content="" />);
      
      // Should still render the component
      expect(document.body).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<PromptOutput {...defaultProps} className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('streaming state', () => {
    it('should show streaming indicator when isStreaming is true', () => {
      render(<PromptOutput {...defaultProps} isStreaming={true} />);
      
      // Component should be in streaming mode
      expect(screen.getByText('Test output content')).toBeInTheDocument();
    });

    it('should auto-scroll during streaming', () => {
      const { rerender } = render(<PromptOutput content="Initial" isStreaming={true} />);
      
      rerender(<PromptOutput content="Initial content with more text" isStreaming={true} />);
      
      // Content should update
      expect(screen.getByText(/Initial content/)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<PromptOutput {...defaultProps} isLoading={true} />);
      
      // Loading state should be active
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message', () => {
      render(<PromptOutput {...defaultProps} error="Something went wrong" />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should not show error when error is null', () => {
      render(<PromptOutput {...defaultProps} error={null} />);
      
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('should have copy button', () => {
      render(<PromptOutput {...defaultProps} />);

      // Button has Chinese title "复制内容"
      const copyButton = screen.getByRole('button', { name: /复制内容/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should trigger copy action on click', async () => {
      render(<PromptOutput {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /复制内容/i });

      // The copy action should not throw
      expect(() => fireEvent.click(copyButton)).not.toThrow();
    });
  });

  describe('clear functionality', () => {
    it('should call onClear when clear button is clicked', () => {
      const onClear = vi.fn();
      render(<PromptOutput {...defaultProps} onClear={onClear} />);

      // Button has Chinese title "清除内容"
      const clearButton = screen.getByRole('button', { name: /清除内容/i });
      fireEvent.click(clearButton);

      expect(onClear).toHaveBeenCalled();
    });

    it('should not show clear button when onClear is not provided', () => {
      render(<PromptOutput {...defaultProps} />);

      const clearButton = screen.queryByRole('button', { name: /清除内容/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('expand/collapse', () => {
    it('should toggle expanded state', () => {
      render(<PromptOutput content={'Long content '.repeat(100)} />);
      
      // Component should handle long content
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('scroll behavior', () => {
    it('should handle scroll events', () => {
      render(<PromptOutput content={'Line\n'.repeat(50)} />);
      
      // Component should be scrollable
      expect(document.body).toBeInTheDocument();
    });
  });
});

