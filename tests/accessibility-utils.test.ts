/**
 * Tests for lib/accessibility-utils.ts
 * WCAG 2.1 AA accessibility utilities tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Accessibility Utils', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('AriaLiveRegionManager', () => {
    it('should be a singleton', async () => {
      const { AriaLiveRegionManager } = await import('@/lib/accessibility-utils');
      
      const instance1 = AriaLiveRegionManager.getInstance();
      const instance2 = AriaLiveRegionManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should have announce method', async () => {
      const { AriaLiveRegionManager } = await import('@/lib/accessibility-utils');
      
      const manager = AriaLiveRegionManager.getInstance();
      
      expect(typeof manager.announce).toBe('function');
    });

    it('should have announceError method', async () => {
      const { AriaLiveRegionManager } = await import('@/lib/accessibility-utils');
      
      const manager = AriaLiveRegionManager.getInstance();
      
      expect(typeof manager.announceError).toBe('function');
    });
  });

  describe('ScreenReaderUtils', () => {
    it('should generate message description', async () => {
      const { ScreenReaderUtils } = await import('@/lib/accessibility-utils');
      
      const template = {
        id: 'test',
        type: 'info',
        title: 'Test',
        summary: 'Test summary',
        sections: [
          { id: 's1', type: 'text', title: 'Section', content: 'Content', collapsible: false }
        ],
        accessibility: { role: 'region', ariaLabel: 'Test' }
      };
      
      const description = ScreenReaderUtils.generateMessageDescription(template as any);
      
      expect(description).toContain('1 sections');
      expect(typeof description).toBe('string');
    });

    it('should generate navigation instructions', async () => {
      const { ScreenReaderUtils } = await import('@/lib/accessibility-utils');
      
      const template = {
        sections: [{ collapsible: true }]
      };
      
      const instructions = ScreenReaderUtils.generateNavigationInstructions(template as any);
      
      expect(instructions).toContain('arrow keys');
    });

    it('should generate content summary with reading time', async () => {
      const { ScreenReaderUtils } = await import('@/lib/accessibility-utils');
      
      const template = {
        summary: 'Test content',
        sections: [
          { content: 'This is a test section with some content words.' }
        ]
      };
      
      const summary = ScreenReaderUtils.generateContentSummary(template as any);
      
      expect(summary).toContain('reading time');
    });
  });

  describe('ColorContrastUtils', () => {
    it('should calculate relative luminance', async () => {
      const { ColorContrastUtils } = await import('@/lib/accessibility-utils');
      
      const whiteLuminance = ColorContrastUtils.getRelativeLuminance('#FFFFFF');
      const blackLuminance = ColorContrastUtils.getRelativeLuminance('#000000');
      
      expect(whiteLuminance).toBeCloseTo(1, 1);
      expect(blackLuminance).toBeCloseTo(0, 1);
    });

    it('should calculate contrast ratio', async () => {
      const { ColorContrastUtils } = await import('@/lib/accessibility-utils');
      
      const ratio = ColorContrastUtils.getContrastRatio('#FFFFFF', '#000000');
      
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should validate WCAG AA compliance', async () => {
      const { ColorContrastUtils } = await import('@/lib/accessibility-utils');
      
      // Black on white should pass AA
      expect(ColorContrastUtils.meetsWCAGAA('#000000', '#FFFFFF')).toBe(true);
      
      // Light gray on white might fail
      const lightGrayResult = ColorContrastUtils.meetsWCAGAA('#CCCCCC', '#FFFFFF');
      expect(typeof lightGrayResult).toBe('boolean');
    });

    it('should validate WCAG AAA compliance', async () => {
      const { ColorContrastUtils } = await import('@/lib/accessibility-utils');
      
      // Black on white should pass AAA
      expect(ColorContrastUtils.meetsWCAGAAA('#000000', '#FFFFFF')).toBe(true);
    });
  });

  describe('AccessibilityTestUtils', () => {
    it('should check keyboard accessibility', async () => {
      const { AccessibilityTestUtils } = await import('@/lib/accessibility-utils');
      
      expect(typeof AccessibilityTestUtils.isKeyboardAccessible).toBe('function');
    });

    it('should check proper labeling', async () => {
      const { AccessibilityTestUtils } = await import('@/lib/accessibility-utils');
      
      expect(typeof AccessibilityTestUtils.hasProperLabeling).toBe('function');
    });

    it('should validate ARIA relationships', async () => {
      const { AccessibilityTestUtils } = await import('@/lib/accessibility-utils');
      
      expect(typeof AccessibilityTestUtils.validateAriaRelationships).toBe('function');
    });
  });

  describe('AriaAttributesGenerator', () => {
    it('should generate message attributes', async () => {
      const { AriaAttributesGenerator } = await import('@/lib/accessibility-utils');
      
      const template = {
        id: 'test',
        accessibility: { role: 'region', ariaLabel: 'Test message' }
      };
      
      const attrs = AriaAttributesGenerator.generateMessageAttributes(template as any);
      
      expect(attrs.role).toBe('region');
      expect(attrs['aria-label']).toBe('Test message');
    });
  });
});

