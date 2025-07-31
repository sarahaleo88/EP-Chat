/**
 * 模板注册表测试
 * 测试模板加载、验证和管理功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateTemplate,
  loadTemplate,
  getTemplateRegistry,
  getTemplateOptions,
  searchTemplates,
  clearTemplateCache,
  getTemplateStats,
} from '@/lib/template-registry';
import type { TemplateConfig, Scenario } from '@/lib/types';

// 模拟模板数据
const mockValidTemplate: TemplateConfig = {
  schemaVersion: '1.0.0',
  title: 'Test Email Validator',
  scenario: 'code',
  lang: 'zh',
  mode: 'full',
  spec: {
    tech: {
      language: 'TypeScript',
      framework: 'N/A',
    },
    features: ['Email validation', 'Batch processing'],
    io: {
      input: 'string | string[]',
      output: 'ValidationResult[]',
    },
    codeRules: ['Use TypeScript', 'Add JSDoc comments'],
  },
};

const mockInvalidTemplate = {
  title: 'Invalid Template',
  // 缺少必需字段
};

// 模拟动态导入
vi.mock('../templates/code/email-validator.json', () => ({
  default: mockValidTemplate,
}));

vi.mock('../templates/code/invalid-template.json', () => ({
  default: mockInvalidTemplate,
}));

describe('Template Registry', () => {
  beforeEach(() => {
    clearTemplateCache();
  });

  describe('validateTemplate', () => {
    it('应该验证有效模板', () => {
      const result = validateTemplate(mockValidTemplate);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测缺少必需字段', () => {
      const result = validateTemplate(mockInvalidTemplate);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少必需字段: schemaVersion');
      expect(result.errors).toContain('缺少必需字段: scenario');
    });

    it('应该验证场景类型', () => {
      const invalidScenarioTemplate = {
        ...mockValidTemplate,
        scenario: 'invalid-scenario',
      };

      const result = validateTemplate(invalidScenarioTemplate);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('无效的场景类型: invalid-scenario');
    });

    it('应该验证语言类型', () => {
      const invalidLangTemplate = {
        ...mockValidTemplate,
        lang: 'invalid-lang',
      };

      const result = validateTemplate(invalidLangTemplate);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('无效的语言类型: invalid-lang');
    });

    it('应该验证模式类型', () => {
      const invalidModeTemplate = {
        ...mockValidTemplate,
        mode: 'invalid-mode',
      };

      const result = validateTemplate(invalidModeTemplate);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('无效的模式类型: invalid-mode');
    });

    it('应该验证 spec 结构', () => {
      const invalidSpecTemplate = {
        ...mockValidTemplate,
        spec: {
          // 缺少必需的 spec 字段
        },
      };

      const result = validateTemplate(invalidSpecTemplate);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少 spec.tech 配置');
      expect(result.errors).toContain('spec.features 必须是数组');
    });

    it('应该生成警告信息', () => {
      const templateWithWarnings = {
        ...mockValidTemplate,
        schemaVersion: 'invalid-version-format',
        spec: {
          ...mockValidTemplate.spec,
          tech: {
            language: 'TypeScript',
            // 缺少 framework
          },
        },
      };

      const result = validateTemplate(templateWithWarnings);

      expect(result.warnings).toContain('建议使用语义化版本格式 (x.y.z)');
      expect(result.warnings).toContain('建议设置 spec.tech.framework');
    });
  });

  describe('loadTemplate', () => {
    it('应该成功加载有效模板', async () => {
      const template = await loadTemplate('code', 'email-validator');

      expect(template).toEqual(mockValidTemplate);
    });

    it('应该缓存加载的模板', async () => {
      // 第一次加载
      const template1 = await loadTemplate('code', 'email-validator');

      // 第二次加载应该从缓存获取
      const template2 = await loadTemplate('code', 'email-validator');

      expect(template1).toBe(template2);
    });

    it('应该处理不存在的模板', async () => {
      await expect(loadTemplate('code', 'non-existent')).rejects.toThrow(
        '无法加载模板: code/non-existent'
      );
    });

    it('应该处理无效模板', async () => {
      await expect(loadTemplate('code', 'invalid-template')).rejects.toThrow(
        '无法加载模板: code/invalid-template'
      );
    });
  });

  describe('getTemplateRegistry', () => {
    it('应该获取场景下的所有模板', async () => {
      const registry = await getTemplateRegistry('code');

      expect(registry).toHaveProperty('email-validator');
      expect(registry['email-validator']).toEqual(mockValidTemplate);
    });

    it('应该缓存注册表', async () => {
      // 第一次获取
      const registry1 = await getTemplateRegistry('code');

      // 第二次获取应该从缓存获取
      const registry2 = await getTemplateRegistry('code');

      expect(registry1).toBe(registry2);
    });

    it('应该跳过无效模板', async () => {
      const registry = await getTemplateRegistry('code');

      // 无效模板不应该出现在注册表中
      expect(registry).not.toHaveProperty('invalid-template');
    });
  });

  describe('getTemplateOptions', () => {
    it('应该返回模板选项列表', async () => {
      const options = await getTemplateOptions('code');

      expect(options).toHaveLength(3);
      expect(options).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'email-validator'
          })
        ])
      );
    });
  });

  describe('searchTemplates', () => {
    it('应该根据关键词搜索模板', async () => {
      const results = await searchTemplates('code', 'email');

      expect(results).toHaveLength(1);
      expect(results[0]!.title).toContain('Email');
    });

    it('应该返回所有模板当查询为空时', async () => {
      const results = await searchTemplates('code', '');

      expect(results).toHaveLength(3);
    });

    it('应该进行不区分大小写的搜索', async () => {
      const results = await searchTemplates('code', 'EMAIL');

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('应该在描述中搜索', async () => {
      const results = await searchTemplates('code', 'TypeScript');

      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clearTemplateCache', () => {
    it('应该清除所有缓存', async () => {
      // 先加载一些模板到缓存
      await loadTemplate('code', 'email-validator');
      await getTemplateRegistry('code');

      // 清除缓存
      clearTemplateCache();

      // 验证缓存已清除（这里我们通过重新加载来间接验证）
      const template = await loadTemplate('code', 'email-validator');
      expect(template).toEqual(mockValidTemplate);
    });

    it('应该清除特定场景的缓存', async () => {
      // 加载模板
      await loadTemplate('code', 'email-validator');

      // 清除特定场景缓存
      clearTemplateCache('code');

      // 验证可以重新加载
      const template = await loadTemplate('code', 'email-validator');
      expect(template).toEqual(mockValidTemplate);
    });
  });

  describe('getTemplateStats', () => {
    it('应该返回模板统计信息', async () => {
      const stats = await getTemplateStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byScenario');
      expect(stats).toHaveProperty('cached');
      expect(stats.byScenario).toHaveProperty('code');
      expect(stats.byScenario).toHaveProperty('web');
    });
  });
});
