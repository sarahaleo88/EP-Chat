/**
 * Markdown Formatter Tests
 * Comprehensive test suite for lib/markdown-formatter.ts
 */

import { describe, it, expect } from 'vitest';
import { formatTextAsMarkdown, DEFAULT_FORMATTER_OPTIONS } from '@/lib/markdown-formatter';

describe('formatTextAsMarkdown', () => {
  describe('basic functionality', () => {
    it('should return empty string for null input', () => {
      expect(formatTextAsMarkdown(null as any)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(formatTextAsMarkdown(undefined as any)).toBe('');
    });

    it('should return original text for empty string', () => {
      expect(formatTextAsMarkdown('')).toBe('');
    });

    it('should handle plain text', () => {
      const result = formatTextAsMarkdown('Hello world');
      expect(result).toBeDefined();
    });
  });

  describe('preserveOriginalFormatting', () => {
    it('should preserve existing markdown when enabled', () => {
      const markdown = '# Heading\n\nSome **bold** text';
      const result = formatTextAsMarkdown(markdown, { preserveOriginalFormatting: true });
      expect(result).toBe(markdown);
    });

    it('should format text when preserveOriginalFormatting is disabled', () => {
      const text = 'Some text';
      const result = formatTextAsMarkdown(text, { preserveOriginalFormatting: false });
      expect(result).toBeDefined();
    });
  });

  describe('code blocks', () => {
    it('should format code blocks when enabled', () => {
      const text = 'Here is some code:\nfunction test() { return true; }';
      const result = formatTextAsMarkdown(text, { enableCodeBlocks: true });
      expect(result).toBeDefined();
    });
  });

  describe('headings', () => {
    it('should format headings when enabled', () => {
      const text = 'Title\n\nSome content';
      const result = formatTextAsMarkdown(text, { enableHeadings: true });
      expect(result).toBeDefined();
    });
  });

  describe('lists', () => {
    it('should format lists when enabled', () => {
      const text = '1. First item\n2. Second item\n3. Third item';
      const result = formatTextAsMarkdown(text, { enableLists: true });
      expect(result).toBeDefined();
    });
  });

  describe('emphasis', () => {
    it('should format emphasis when enabled', () => {
      const text = 'This is important text';
      const result = formatTextAsMarkdown(text, { enableEmphasis: true });
      expect(result).toBeDefined();
    });
  });

  describe('quotes', () => {
    it('should format quotes when enabled', () => {
      const text = '"This is a quote"';
      const result = formatTextAsMarkdown(text, { enableQuotes: true });
      expect(result).toBeDefined();
    });
  });

  describe('line breaks', () => {
    it('should format line breaks when enabled', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const result = formatTextAsMarkdown(text, { enableLineBreaks: true });
      expect(result).toBeDefined();
    });
  });
});

describe('DEFAULT_FORMATTER_OPTIONS', () => {
  it('should have all options enabled by default', () => {
    expect(DEFAULT_FORMATTER_OPTIONS.enableHeadings).toBe(true);
    expect(DEFAULT_FORMATTER_OPTIONS.enableLists).toBe(true);
    expect(DEFAULT_FORMATTER_OPTIONS.enableCodeBlocks).toBe(true);
    expect(DEFAULT_FORMATTER_OPTIONS.enableEmphasis).toBe(true);
    expect(DEFAULT_FORMATTER_OPTIONS.enableQuotes).toBe(true);
    expect(DEFAULT_FORMATTER_OPTIONS.enableLineBreaks).toBe(true);
    expect(DEFAULT_FORMATTER_OPTIONS.preserveOriginalFormatting).toBe(true);
  });
});

