/**
 * Session Manager Tests
 * Comprehensive test suite for lib/session-manager.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock environment variables before importing the module
const originalEnv = process.env;

// We need to mock the module dynamically due to top-level env check
vi.mock('crypto-js', () => ({
  default: {
    AES: {
      encrypt: vi.fn((text: string, key: string) => ({
        toString: () => `encrypted:${text}:${key.slice(0, 5)}`,
      })),
      decrypt: vi.fn((encrypted: string, key: string) => ({
        toString: (encoding: any) => {
          if (encrypted.startsWith('encrypted:')) {
            const parts = encrypted.split(':');
            return parts[1] || '';
          }
          if (encrypted === 'invalid-encrypted') {
            return '';
          }
          return 'sk-decrypted-key';
        },
      })),
    },
    enc: {
      Utf8: 'utf8',
    },
  },
}));

describe('Session Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { 
      ...originalEnv, 
      SESSION_ENCRYPTION_KEY: 'test-encryption-key-12345',
      NODE_ENV: 'test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('decryptApiKey', () => {
    it('should decrypt valid encrypted key', async () => {
      const { decryptApiKey } = await import('@/lib/session-manager');
      const result = decryptApiKey('encrypted:sk-test-key:test-');
      expect(result).toBe('sk-test-key');
    });

    it('should return null for empty decryption result', async () => {
      const { decryptApiKey } = await import('@/lib/session-manager');
      const result = decryptApiKey('invalid-encrypted');
      expect(result).toBeNull();
    });
  });

  describe('getApiKeyFromSession', () => {
    it('should return null when no session cookie exists', async () => {
      const { getApiKeyFromSession } = await import('@/lib/session-manager');
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
      } as unknown as NextRequest;

      const result = getApiKeyFromSession(mockRequest);
      expect(result).toBeNull();
    });

    it('should return null when session cookie value is empty', async () => {
      const { getApiKeyFromSession } = await import('@/lib/session-manager');
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: '' }),
        },
      } as unknown as NextRequest;

      const result = getApiKeyFromSession(mockRequest);
      expect(result).toBeNull();
    });

    it('should return decrypted API key from valid session cookie', async () => {
      const { getApiKeyFromSession } = await import('@/lib/session-manager');
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'encrypted:sk-my-api-key:test-' }),
        },
      } as unknown as NextRequest;

      const result = getApiKeyFromSession(mockRequest);
      expect(result).toBe('sk-my-api-key');
    });
  });

  describe('isValidSession', () => {
    it('should return false when no API key in session', async () => {
      const { isValidSession } = await import('@/lib/session-manager');
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
      } as unknown as NextRequest;

      const result = isValidSession(mockRequest);
      expect(result).toBe(false);
    });

    it('should return true when valid API key exists in session', async () => {
      const { isValidSession } = await import('@/lib/session-manager');
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'encrypted:sk-valid-key:test-' }),
        },
      } as unknown as NextRequest;

      const result = isValidSession(mockRequest);
      expect(result).toBe(true);
    });
  });
});

describe('SessionManager client-side utilities', () => {
  const mockFetch = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    process.env = { 
      ...originalEnv, 
      SESSION_ENCRYPTION_KEY: 'test-encryption-key-12345',
      NODE_ENV: 'test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createSession', () => {
    it('should create session successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { SessionManager } = await import('@/lib/session-manager');
      const result = await SessionManager.createSession('sk-test-api-key');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: 'sk-test-api-key' }),
      });
    });

    it('should return error on failed session creation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid API key' }),
      });

      const { SessionManager } = await import('@/lib/session-manager');
      const result = await SessionManager.createSession('invalid-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { SessionManager } = await import('@/lib/session-manager');
      const result = await SessionManager.createSession('sk-test-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('validateSession', () => {
    it('should return authenticated status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true, hasApiKey: true }),
      });

      const { SessionManager } = await import('@/lib/session-manager');
      const result = await SessionManager.validateSession();

      expect(result.authenticated).toBe(true);
      expect(result.hasApiKey).toBe(true);
    });

    it('should return false on failed validation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { SessionManager } = await import('@/lib/session-manager');
      const result = await SessionManager.validateSession();

      expect(result.authenticated).toBe(false);
      expect(result.hasApiKey).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { SessionManager } = await import('@/lib/session-manager');
      const result = await SessionManager.validateSession();

      expect(result.authenticated).toBe(false);
      expect(result.hasApiKey).toBe(false);
    });
  });

  describe('destroySession', () => {
    it('should destroy session successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const { SessionManager } = await import('@/lib/session-manager');
      const result = await SessionManager.destroySession();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'DELETE',
      });
    });

    it('should return false on failed destruction', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const { SessionManager } = await import('@/lib/session-manager');
      const result = await SessionManager.destroySession();

      expect(result.success).toBe(false);
    });
  });

  describe('migrateFromLocalStorage', () => {
    it('should return migrated false when no localStorage key exists', async () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(null),
        removeItem: vi.fn(),
      };
      Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, writable: true });

      const { SessionManager } = await import('@/lib/session-manager');
      const result = await SessionManager.migrateFromLocalStorage();

      expect(result.success).toBe(true);
      expect(result.migrated).toBe(false);
    });

    it('should migrate existing localStorage key', async () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('sk-existing-key'),
        removeItem: vi.fn(),
      };
      Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, writable: true });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { SessionManager } = await import('@/lib/session-manager');
      const result = await SessionManager.migrateFromLocalStorage();

      expect(result.success).toBe(true);
      expect(result.migrated).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('deepseek-api-key');
    });
  });
});
