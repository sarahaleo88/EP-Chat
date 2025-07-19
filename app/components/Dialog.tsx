/**
 * Dialog/Modal 组件系统
 * 基于 Headless UI，支持垂直滚动和响应式设计
 */

'use client';

import { Fragment, ReactNode } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

// Dialog 尺寸类型
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Dialog 位置类型
export type DialogPosition = 'center' | 'top' | 'bottom';

// Dialog 基础属性
interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  size?: DialogSize;
  position?: DialogPosition;
  className?: string;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

// 尺寸样式映射
const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

// 位置样式映射
const positionClasses: Record<DialogPosition, string> = {
  center: 'items-center justify-center',
  top: 'items-start justify-center pt-16',
  bottom: 'items-end justify-center pb-16',
};

/**
 * 基础 Dialog 组件
 */
export function Dialog({
  isOpen,
  onClose,
  size = 'md',
  position = 'center',
  className,
  children,
  closeOnBackdrop = true,
  showCloseButton = true,
}: BaseDialogProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog
        as="div"
        className="relative z-50"
        onClose={closeOnBackdrop ? onClose : () => {}}
      >
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

        {/* Dialog 容器 */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className={cn(
            'flex min-h-full p-4',
            positionClasses[position]
          )}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all',
                  'border border-gray-200 dark:border-gray-700',
                  sizeClasses[size],
                  className
                )}
              >
                {/* 关闭按钮 */}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {children}
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

/**
 * Dialog 头部组件
 */
export function DialogHeader({
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
    <div className={cn(
      'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
      className
    )}>
      {children || (
        <div>
          {title && (
            <HeadlessDialog.Title
              as="h3"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </HeadlessDialog.Title>
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
 * Dialog 主体组件
 */
export function DialogBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(
      'px-6 py-4 max-h-96 overflow-y-auto',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Dialog 底部组件
 */
export function DialogFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(
      'px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl',
      'flex items-center justify-end space-x-3',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * 预设的确认对话框
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message = '您确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}) {
  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    info: 'bg-clover-500 hover:bg-clover-600 text-white',
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="sm">
      <DialogHeader title={title} />
      <DialogBody>
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>
      </DialogBody>
      <DialogFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            variantStyles[variant]
          )}
        >
          {confirmText}
        </button>
      </DialogFooter>
    </Dialog>
  );
}
