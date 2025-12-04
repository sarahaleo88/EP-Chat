/**
 * EP 工具函数库
 * 提供通用的工具函数和辅助方法
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Language, I18nTexts } from './types';

/**
 * 合并 Tailwind CSS 类名
 * @param inputs - 类名输入
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 延迟执行函数
 * @param ms - 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 防抖函数
 * @param func - 要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 * @param func - 要节流的函数
 * @param limit - 限制时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 复制文本到剪贴板
 * @param text - 要复制的文本
 * @returns 是否成功复制
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('复制到剪贴板失败:', error);
    }
    return false;
  }
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 生成随机 ID
 * @param length - ID 长度
 * @returns 随机 ID 字符串
 */
export function generateId(length: number = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 验证环境变量
 * @param key - 环境变量键名
 * @returns 环境变量值
 * @throws 如果环境变量不存在则抛出错误
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`缺少必需的环境变量: ${key}`);
  }
  return value;
}

/**
 * 安全的 JSON 解析
 * @param json - JSON 字符串
 * @param fallback - 解析失败时的默认值
 * @returns 解析结果或默认值
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * 国际化文本获取
 * @param texts - 国际化文本对象
 * @param lang - 语言
 * @param key - 文本键
 * @param fallback - 默认文本
 * @returns 本地化文本
 */
export function getI18nText(
  texts: I18nTexts,
  lang: Language,
  key: string,
  fallback: string = key
): string {
  const langTexts = texts[lang];
  const enTexts = texts.en;
  return langTexts?.[key] ?? enTexts?.[key] ?? fallback;
}

/**
 * 检查是否为移动设备
 * @returns 是否为移动设备
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') {return false;}
  return window.innerWidth < 768;
}

/**
 * 获取用户首选语言
 * @returns 语言代码
 */
export function getPreferredLanguage(): Language {
  if (typeof window === 'undefined') {return 'en';}

  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('zh')) {return 'zh';}
  return 'en';
}

/**
 * 计算文本 token 数量（粗略估算）
 * @param text - 文本内容
 * @returns token 数量
 */
export function estimateTokens(text: string): number {
  // 粗略估算：英文约 4 字符 = 1 token，中文约 1.5 字符 = 1 token
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}
