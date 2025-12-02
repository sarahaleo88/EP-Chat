/**
 * Runtime Validation Tests
 * Comprehensive test suite for lib/runtime-validation.ts
 */

import { describe, it, expect } from 'vitest';
import {
  DeepSeekRequestSchema,
  TemplateConfigSchema,
  CSRFTokenSchema,
  APIResponseSchema,
  EnvironmentSchema,
  RuntimeValidator,
} from '@/lib/runtime-validation';

describe('DeepSeekRequestSchema', () => {
  it('should validate valid request', () => {
    const validRequest = {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello' }],
    };
    expect(() => DeepSeekRequestSchema.parse(validRequest)).not.toThrow();
  });

  it('should reject invalid model', () => {
    const invalidRequest = {
      model: 'invalid-model',
      messages: [{ role: 'user', content: 'Hello' }],
    };
    expect(() => DeepSeekRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should reject empty messages array', () => {
    const invalidRequest = {
      model: 'deepseek-chat',
      messages: [],
    };
    expect(() => DeepSeekRequestSchema.parse(invalidRequest)).toThrow();
  });

  it('should validate optional parameters', () => {
    const validRequest = {
      model: 'deepseek-coder',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
      top_p: 0.9,
    };
    expect(() => DeepSeekRequestSchema.parse(validRequest)).not.toThrow();
  });

  it('should reject temperature out of range', () => {
    const invalidRequest = {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 3,
    };
    expect(() => DeepSeekRequestSchema.parse(invalidRequest)).toThrow();
  });
});

describe('TemplateConfigSchema', () => {
  it('should validate valid template config', () => {
    const validConfig = {
      id: 'test-template',
      name: 'Test Template',
      description: 'A test template',
      scenario: 'code',
      language: 'zh',
      mode: 'detailed',
      spec: {
        systemPrompt: 'You are a helpful assistant',
        userPromptTemplate: 'Please help with: {{input}}',
      },
    };
    expect(() => TemplateConfigSchema.parse(validConfig)).not.toThrow();
  });

  it('should reject invalid scenario', () => {
    const invalidConfig = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      scenario: 'invalid',
      language: 'zh',
      mode: 'detailed',
      spec: {
        systemPrompt: 'Test',
        userPromptTemplate: 'Test',
      },
    };
    expect(() => TemplateConfigSchema.parse(invalidConfig)).toThrow();
  });
});

describe('CSRFTokenSchema', () => {
  it('should validate valid CSRF token', () => {
    const validToken = {
      token: 'a'.repeat(32),
      expires: Date.now() + 3600000,
    };
    expect(() => CSRFTokenSchema.parse(validToken)).not.toThrow();
  });

  it('should reject short token', () => {
    const invalidToken = {
      token: 'short',
      expires: Date.now() + 3600000,
    };
    expect(() => CSRFTokenSchema.parse(invalidToken)).toThrow();
  });
});

describe('APIResponseSchema', () => {
  it('should validate success response', () => {
    const response = { success: true, data: { result: 'ok' } };
    expect(() => APIResponseSchema.parse(response)).not.toThrow();
  });

  it('should validate error response', () => {
    const response = { success: false, error: 'Something went wrong' };
    expect(() => APIResponseSchema.parse(response)).not.toThrow();
  });
});

describe('EnvironmentSchema', () => {
  it('should validate valid environment', () => {
    const env = { NODE_ENV: 'production' };
    expect(() => EnvironmentSchema.parse(env)).not.toThrow();
  });

  it('should validate with API key', () => {
    const env = { NODE_ENV: 'development', DEEPSEEK_API_KEY: 'sk-test-key' };
    expect(() => EnvironmentSchema.parse(env)).not.toThrow();
  });
});

describe('RuntimeValidator', () => {
  describe('validateDeepSeekRequest', () => {
    it('should return success for valid request', () => {
      const result = RuntimeValidator.validateDeepSeekRequest({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return errors for invalid request', () => {
      const result = RuntimeValidator.validateDeepSeekRequest({
        model: 'invalid',
        messages: [],
      });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });
});

