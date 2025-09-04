/**
 * CSRF API Client Tests
 * Comprehensive test suite for CSRF-aware API client functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CSRFApiClient, getCSRFApiClient, csrfFetch, csrfPost } from '@/lib/csrf-client';
import { CSRF_CONSTANTS } from '@/lib/csrf';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CSRF API Client', () => {
  let client: CSRFApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new CSRFApiClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CSRFApiClient', () => {
    describe('initialization', () => {
      it('should initialize with null token and zero expiry', () => {
        expect(client['csrfToken']).toBe(null);
        expect(client['tokenExpiry']).toBe(0);
      });

      it('should fetch token on initialize', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'test-token',
            expires: Date.now() + 1000000,
          }),
        });

        await client.initialize();

        expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token', {
          method: 'GET',
          credentials: 'include',
        });
        expect(client['csrfToken']).toBe('test-token');
      });
    });

    describe('refreshCSRFToken', () => {
      it('should fetch and store new token on success', async () => {
        const mockToken = 'new-token';
        const mockExpires = Date.now() + 1000000;

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: mockToken,
            expires: mockExpires,
          }),
        });

        await client.refreshCSRFToken();

        expect(client['csrfToken']).toBe(mockToken);
        expect(client['tokenExpiry']).toBe(mockExpires);
      });

      it('should handle fetch failure gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await client.refreshCSRFToken();

        expect(client['csrfToken']).toBe(null);
        expect(client['tokenExpiry']).toBe(0);
        expect(consoleSpy).toHaveBeenCalledWith('[CSRF Client] Failed to fetch CSRF token');

        consoleSpy.mockRestore();
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await client.refreshCSRFToken();

        expect(client['csrfToken']).toBe(null);
        expect(client['tokenExpiry']).toBe(0);
        expect(consoleSpy).toHaveBeenCalledWith('[CSRF Client] Error fetching CSRF token:', expect.any(Error));

        consoleSpy.mockRestore();
      });
    });

    describe('isTokenValid', () => {
      it('should return false when token is null', () => {
        client['csrfToken'] = null;
        client['tokenExpiry'] = Date.now() + 1000000;
        expect(client['isTokenValid']()).toBe(false);
      });

      it('should return false when token is expired', () => {
        client['csrfToken'] = 'test-token';
        client['tokenExpiry'] = Date.now() - 1000;
        expect(client['isTokenValid']()).toBe(false);
      });

      it('should return true when token is valid and not expired', () => {
        client['csrfToken'] = 'test-token';
        client['tokenExpiry'] = Date.now() + 1000000;
        expect(client['isTokenValid']()).toBe(true);
      });
    });

    describe('getCSRFToken', () => {
      it('should return existing valid token', async () => {
        client['csrfToken'] = 'valid-token';
        client['tokenExpiry'] = Date.now() + 1000000;

        const token = await client.getCSRFToken();
        expect(token).toBe('valid-token');
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should refresh expired token', async () => {
        client['csrfToken'] = 'expired-token';
        client['tokenExpiry'] = Date.now() - 1000;

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'new-token',
            expires: Date.now() + 1000000,
          }),
        });

        const token = await client.getCSRFToken();
        expect(token).toBe('new-token');
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    describe('requiresCSRFToken', () => {
      it('should return true for POST method', () => {
        expect(client['requiresCSRFToken']('POST')).toBe(true);
      });

      it('should return true for PUT method', () => {
        expect(client['requiresCSRFToken']('PUT')).toBe(true);
      });

      it('should return true for PATCH method', () => {
        expect(client['requiresCSRFToken']('PATCH')).toBe(true);
      });

      it('should return true for DELETE method', () => {
        expect(client['requiresCSRFToken']('DELETE')).toBe(true);
      });

      it('should return false for GET method', () => {
        expect(client['requiresCSRFToken']('GET')).toBe(false);
      });

      it('should return false for undefined method', () => {
        expect(client['requiresCSRFToken'](undefined)).toBe(false);
      });

      it('should handle case insensitive methods', () => {
        expect(client['requiresCSRFToken']('post')).toBe(true);
        expect(client['requiresCSRFToken']('get')).toBe(false);
      });
    });

    describe('createSecureOptions', () => {
      beforeEach(() => {
        client['csrfToken'] = 'test-token';
        client['tokenExpiry'] = Date.now() + 1000000;
      });

      it('should add CSRF token for POST requests', async () => {
        const options = await client.createSecureOptions({ method: 'POST' });
        
        expect(options.credentials).toBe('include');
        expect(options.headers).toHaveProperty('Content-Type', 'application/json');
        expect(options.headers).toHaveProperty(CSRF_CONSTANTS.TOKEN_HEADER, 'test-token');
      });

      it('should not add CSRF token for GET requests', async () => {
        const options = await client.createSecureOptions({ method: 'GET' });
        
        expect(options.credentials).toBe('include');
        expect(options.headers).not.toHaveProperty(CSRF_CONSTANTS.TOKEN_HEADER);
      });

      it('should preserve existing headers', async () => {
        const options = await client.createSecureOptions({
          method: 'POST',
          headers: { 'Custom-Header': 'value' },
        });
        
        expect(options.headers).toHaveProperty('Custom-Header', 'value');
        expect(options.headers).toHaveProperty(CSRF_CONSTANTS.TOKEN_HEADER, 'test-token');
      });

      it('should refresh token if needed', async () => {
        client['csrfToken'] = null;
        client['tokenExpiry'] = 0;

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'refreshed-token',
            expires: Date.now() + 1000000,
          }),
        });

        const options = await client.createSecureOptions({ method: 'POST' });
        
        expect(options.headers).toHaveProperty(CSRF_CONSTANTS.TOKEN_HEADER, 'refreshed-token');
      });
    });

    describe('secureFetch', () => {
      beforeEach(() => {
        client['csrfToken'] = 'test-token';
        client['tokenExpiry'] = Date.now() + 1000000;
      });

      it('should make secure request with CSRF token', async () => {
        const mockResponse = { ok: true, status: 200 };
        mockFetch.mockResolvedValueOnce(mockResponse);

        const response = await client.secureFetch('/api/test', { method: 'POST' });

        expect(mockFetch).toHaveBeenCalledWith('/api/test', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            [CSRF_CONSTANTS.TOKEN_HEADER]: 'test-token',
          },
        });
        expect(response).toBe(mockResponse);
      });

      it('should retry on CSRF token invalid error', async () => {
        // First request fails with CSRF error
        const failedResponse = {
          status: 403,
          clone: () => ({
            json: async () => ({ code: 'CSRF_TOKEN_INVALID' }),
          }),
        };

        // Second request succeeds
        const successResponse = { ok: true, status: 200 };

        mockFetch
          .mockResolvedValueOnce(failedResponse)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              token: 'new-token',
              expires: Date.now() + 1000000,
            }),
          })
          .mockResolvedValueOnce(successResponse);

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const response = await client.secureFetch('/api/test', { method: 'POST' });

        expect(mockFetch).toHaveBeenCalledTimes(3); // Original + token refresh + retry
        expect(response).toBe(successResponse);
        expect(consoleSpy).toHaveBeenCalledWith('[CSRF Client] CSRF token invalid, refreshing and retrying...');

        consoleSpy.mockRestore();
      });

      it('should handle non-CSRF 403 errors normally', async () => {
        const failedResponse = {
          status: 403,
          clone: () => ({
            json: async () => ({ code: 'FORBIDDEN' }),
          }),
        };

        mockFetch.mockResolvedValueOnce(failedResponse);

        const response = await client.secureFetch('/api/test', { method: 'POST' });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(response).toBe(failedResponse);
      });

      it('should handle fetch errors', async () => {
        const error = new Error('Network error');
        mockFetch.mockRejectedValueOnce(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(client.secureFetch('/api/test', { method: 'POST' })).rejects.toThrow('Network error');
        expect(consoleSpy).toHaveBeenCalledWith('[CSRF Client] Secure fetch error:', error);

        consoleSpy.mockRestore();
      });
    });

    describe('HTTP method helpers', () => {
      beforeEach(() => {
        client['csrfToken'] = 'test-token';
        client['tokenExpiry'] = Date.now() + 1000000;
        mockFetch.mockResolvedValue({ ok: true, status: 200 });
      });

      it('should make POST request', async () => {
        const data = { test: 'data' };
        await client.post('/api/test', data);

        expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        }));
      });

      it('should make PUT request', async () => {
        const data = { test: 'data' };
        await client.put('/api/test', data);

        expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        }));
      });

      it('should make PATCH request', async () => {
        const data = { test: 'data' };
        await client.patch('/api/test', data);

        expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data),
        }));
      });

      it('should make DELETE request', async () => {
        await client.delete('/api/test');

        expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
          method: 'DELETE',
        }));
      });

      it('should make GET request without CSRF token', async () => {
        await client.get('/api/test');

        expect(mockFetch).toHaveBeenCalledWith('/api/test', {
          method: 'GET',
          credentials: 'include',
        });
      });
    });
  });

  describe('Global client functions', () => {
    beforeEach(() => {
      // Reset global client
      (global as any).globalCSRFClient = null;
    });

    describe('getCSRFApiClient', () => {
      it('should create and initialize global client', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'global-token',
            expires: Date.now() + 1000000,
          }),
        });

        const client1 = await getCSRFApiClient();
        const client2 = await getCSRFApiClient();

        expect(client1).toBe(client2); // Should return same instance
        expect(mockFetch).toHaveBeenCalledTimes(1); // Should initialize only once
      });
    });

    describe('csrfFetch', () => {
      it('should use global client for requests', async () => {
        // Clear any existing client state
        const client = getCSRFApiClient();
        client.token = null;
        client.tokenExpiry = 0;

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              token: 'global-token',
              expires: Date.now() + 1000000,
            }),
          })
          .mockResolvedValueOnce({ ok: true, status: 200 });

        await csrfFetch('/api/test', { method: 'POST' });

        // Should fetch token first, then make the actual request
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/csrf-token', expect.any(Object));
        expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/test', expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-CSRF-Token': 'global-token',
          }),
        }));
      });
    });

    describe('csrfPost', () => {
      it('should make POST request with data', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              token: 'global-token',
              expires: Date.now() + 1000000,
            }),
          })
          .mockResolvedValueOnce({ ok: true, status: 200 });

        const data = { test: 'data' };
        await csrfPost('/api/test', data);

        expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        }));
      });
    });
  });
});
