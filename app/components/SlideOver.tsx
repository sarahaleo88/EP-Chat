/**
 * SlideOver 组件
 * 侧边滑出面板，适合垂直滚动页面，不会干扰主内容区域
 */

'use client';

import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

// SlideOver 方向类型
export type SlideDirection = 'left' | 'right';

// SlideOver 尺寸类型
export type SlideSize = 'sm' | 'md' | 'lg' | 'xl';

// SlideOver 基础属性
interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  direction?: SlideDirection;
  size?: SlideSize;
  className?: string;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

// 尺寸样式映射
const sizeClasses: Record<SlideSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

// 方向样式映射
const directionClasses: Record<
  SlideDirection,
  {
    panel: string;
    enter: string;
    enterFrom: string;
    enterTo: string;
    leave: string;
    leaveFrom: string;
    leaveTo: string;
  }
> = {
  right: {
    panel: 'ml-auto',
    enter: 'transform transition ease-in-out duration-500',
    enterFrom: 'translate-x-full',
    enterTo: 'translate-x-0',
    leave: 'transform transition ease-in-out duration-500',
    leaveFrom: 'translate-x-0',
    leaveTo: 'translate-x-full',
  },
  left: {
    panel: 'mr-auto',
    enter: 'transform transition ease-in-out duration-500',
    enterFrom: '-translate-x-full',
    enterTo: 'translate-x-0',
    leave: 'transform transition ease-in-out duration-500',
    leaveFrom: 'translate-x-0',
    leaveTo: '-translate-x-full',
  },
};

/**
 * SlideOver 主组件
 */
export function SlideOver({
  isOpen,
  onClose,
  direction = 'right',
  size = 'md',
  className,
  children,
  closeOnBackdrop = true,
  showCloseButton = true,
}: SlideOverProps) {
  const directionStyles = directionClasses[direction];

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeOnBackdrop ? onClose : () => {}}
      >
        {/* 背景遮罩 */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        {/* SlideOver 容器 */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={cn(
                'pointer-events-none fixed inset-y-0 flex',
                direction === 'right' ? 'right-0' : 'left-0'
              )}
            >
              <Transition.Child
                as={Fragment}
                enter={directionStyles.enter}
                enterFrom={directionStyles.enterFrom}
                enterTo={directionStyles.enterTo}
                leave={directionStyles.leave}
                leaveFrom={directionStyles.leaveFrom}
                leaveTo={directionStyles.leaveTo}
              >
                <Dialog.Panel
                  className={cn(
                    'pointer-events-auto relative w-screen',
                    sizeClasses[size],
                    directionStyles.panel
                  )}
                >
                  <div
                    className={cn(
                      'flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-800 shadow-xl',
                      'border-l border-gray-200 dark:border-gray-700',
                      direction === 'left' &&
                        'border-l-0 border-r border-gray-200 dark:border-gray-700',
                      className
                    )}
                  >
                    {/* 关闭按钮 */}
                    {showCloseButton && (
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={onClose}
                        >
                          <span className="sr-only">关闭面板</span>
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}

                    {children}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

/**
 * SlideOver 头部组件
 */
export function SlideOverHeader({
  title,
  subtitle,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50',
        className
      )}
    >
      {children || (
        <div className="pr-8">
          {title && (
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </Dialog.Title>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SlideOver 主体组件
 */
export function SlideOverBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex-1 px-6 py-6 overflow-y-auto', className)}>
      {children}
    </div>
  );
}

/**
 * SlideOver 底部组件
 */
export function SlideOverFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50',
        'flex items-center justify-end space-x-3',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * 预设的设置面板
 */
export function SettingsSlideOver({
  isOpen,
  onClose,
  title = '设置',
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <SlideOver isOpen={isOpen} onClose={onClose} size="lg">
      <SlideOverHeader title={title} />
      <SlideOverBody>{children}</SlideOverBody>
      <SlideOverFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
        >
          关闭
        </button>
      </SlideOverFooter>
    </SlideOver>
  );
}
