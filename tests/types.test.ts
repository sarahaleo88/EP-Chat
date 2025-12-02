/**
 * Types Tests
 * Comprehensive test suite for lib/types.ts Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  LanguageSchema,
  ScenarioSchema,
  ModeSchema,
  DeepSeekModelSchema,
  TemplateConfigSchema,
  ApiResponseSchema,
} from '@/lib/types';

describe('LanguageSchema', () => {
  it('should accept valid languages', () => {
    expect(LanguageSchema.parse('zh')).toBe('zh');
    expect(LanguageSchema.parse('en')).toBe('en');
  });

  it('should reject invalid languages', () => {
    expect(() => LanguageSchema.parse('fr')).toThrow();
    expect(() => LanguageSchema.parse('')).toThrow();
  });
});

describe('ScenarioSchema', () => {
  it('should accept valid scenarios', () => {
    expect(ScenarioSchema.parse('code')).toBe('code');
    expect(ScenarioSchema.parse('web')).toBe('web');
  });

  it('should reject invalid scenarios', () => {
    expect(() => ScenarioSchema.parse('mobile')).toThrow();
  });
});

describe('ModeSchema', () => {
  it('should accept valid modes', () => {
    expect(ModeSchema.parse('full')).toBe('full');
    expect(ModeSchema.parse('minimal')).toBe('minimal');
  });

  it('should reject invalid modes', () => {
    expect(() => ModeSchema.parse('partial')).toThrow();
  });
});

describe('DeepSeekModelSchema', () => {
  it('should accept valid models', () => {
    expect(DeepSeekModelSchema.parse('deepseek-chat')).toBe('deepseek-chat');
    expect(DeepSeekModelSchema.parse('deepseek-coder')).toBe('deepseek-coder');
    expect(DeepSeekModelSchema.parse('deepseek-reasoner')).toBe('deepseek-reasoner');
  });

  it('should reject invalid models', () => {
    expect(() => DeepSeekModelSchema.parse('gpt-4')).toThrow();
  });
});

describe('TemplateConfigSchema', () => {
  const validConfig = {
    schemaVersion: '1.0',
    title: 'Test Template',
    scenario: 'code',
    lang: 'zh',
    mode: 'full',
    spec: {
      tech: {
        language: 'TypeScript',
        framework: 'React',
      },
      features: ['feature1'],
      io: {
        input: 'User input',
        output: 'Generated output',
      },
      codeRules: ['rule1'],
    },
  };

  it('should accept valid template config', () => {
    const result = TemplateConfigSchema.parse(validConfig);
    expect(result.title).toBe('Test Template');
  });

  it('should reject missing required fields', () => {
    expect(() => TemplateConfigSchema.parse({})).toThrow();
  });

  it('should reject empty title', () => {
    expect(() => TemplateConfigSchema.parse({ ...validConfig, title: '' })).toThrow();
  });

  it('should reject invalid scenario', () => {
    expect(() => TemplateConfigSchema.parse({ ...validConfig, scenario: 'invalid' })).toThrow();
  });
});

describe('ApiResponseSchema', () => {
  it('should accept success response', () => {
    const result = ApiResponseSchema.parse({ success: true, data: 'test' });
    expect(result.success).toBe(true);
  });

  it('should accept error response', () => {
    const result = ApiResponseSchema.parse({ success: false, error: 'Error message' });
    expect(result.success).toBe(false);
  });

  it('should accept response with stream flag', () => {
    const result = ApiResponseSchema.parse({ success: true, stream: true });
    expect(result.stream).toBe(true);
  });

  it('should reject missing success field', () => {
    expect(() => ApiResponseSchema.parse({})).toThrow();
  });
});

