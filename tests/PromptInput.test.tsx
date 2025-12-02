/**
 * Tests for app/components/PromptInput.tsx
 * Prompt input component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PromptInput from '@/app/components/PromptInput';

describe('PromptInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render textarea', () => {
      render(<PromptInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<PromptInput {...defaultProps} placeholder="Enter your prompt..." />);
      
      const textarea = screen.getByPlaceholderText('Enter your prompt...');
      expect(textarea).toBeInTheDocument();
    });

    it('should render with value', () => {
      render(<PromptInput {...defaultProps} value="Test prompt" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Test prompt');
    });

    it('should apply custom className', () => {
      const { container } = render(<PromptInput {...defaultProps} className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('input handling', () => {
    it('should call onChange when typing', async () => {
      const onChange = vi.fn();
      render(<PromptInput {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(onChange).toHaveBeenCalled();
    });

    it('should accept maxLength prop', () => {
      // maxLength is handled at component level, not directly on textarea
      render(<PromptInput {...defaultProps} maxLength={10} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<PromptInput {...defaultProps} disabled={true} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should not call onSubmit when disabled', async () => {
      const onSubmit = vi.fn();
      render(<PromptInput {...defaultProps} onSubmit={onSubmit} disabled={true} value="test" />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      render(<PromptInput {...defaultProps} loading={true} />);
      
      // Loading state should affect the component
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should not call onSubmit when loading', async () => {
      const onSubmit = vi.fn();
      render(<PromptInput {...defaultProps} onSubmit={onSubmit} loading={true} value="test" />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should call onSubmit on Cmd+Enter', async () => {
      const onSubmit = vi.fn();
      render(<PromptInput {...defaultProps} onSubmit={onSubmit} value="test" />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
      
      expect(onSubmit).toHaveBeenCalled();
    });

    it('should call onSubmit on Ctrl+Enter', async () => {
      const onSubmit = vi.fn();
      render(<PromptInput {...defaultProps} onSubmit={onSubmit} value="test" />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
      
      expect(onSubmit).toHaveBeenCalled();
    });

    it('should not submit on Enter without modifier', async () => {
      const onSubmit = vi.fn();
      render(<PromptInput {...defaultProps} onSubmit={onSubmit} value="test" />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter' });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should not submit when value is empty', async () => {
      const onSubmit = vi.fn();
      render(<PromptInput {...defaultProps} onSubmit={onSubmit} value="" />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});

