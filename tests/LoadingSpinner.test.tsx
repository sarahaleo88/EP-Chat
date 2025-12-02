/**
 * Tests for app/components/LoadingSpinner.tsx
 * Loading spinner component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('default export (LoadingSpinner)', () => {
    it('should render with default props', async () => {
      const LoadingSpinner = (await import('@/app/components/LoadingSpinner')).default;
      
      render(<LoadingSpinner />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show default loading text', async () => {
      const LoadingSpinner = (await import('@/app/components/LoadingSpinner')).default;
      
      render(<LoadingSpinner />);
      
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('should accept custom text', async () => {
      const LoadingSpinner = (await import('@/app/components/LoadingSpinner')).default;
      
      render(<LoadingSpinner text="自定义加载文本" />);
      
      expect(screen.getByText('自定义加载文本')).toBeInTheDocument();
    });

    it('should hide text when showText is false', async () => {
      const LoadingSpinner = (await import('@/app/components/LoadingSpinner')).default;
      
      render(<LoadingSpinner showText={false} />);
      
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    it('should accept custom className', async () => {
      const LoadingSpinner = (await import('@/app/components/LoadingSpinner')).default;
      
      const { container } = render(<LoadingSpinner className="custom-class" />);
      
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should have aria-label for accessibility', async () => {
      const LoadingSpinner = (await import('@/app/components/LoadingSpinner')).default;
      
      render(<LoadingSpinner />);
      
      expect(screen.getByLabelText('加载中')).toBeInTheDocument();
    });
  });

  describe('InlineSpinner', () => {
    it('should render', async () => {
      const { InlineSpinner } = await import('@/app/components/LoadingSpinner');
      
      render(<InlineSpinner />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should accept size prop', async () => {
      const { InlineSpinner } = await import('@/app/components/LoadingSpinner');
      
      render(<InlineSpinner size="lg" />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should accept className prop', async () => {
      const { InlineSpinner } = await import('@/app/components/LoadingSpinner');
      
      const { container } = render(<InlineSpinner className="custom-inline" />);
      
      expect(container.querySelector('.custom-inline')).toBeInTheDocument();
    });
  });

  describe('SkeletonLoader', () => {
    it('should render default 3 lines', async () => {
      const { SkeletonLoader } = await import('@/app/components/LoadingSpinner');
      
      const { container } = render(<SkeletonLoader />);
      
      const skeletons = container.querySelectorAll('.loading-skeleton');
      expect(skeletons.length).toBe(3);
    });

    it('should render custom number of lines', async () => {
      const { SkeletonLoader } = await import('@/app/components/LoadingSpinner');
      
      const { container } = render(<SkeletonLoader lines={5} />);
      
      const skeletons = container.querySelectorAll('.loading-skeleton');
      expect(skeletons.length).toBe(5);
    });

    it('should accept className prop', async () => {
      const { SkeletonLoader } = await import('@/app/components/LoadingSpinner');
      
      const { container } = render(<SkeletonLoader className="custom-skeleton" />);
      
      expect(container.querySelector('.custom-skeleton')).toBeInTheDocument();
    });
  });

  describe('DotsLoader', () => {
    it('should render 3 dots', async () => {
      const { DotsLoader } = await import('@/app/components/LoadingSpinner');
      
      const { container } = render(<DotsLoader />);
      
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(3);
    });

    it('should accept size prop', async () => {
      const { DotsLoader } = await import('@/app/components/LoadingSpinner');
      
      render(<DotsLoader size="xl" />);
      
      // Should render without error
      expect(document.body).toBeInTheDocument();
    });
  });
});

