/**
 * 提示输入组件
 * 支持多行输入和 Cmd+Enter 提交
 */

'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { InlineSpinner } from './LoadingSpinner';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  maxLength?: number;
  className?: string;
}

/**
 * 提示输入组件
 * @param value - 输入值
 * @param onChange - 值变化回调
 * @param onSubmit - 提交回调
 * @param placeholder - 占位符文本
 * @param disabled - 是否禁用
 * @param loading - 是否加载中
 * @param maxLength - 最大长度
 * @param className - 自定义样式类
 * @returns JSX 元素
 */
export default function PromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = '请输入您的需求描述...',
  disabled = false,
  loading = false,
  maxLength = 5000,
  className,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  /**
   * 处理键盘事件
   * @param event - 键盘事件
   */
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter 或 Ctrl+Enter 提交
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!disabled && !loading && value.trim()) {
        onSubmit();
      }
    }
  }, [disabled, loading, value, onSubmit]);

  /**
   * 自动调整文本域高度
   */
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    }
  }, []);

  /**
   * 处理输入变化
   * @param event - 输入事件
   */
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
      // 延迟调整高度以确保内容已更新
      setTimeout(adjustTextareaHeight, 0);
    }
  }, [onChange, maxLength, adjustTextareaHeight]);

  /**
   * 处理焦点事件
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // 计算字符统计
  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isAtLimit = characterCount >= maxLength;

  return (
    <div className={cn('relative', className)}>
      {/* 输入标签 */}
      <label htmlFor="prompt-input" className="sr-only">
        提示输入
      </label>

      {/* 文本域容器 */}
      <div
        className={cn(
          'relative rounded-lg border transition-all duration-200',
          isFocused
            ? 'border-shamrock-500 ring-2 ring-shamrock-500/20'
            : 'border-gray-200 dark:border-gray-600',
          disabled && 'opacity-50 cursor-not-allowed',
          'bg-gray-50 dark:bg-gray-700'
        )}
      >
        {/* 主要文本域 */}
        <textarea
          ref={textareaRef}
          id="prompt-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={cn(
            'w-full min-h-[80px] max-h-[200px] p-3 pr-12',
            'bg-transparent border-none outline-none resize-none',
            'text-gray-900 dark:text-gray-100',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'leading-relaxed',
            disabled && 'cursor-not-allowed'
          )}
          style={{ height: 'auto' }}
        />

        {/* 字符计数 */}
        <div
          className={cn(
            'absolute bottom-2 right-3 text-xs font-medium transition-colors duration-200',
            isAtLimit
              ? 'text-red-500'
              : isNearLimit
              ? 'text-yellow-500'
              : 'text-gray-400 dark:text-gray-500'
          )}
        >
          {characterCount}/{maxLength}
        </div>
      </div>

      {/* 快捷键提示 */}
      {!disabled && !loading && (
        <div className="mt-2 px-1">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                ⌘
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                Enter
              </kbd>
              <span>提交</span>
            </span>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {isAtLimit && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            已达到最大字符限制，请精简您的输入内容。
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 简化版提示输入组件
 * 用于对话或简单场景
 */
export function SimplePromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = '输入消息...',
  disabled = false,
  loading = false,
}: Omit<PromptInputProps, 'maxLength' | 'className'>) {
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && !loading && value.trim()) {
        onSubmit();
      }
    }
  }, [disabled, loading, value, onSubmit]);

  return (
    <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || loading || !value.trim()}
        className="p-1.5 bg-shamrock-500 hover:bg-shamrock-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {loading ? (
          <InlineSpinner size="sm" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </div>
  );
}
