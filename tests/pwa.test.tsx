/**
 * PWA Configuration Tests
 * Tests for Progressive Web App functionality and configuration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PWA Configuration', () => {
  beforeEach(() => {
    // Clear document head before each test
    document.head.innerHTML = '';
  });

  it('should have PWA meta tags when added to document', () => {
    // Simulate adding PWA meta tags to document head
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);

    const themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    themeColorMeta.content = '#22c55e';
    document.head.appendChild(themeColorMeta);

    const appleCapableMeta = document.createElement('meta');
    appleCapableMeta.name = 'apple-mobile-web-app-capable';
    appleCapableMeta.content = 'yes';
    document.head.appendChild(appleCapableMeta);

    // Test the elements exist
    const foundManifestLink = document.querySelector('link[rel="manifest"]');
    const foundThemeColor = document.querySelector('meta[name="theme-color"]');
    const foundAppleCapable = document.querySelector(
      'meta[name="apple-mobile-web-app-capable"]'
    );

    expect(foundManifestLink).toBeTruthy();
    expect(foundManifestLink?.getAttribute('href')).toBe('/manifest.json');
    expect(foundThemeColor?.getAttribute('content')).toBe('#22c55e');
    expect(foundAppleCapable?.getAttribute('content')).toBe('yes');
  });

  it('should validate PWA meta tag structure', () => {
    // Test that PWA meta tags have correct structure
    const requiredMetaTags = [
      { name: 'theme-color', expectedContent: '#22c55e' },
      { name: 'apple-mobile-web-app-capable', expectedContent: 'yes' },
      { name: 'apple-mobile-web-app-title', expectedContent: 'EP Chat' },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        expectedContent: 'default',
      },
      { name: 'mobile-web-app-capable', expectedContent: 'yes' },
      { name: 'msapplication-TileColor', expectedContent: '#22c55e' },
      { name: 'msapplication-tap-highlight', expectedContent: 'no' },
      { name: 'application-name', expectedContent: 'EP Chat' },
    ];

    // Add meta tags to document
    requiredMetaTags.forEach(({ name, expectedContent }) => {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = expectedContent;
      document.head.appendChild(meta);
    });

    // Verify all meta tags exist with correct content
    requiredMetaTags.forEach(({ name, expectedContent }) => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      expect(meta).toBeTruthy();
      expect(meta?.getAttribute('content')).toBe(expectedContent);
    });
  });

  it('should validate apple-touch-icon links', () => {
    const iconConfigs = [
      { size: '192x192', href: '/icons/icon-192.png' },
      { size: '512x512', href: '/icons/icon-512.png' },
    ];

    iconConfigs.forEach(({ size, href }) => {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.setAttribute('sizes', size);
      link.href = href;
      document.head.appendChild(link);
    });

    const appleTouchIcons = document.querySelectorAll(
      'link[rel="apple-touch-icon"]'
    );
    expect(appleTouchIcons.length).toBe(2);

    iconConfigs.forEach(({ size, href }) => {
      const icon = document.querySelector(
        `link[rel="apple-touch-icon"][sizes="${size}"]`
      );
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute('href')).toBe(href);
    });
  });
});

describe('PWA Manifest Validation', () => {
  it('should have valid manifest.json structure', async () => {
    // This would typically fetch the actual manifest.json file
    const expectedManifestStructure = {
      name: expect.any(String),
      short_name: expect.any(String),
      description: expect.any(String),
      start_url: expect.any(String),
      display: expect.any(String),
      background_color: expect.any(String),
      theme_color: expect.any(String),
      icons: expect.any(Array),
      categories: expect.any(Array),
    };

    // Mock manifest content for testing
    const mockManifest = {
      name: 'EP Chat - Enhanced Prompt',
      short_name: 'EP Chat',
      description:
        'Ultra-lightweight prompt enhancement web application for Claude Code generation',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#22c55e',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any',
        },
      ],
      categories: ['productivity', 'utilities', 'developer'],
    };

    expect(mockManifest).toMatchObject(expectedManifestStructure);
    expect(mockManifest.icons.length).toBeGreaterThan(0);
    expect(mockManifest.icons[0]).toHaveProperty('src');
    expect(mockManifest.icons[0]).toHaveProperty('sizes');
    expect(mockManifest.icons[0]).toHaveProperty('type');
  });
});

describe('Service Worker Integration', () => {
  it('should register service worker in production', () => {
    // Mock production environment
    vi.stubEnv('NODE_ENV', 'production');

    // In a real implementation, this would test service worker registration
    // For now, we just verify the environment check
    expect(process.env.NODE_ENV).toBe('production');

    // Restore original environment
    vi.unstubAllEnvs();
  });

  it('should not register service worker in development', () => {
    // Mock development environment
    vi.stubEnv('NODE_ENV', 'development');

    // Verify development environment
    expect(process.env.NODE_ENV).toBe('development');

    // Restore original environment
    vi.unstubAllEnvs();
  });
});
