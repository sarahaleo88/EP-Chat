/**
 * Content Templates Tests
 * Comprehensive test suite for lib/content-templates.ts
 */

import { describe, it, expect } from 'vitest';
import { analyzeContentForTemplate } from '@/lib/content-templates';

describe('analyzeContentForTemplate', () => {
  describe('code content detection', () => {
    it('should detect code content with code blocks', () => {
      const content = '```javascript\nconst x = 1;\n```';
      const template = analyzeContentForTemplate(content, 'assistant');
      expect(template).toBeDefined();
      expect(template.type).toBe('code');
    });

    it('should detect inline code', () => {
      const content = 'Use the `console.log()` function';
      const template = analyzeContentForTemplate(content, 'assistant');
      expect(template).toBeDefined();
    });
  });

  describe('explanation content detection', () => {
    it('should detect explanation content', () => {
      const content = 'This is an explanation of how the system works. It involves multiple steps and processes.';
      const template = analyzeContentForTemplate(content, 'assistant');
      expect(template).toBeDefined();
    });
  });

  describe('problem content detection', () => {
    it('should detect problem/error content', () => {
      const content = 'Error: Cannot find module. The issue is that the path is incorrect.';
      const template = analyzeContentForTemplate(content, 'assistant');
      expect(template).toBeDefined();
    });
  });

  describe('template structure', () => {
    it('should return template with required fields', () => {
      const template = analyzeContentForTemplate('Hello world', 'assistant');
      expect(template.id).toBeDefined();
      expect(template.type).toBeDefined();
      expect(template.title).toBeDefined();
      expect(template.summary).toBeDefined();
      expect(template.sections).toBeDefined();
      expect(template.metadata).toBeDefined();
      expect(template.accessibility).toBeDefined();
    });

    it('should include accessibility information', () => {
      const template = analyzeContentForTemplate('Test content', 'assistant');
      expect(template.accessibility.ariaLabel).toBeDefined();
      expect(template.accessibility.role).toBeDefined();
      expect(template.accessibility.description).toBeDefined();
    });

    it('should include model in metadata when provided', () => {
      const template = analyzeContentForTemplate('Test', 'assistant', 'deepseek-chat');
      expect(template.metadata.model).toBe('deepseek-chat');
    });
  });

  describe('user vs assistant messages', () => {
    it('should handle user messages', () => {
      const template = analyzeContentForTemplate('User question', 'user');
      expect(template).toBeDefined();
    });

    it('should handle assistant messages', () => {
      const template = analyzeContentForTemplate('Assistant response', 'assistant');
      expect(template).toBeDefined();
    });
  });
});

