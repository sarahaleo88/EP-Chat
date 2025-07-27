/**
 * 提示生成器测试
 * 测试提示生成、验证和统计功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generatePrompt,
  validatePromptSpec,
  getPromptPreview,
  getPromptStats,
} from '@/lib/prompt-generator';
import type { EpPromptSpec } from '@/lib/types';

describe('Prompt Generator', () => {
  let mockSpec: EpPromptSpec;

  beforeEach(() => {
    mockSpec = (global as any).createMockPromptSpec();
  });

  describe('generatePrompt', () => {
    it('应该生成完整的提示', () => {
      const prompt = generatePrompt(mockSpec);

      expect(prompt).toContain('[EP_META]');
      expect(prompt).toContain('EP 增强提示元数据');
      expect(prompt).toContain('场景: CODE');
      expect(prompt).toContain('语言: ZH');
      expect(prompt).toContain('模式: FULL');
      expect(prompt).toContain('模型: deepseek-chat');
      expect(prompt).toContain('Test Template');
    });

    it('应该包含模板规范', () => {
      const prompt = generatePrompt(mockSpec);

      expect(prompt).toContain('## 技术栈');
      expect(prompt).toContain('TypeScript');
      expect(prompt).toContain('## 功能特性');
      expect(prompt).toContain('Feature 1');
      expect(prompt).toContain('## 输入输出');
      expect(prompt).toContain('string');
      expect(prompt).toContain('## 代码规范');
      expect(prompt).toContain('Rule 1');
    });

    it('应该包含用户输入', () => {
      const prompt = generatePrompt(mockSpec);

      expect(prompt).toContain('## 用户输入');
      expect(prompt).toContain('Test user input');
    });

    it('应该包含最终指令', () => {
      const prompt = generatePrompt(mockSpec);

      expect(prompt).toContain('## 请根据以上信息生成完整的项目代码');
      expect(prompt).toContain('请生成一个完整的、可运行的代码项目');
    });

    it('应该支持英文生成', () => {
      const englishSpec = {
        ...mockSpec,
        lang: 'en' as const,
      };

      const prompt = generatePrompt(englishSpec);

      expect(prompt).toContain('EP Enhanced Prompt Metadata');
      expect(prompt).toContain('Scenario: CODE');
      expect(prompt).toContain('Language: EN');
      expect(prompt).toContain('## Tech Stack');
      expect(prompt).toContain('## Features');
      expect(prompt).toContain('## Input/Output');
      expect(prompt).toContain('## Code Rules');
    });

    it('应该支持 Web 场景', () => {
      const webSpec = {
        ...mockSpec,
        scenario: 'web' as const,
      };

      const prompt = generatePrompt(webSpec);

      expect(prompt).toContain('场景: WEB');
      expect(prompt).toContain('请生成一个完整的 Web 应用项目');
      expect(prompt).toContain('响应式设计');
      expect(prompt).toContain('组件化架构');
    });

    it('应该支持精简模式', () => {
      const minimalSpec = {
        ...mockSpec,
        mode: 'minimal' as const,
      };

      const prompt = generatePrompt(minimalSpec);

      expect(prompt).toContain('模式: MINIMAL');
    });

    it('应该可以禁用元数据', () => {
      const prompt = generatePrompt(mockSpec, { includeMetadata: false });

      expect(prompt).not.toContain('[EP_META]');
      expect(prompt).not.toContain('EP 增强提示元数据');
    });

    it('应该优化过长的提示', () => {
      const longInputSpec = {
        ...mockSpec,
        userInput: 'x'.repeat(10000), // 很长的输入
      };

      const prompt = generatePrompt(longInputSpec, { maxTokens: 1000 });

      // 应该被截断
      expect(prompt.length).toBeLessThan(5000); // 粗略估算
    });
  });

  describe('validatePromptSpec', () => {
    it('应该验证有效的提示规范', () => {
      const result = validatePromptSpec(mockSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测缺少的必需字段', () => {
      const invalidSpec = {
        ...mockSpec,
        scenario: undefined as any,
      };

      const result = validatePromptSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少场景类型');
    });

    it('应该检测空的用户输入', () => {
      const emptyInputSpec = {
        ...mockSpec,
        userInput: '',
      };

      const result = validatePromptSpec(emptyInputSpec);

      expect(result.valid).toBe(true); // 仍然有效
      expect(result.warnings).toContain('用户输入为空，将使用模板默认配置');
    });

    it('应该检测过长的用户输入', () => {
      const longInputSpec = {
        ...mockSpec,
        userInput: 'x'.repeat(6000),
      };

      const result = validatePromptSpec(longInputSpec);

      expect(result.valid).toBe(true); // 仍然有效
      expect(result.warnings).toContain('用户输入过长，可能影响生成质量');
    });

    it('应该验证所有必需字段', () => {
      const incompleteSpec = {
        scenario: undefined,
        lang: undefined,
        mode: undefined,
        template: undefined,
        model: undefined,
        userInput: 'test',
      } as any;

      const result = validatePromptSpec(incompleteSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少场景类型');
      expect(result.errors).toContain('缺少语言设置');
      expect(result.errors).toContain('缺少模式设置');
      expect(result.errors).toContain('缺少模板配置');
      expect(result.errors).toContain('缺少模型设置');
    });
  });

  describe('getPromptPreview', () => {
    it('应该返回提示预览', () => {
      const preview = getPromptPreview(mockSpec, 100);

      expect(preview.length).toBeLessThanOrEqual(100);
      expect(preview).toContain('技术栈');
    });

    it('应该在内容较短时返回完整内容', () => {
      const shortSpec = {
        ...mockSpec,
        userInput: 'short',
      };

      const preview = getPromptPreview(shortSpec, 10000);
      const fullPrompt = generatePrompt(shortSpec, { includeMetadata: false });

      expect(preview).toBe(fullPrompt);
    });

    it('应该在内容较长时添加省略号', () => {
      const preview = getPromptPreview(mockSpec, 50);

      expect(preview.endsWith('...')).toBe(true);
    });
  });

  describe('getPromptStats', () => {
    it('应该返回提示统计信息', () => {
      const prompt = generatePrompt(mockSpec);
      const stats = getPromptStats(prompt);

      expect(stats).toHaveProperty('characters');
      expect(stats).toHaveProperty('words');
      expect(stats).toHaveProperty('lines');
      expect(stats).toHaveProperty('estimatedTokens');

      expect(stats.characters).toBeGreaterThan(0);
      expect(stats.words).toBeGreaterThan(0);
      expect(stats.lines).toBeGreaterThan(0);
      expect(stats.estimatedTokens).toBeGreaterThan(0);
    });

    it('应该正确计算字符数', () => {
      const testPrompt = 'Hello World';
      const stats = getPromptStats(testPrompt);

      expect(stats.characters).toBe(11);
    });

    it('应该正确计算单词数', () => {
      const testPrompt = 'Hello World Test';
      const stats = getPromptStats(testPrompt);

      expect(stats.words).toBe(3);
    });

    it('应该正确计算行数', () => {
      const testPrompt = 'Line 1\nLine 2\nLine 3';
      const stats = getPromptStats(testPrompt);

      expect(stats.lines).toBe(3);
    });

    it('应该估算 token 数量', () => {
      const testPrompt = 'Hello World'; // 大约 3 tokens
      const stats = getPromptStats(testPrompt);

      expect(stats.estimatedTokens).toBeGreaterThan(0);
      expect(stats.estimatedTokens).toBeLessThan(10);
    });

    it('应该处理空字符串', () => {
      const stats = getPromptStats('');

      expect(stats.characters).toBe(0);
      expect(stats.words).toBe(0);
      expect(stats.lines).toBe(1); // 空字符串仍然有一行
      expect(stats.estimatedTokens).toBe(0);
    });

    it('应该处理中文内容', () => {
      const chinesePrompt = '你好世界';
      const stats = getPromptStats(chinesePrompt);

      expect(stats.characters).toBe(4);
      expect(stats.words).toBe(1); // 中文按词分割可能不准确，但这是预期行为
      expect(stats.estimatedTokens).toBeGreaterThan(0);
    });
  });
});
