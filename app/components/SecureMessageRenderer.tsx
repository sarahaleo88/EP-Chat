/**
 * 安全的消息渲染组件
 * 防止XSS攻击，清理用户输入内容
 */

'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SecureMessageRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean | undefined;
}

// DOMPurify配置选项
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'code', 'pre', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'a'
  ],
  ALLOWED_ATTR: ['href', 'title', 'target'],
  FORBID_ATTR: ['style', 'onload', 'onerror', 'onclick'],
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
  KEEP_CONTENT: true,
  // 只允许安全的链接
  ALLOWED_URI_REGEXP: /^https?:\/\/|^\/|^#/,
};

/**
 * 清理HTML内容，防止XSS
 */
function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') {
    // 服务端渲染时的简单清理
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

/**
 * 转义纯文本，防止HTML注入
 */
function escapeHTML(text: string): string {
  if (typeof window === 'undefined') {
    // 服务端渲染时的简单转义
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 检测内容是否包含HTML标签
 */
function containsHTML(content: string): boolean {
  return /<[^>]+>/g.test(content);
}

export default function SecureMessageRenderer({
  content,
  className = '',
  isStreaming = false
}: SecureMessageRendererProps) {
  // 缓存清理后的内容
  const sanitizedContent = useMemo(() => {
    if (!content) {
      return '';
    }

    // 如果内容包含HTML标签，进行清理
    if (containsHTML(content)) {
      return sanitizeHTML(content);
    }

    // 纯文本内容，转义HTML字符
    return escapeHTML(content);
  }, [content]);

  // 处理流式内容的闪烁光标
  const displayContent = useMemo(() => {
    if (isStreaming && content) {
      return sanitizedContent + '<span class="animate-pulse">▊</span>';
    }
    return sanitizedContent;
  }, [sanitizedContent, isStreaming, content]);

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{
        __html: displayContent
      }}
    />
  );
}

/**
 * 简化版本：仅用于纯文本渲染
 */
export function SecureTextRenderer({
  content,
  className = ''
}: {
  content: string;
  className?: string;
}) {
  const escapedContent = useMemo(() => {
    return escapeHTML(content || '');
  }, [content]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{
        __html: escapedContent
      }}
    />
  );
}

/**
 * Hook：用于清理用户输入
 */
export function useSanitizedInput(input: string): string {
  return useMemo(() => {
    if (!input) {
      return '';
    }

    if (typeof window === 'undefined') {
      // 服务端渲染时的简单清理
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    // 清理用户输入，移除危险标签
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }, [input]);
}