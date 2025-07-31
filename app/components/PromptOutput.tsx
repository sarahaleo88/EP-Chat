/**
 * 提示输出组件
 * 支持流式响应显示和复制功能
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn, copyToClipboard } from '@/lib/utils';
import { getPromptStats } from '@/lib/prompt-generator';
import LoadingSpinner from './LoadingSpinner';

interface PromptOutputProps {
  content: string;
  isStreaming?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onClear?: () => void;
  className?: string;
}

/**
 * 提示输出组件
 * @param content - 输出内容
 * @param isStreaming - 是否流式输出
 * @param isLoading - 是否加载中
 * @param error - 错误信息
 * @param onClear - 清除回调
 * @param className - 自定义样式类
 * @returns JSX 元素
 */
export default function PromptOutput({
  content,
  isStreaming = false,
  isLoading = false,
  error = null,
  onClear,
  className,
}: PromptOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 自动滚动到底部（流式输出时）
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      const element = contentRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [content, isStreaming]);

  // 监听滚动位置
  useEffect(() => {
    const element = contentRef.current;
    if (!element) {return;}

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      setShowScrollTop(scrollTop > 100 && scrollHeight > clientHeight + 100);
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * 复制内容到剪贴板
   */
  const handleCopy = useCallback(async () => {
    if (!content.trim()) {return;}

    const success = await copyToClipboard(content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  /**
   * 滚动到顶部
   */
  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /**
   * 切换展开状态
   */
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // 计算内容统计
  const stats = content ? getPromptStats(content) : null;
  const hasContent = content.trim().length > 0;
  const isLongContent = content.length > 1000;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            生成结果
          </h3>

          {/* 状态指示器 */}
          {isLoading && (
            <div className="flex items-center space-x-2 text-shamrock-600 dark:text-shamrock-400">
              <LoadingSpinner size="sm" showText={false} />
              <span className="text-xs">生成中...</span>
            </div>
          )}

          {isStreaming && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs">流式输出</span>
            </div>
          )}
        </div>

        {/* 工具按钮 */}
        <div className="flex items-center space-x-2">
          {/* 统计信息 */}
          {stats && (
            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              {stats.characters.toLocaleString()} 字符 ·{' '}
              {stats.estimatedTokens.toLocaleString()} tokens
            </div>
          )}

          {/* 展开/收起按钮 */}
          {isLongContent && (
            <button
              onClick={toggleExpanded}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              title={isExpanded ? '收起' : '展开'}
            >
              <svg
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}

          {/* 复制按钮 */}
          <button
            onClick={handleCopy}
            disabled={!hasContent}
            className={cn(
              'p-1.5 rounded-md transition-all duration-200',
              'hover:bg-gray-200 dark:hover:bg-gray-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              copied
                ? 'text-shamrock-600 dark:text-shamrock-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
            title={copied ? '已复制' : '复制内容'}
          >
            {copied ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>

          {/* 清除按钮 */}
          {onClear && hasContent && (
            <button
              onClick={onClear}
              className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              title="清除内容"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div
        ref={contentRef}
        className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900"
      >
        {/* 错误状态 */}
        {error && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                生成失败
              </h4>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && !hasContent && (
          <div className="flex-1 flex items-center justify-center p-8">
            <LoadingSpinner size="lg" text="正在生成提示..." />
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && !error && !hasContent && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                等待生成
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                请在下方输入您的需求并点击生成按钮
              </p>
            </div>
          </div>
        )}

        {/* 内容显示 */}
        {hasContent && (
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                  {content}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 回到顶部按钮 */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="absolute bottom-4 right-4 p-2 bg-shamrock-500 hover:bg-shamrock-600 text-white rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
            title="回到顶部"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 复制成功提示 */}
      {copied && (
        <div className="absolute top-16 right-4 bg-shamrock-500 text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg animate-fade-in">
          已复制到剪贴板
        </div>
      )}
    </div>
  );
}
