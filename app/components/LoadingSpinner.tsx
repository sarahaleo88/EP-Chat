/**
 * 加载动画组件
 * 使用四叶草图标的加载动画
 */

'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  showText?: boolean;
}

/**
 * 四叶草加载动画组件
 * @param size - 尺寸大小
 * @param className - 自定义样式类
 * @param text - 加载文本
 * @param showText - 是否显示文本
 * @returns JSX 元素
 */
export default function LoadingSpinner({
  size = 'md',
  className,
  text = '加载中...',
  showText = true,
}: LoadingSpinnerProps) {
  // 尺寸映射
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      {/* 三叶草旋转动画 */}
      <div className="relative">
        <div
          className={cn(
            'shamrock-spin text-shamrock-500',
            sizeClasses[size]
          )}
          role="status"
          aria-label="加载中"
        >
          {/* 三叶草 SVG 图标 */}
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full"
          >
            <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
            <path d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
            <path d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>

        {/* 脉冲效果 */}
        <div
          className={cn(
            'absolute inset-0 shamrock-pulse text-shamrock-300 opacity-50',
            sizeClasses[size]
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full"
          >
            <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
            <path d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
            <path d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
      </div>

      {/* 加载文本 */}
      {showText && (
        <p
          className={cn(
            'text-gray-600 dark:text-gray-400 font-medium animate-pulse',
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * 内联加载动画组件
 * 用于按钮等小空间场景
 */
export function InlineSpinner({
  size = 'sm',
  className,
}: Pick<LoadingSpinnerProps, 'size' | 'className'>) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <div
      className={cn(
        'shamrock-spin text-current',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="加载中"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-full h-full"
      >
        <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
        <path d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
        <path d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
        <path d="M12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18Z" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </div>
  );
}

/**
 * 骨架屏加载组件
 * 用于内容加载占位
 */
export function SkeletonLoader({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'loading-skeleton h-4 rounded',
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * 点状加载动画
 * 简约的点状加载效果
 */
export function DotsLoader({
  size = 'md',
  className,
}: Pick<LoadingSpinnerProps, 'size' | 'className'>) {
  const dotSizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
    xl: 'w-3 h-3',
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'bg-shamrock-500 rounded-full animate-bounce',
            dotSizeClasses[size]
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}
