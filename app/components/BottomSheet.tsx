/**
 * BottomSheet 组件
 * 底部弹出面板，专为移动端垂直滚动体验优化
 */

'use client';

import { Fragment, ReactNode, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

// BottomSheet 高度类型
export type SheetHeight = 'auto' | 'half' | 'full';

// BottomSheet 基础属性
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  height?: SheetHeight;
  className?: string;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  showHandle?: boolean;
  snapPoints?: number[];
}

// 高度样式映射
const heightClasses: Record<SheetHeight, string> = {
  auto: 'max-h-[80vh]',
  half: 'h-[50vh]',
  full: 'h-[90vh]',
};

/**
 * BottomSheet 主组件
 */
export function BottomSheet({
  isOpen,
  onClose,
  height = 'auto',
  className,
  children,
  closeOnBackdrop = true,
  showHandle = true,
}: BottomSheetProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 在桌面端使用普通对话框
  if (!isMobile) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeOnBackdrop ? onClose : () => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className={cn(
                    'w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all',
                    'border border-gray-200 dark:border-gray-700',
                    className
                  )}
                >
                  {children}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  // 移动端底部弹出
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeOnBackdrop ? onClose : () => {}}>
        {/* 背景遮罩 */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* BottomSheet 容器 */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-x-0 bottom-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-y-full"
                enterTo="translate-y-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-y-0"
                leaveTo="translate-y-full"
              >
                <Dialog.Panel
                  className={cn(
                    'pointer-events-auto w-full',
                    heightClasses[height]
                  )}
                >
                  <div className={cn(
                    'flex flex-col bg-white dark:bg-gray-800 shadow-2xl rounded-t-2xl',
                    'border-t border-l border-r border-gray-200 dark:border-gray-700',
                    heightClasses[height],
                    className
                  )}>
                    {/* 拖拽手柄 */}
                    {showHandle && (
                      <div className="flex justify-center py-3">
                        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
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
 * BottomSheet 头部组件
 */
export function BottomSheetHeader({
  title,
  subtitle,
  className,
  children,
  showCloseButton = true,
  onClose,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  children?: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  return (
    <div className={cn(
      'px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50',
      className
    )}>
      <div className="flex items-center justify-between">
        {children || (
          <div>
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
        
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * BottomSheet 主体组件
 */
export function BottomSheetBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(
      'flex-1 px-6 py-4 overflow-y-auto',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * BottomSheet 底部组件
 */
export function BottomSheetFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(
      'px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50',
      'flex items-center justify-end space-x-3',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * 预设的操作面板
 */
export function ActionBottomSheet({
  isOpen,
  onClose,
  title,
  actions,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'primary';
    icon?: ReactNode;
  }>;
}) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="auto">
      {title && (
        <BottomSheetHeader title={title} onClose={onClose} />
      )}
      <BottomSheetBody>
        <div className="space-y-2">
          {actions.map((action, index) => {
            const variantStyles = {
              default: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
              danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
              primary: 'text-clover-600 dark:text-clover-400 hover:bg-clover-50 dark:hover:bg-clover-900/20',
            };

            return (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className={cn(
                  'w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors',
                  variantStyles[action.variant || 'default']
                )}
              >
                {action.icon && (
                  <span className="flex-shrink-0">
                    {action.icon}
                  </span>
                )}
                <span className="font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </BottomSheetBody>
    </BottomSheet>
  );
}
