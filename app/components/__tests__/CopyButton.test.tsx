/**
 * CopyButton Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CopyButton } from '../CopyButton';

// Mock clipboard API
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock document.execCommand for fallback
document.execCommand = jest.fn();

describe('CopyButton', () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    (document.execCommand as jest.Mock).mockClear();
  });

  it('renders copy button with default props', () => {
    render(<CopyButton content="Test content" />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', '复制');
  });

  it('copies content to clipboard when clicked', async () => {
    mockWriteText.mockResolvedValue(undefined);
    
    render(<CopyButton content="Test content to copy" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockWriteText).toHaveBeenCalledWith('Test content to copy');
    
    // Wait for success state
    await waitFor(() => {
      expect(button).toHaveAttribute('title', '已复制!');
    });
  });

  it('cleans markdown formatting from content', async () => {
    mockWriteText.mockResolvedValue(undefined);
    
    const markdownContent = '**Bold text** and *italic text* and `code` and # Header';
    const expectedCleanContent = 'Bold text and italic text and code and Header';
    
    render(<CopyButton content={markdownContent} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockWriteText).toHaveBeenCalledWith(expectedCleanContent);
  });

  it('shows error state when copy fails', async () => {
    mockWriteText.mockRejectedValue(new Error('Copy failed'));
    
    render(<CopyButton content="Test content" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(button).toHaveAttribute('title', '复制失败');
    });
  });

  it('renders as button variant with text', () => {
    render(<CopyButton content="Test" variant="button" showText={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('复制');
  });

  it('prevents multiple clicks during copying', async () => {
    mockWriteText.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<CopyButton content="Test content" />);
    
    const button = screen.getByRole('button');
    
    // First click
    fireEvent.click(button);
    expect(button).toBeDisabled();
    
    // Second click should be ignored
    fireEvent.click(button);
    
    // Should only be called once
    expect(mockWriteText).toHaveBeenCalledTimes(1);
  });

  it('uses fallback method when clipboard API is not available', async () => {
    // Mock clipboard API as unavailable
    const originalClipboard = navigator.clipboard;
    (navigator as any).clipboard = undefined;
    
    (document.execCommand as jest.Mock).mockReturnValue(true);
    
    render(<CopyButton content="Test content" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
    
    // Restore clipboard
    (navigator as any).clipboard = originalClipboard;
  });

  it('handles different sizes correctly', () => {
    const { rerender } = render(<CopyButton content="Test" size="sm" />);
    let button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    rerender(<CopyButton content="Test" size="lg" />);
    button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('resets state after success timeout', async () => {
    jest.useFakeTimers();
    mockWriteText.mockResolvedValue(undefined);
    
    render(<CopyButton content="Test content" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(button).toHaveAttribute('title', '已复制!');
    });
    
    // Fast forward time
    jest.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(button).toHaveAttribute('title', '复制');
    });
    
    jest.useRealTimers();
  });
});
