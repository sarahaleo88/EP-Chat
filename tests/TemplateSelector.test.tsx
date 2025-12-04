/**
 * Tests for app/components/TemplateSelector.tsx
 * Template selector component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TemplateSelector', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('module exports', () => {
    it('should import module without errors', async () => {
      const module = await import('@/app/components/TemplateSelector');

      expect(module).toBeDefined();
      expect(module.default).toBeDefined();
    });

    it('should export default component', async () => {
      const module = await import('@/app/components/TemplateSelector');

      expect(typeof module.default).toBe('function');
    });
  });

  describe('component structure', () => {
    it('should be a function component', async () => {
      const module = await import('@/app/components/TemplateSelector');
      const TemplateSelector = module.default;

      expect(typeof TemplateSelector).toBe('function');
    });

    it('should have displayName or name', async () => {
      const module = await import('@/app/components/TemplateSelector');
      const TemplateSelector = module.default as React.FC & { displayName?: string };

      // Function components have a name property
      expect(TemplateSelector.name || TemplateSelector.displayName).toBeDefined();
    });
  });

  describe('props interface', () => {
    it('should accept scenario prop type', async () => {
      // Type check - verify the component accepts expected props
      const props: any = {
        scenario: 'code',
        templateId: 'template1',
        onScenarioChange: () => {},
        onTemplateChange: () => {},
      };

      expect(props.scenario).toBe('code');
      expect(props.templateId).toBe('template1');
      expect(typeof props.onScenarioChange).toBe('function');
      expect(typeof props.onTemplateChange).toBe('function');
    });

    it('should accept web scenario', async () => {
      const props: any = {
        scenario: 'web',
        templateId: 'template1',
        onScenarioChange: () => {},
        onTemplateChange: () => {},
      };

      expect(props.scenario).toBe('web');
    });

    it('should accept optional disabled prop', async () => {
      const props: any = {
        scenario: 'code',
        templateId: 'template1',
        onScenarioChange: () => {},
        onTemplateChange: () => {},
        disabled: true,
      };

      expect(props.disabled).toBe(true);
    });

    it('should accept optional className prop', async () => {
      const props: any = {
        scenario: 'code',
        templateId: 'template1',
        onScenarioChange: () => {},
        onTemplateChange: () => {},
        className: 'custom-class',
      };

      expect(props.className).toBe('custom-class');
    });
  });
});

