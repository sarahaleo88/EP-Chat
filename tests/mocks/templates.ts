/**
 * Mock Template System for Testing
 * Provides realistic template data for comprehensive testing
 */

import { vi } from 'vitest';

/**
 * Mock Template Data
 */
export const mockTemplates = {
  'code/zh/detailed': {
    schemaVersion: '1.0.0',
    title: 'TypeScript 代码生成模板',
    scenario: 'code' as const,
    lang: 'zh' as const,
    mode: 'full' as const,
    spec: {
      tech: {
        language: 'TypeScript',
        framework: 'Next.js',
      },
      features: ['类型安全', '错误处理', '性能优化'],
      io: {
        input: 'string',
        output: 'object',
      },
      codeRules: [
        '使用 TypeScript 严格模式',
        '添加完整的类型注解',
        '包含错误处理逻辑',
      ],
    },
  },
  'code/en/detailed': {
    schemaVersion: '1.0.0',
    title: 'TypeScript Code Generation Template',
    scenario: 'code' as const,
    lang: 'en' as const,
    mode: 'full' as const,
    spec: {
      tech: {
        language: 'TypeScript',
        framework: 'Next.js',
      },
      features: ['Type Safety', 'Error Handling', 'Performance'],
      io: {
        input: 'string',
        output: 'object',
      },
      codeRules: [
        'Use TypeScript strict mode',
        'Add complete type annotations',
        'Include error handling logic',
      ],
    },
  },
  'code/zh/concise': {
    schemaVersion: '1.0.0',
    title: 'TypeScript 简洁代码模板',
    scenario: 'code' as const,
    lang: 'zh' as const,
    mode: 'minimal' as const,
    spec: {
      tech: {
        language: 'TypeScript',
        framework: 'React',
      },
      features: ['简洁', '高效'],
      io: {
        input: 'string',
        output: 'string',
      },
      codeRules: ['保持代码简洁', '注重性能'],
    },
  },
  'writing/zh/detailed': {
    schemaVersion: '1.0.0',
    title: '技术写作模板',
    scenario: 'web' as const,
    lang: 'zh' as const,
    mode: 'full' as const,
    spec: {
      tech: {
        language: 'Markdown',
        framework: 'N/A',
      },
      features: ['结构化', '详细说明', '示例代码'],
      io: {
        input: 'string',
        output: 'string',
      },
      codeRules: ['使用清晰的标题', '提供具体示例'],
    },
  },
  'writing/en/detailed': {
    schemaVersion: '1.0.0',
    title: 'Technical Writing Template',
    scenario: 'web' as const,
    lang: 'en' as const,
    mode: 'full' as const,
    spec: {
      tech: {
        language: 'Markdown',
        framework: 'N/A',
      },
      features: ['Structured', 'Detailed', 'Examples'],
      io: {
        input: 'string',
        output: 'string',
      },
      codeRules: ['Use clear headings', 'Provide examples'],
    },
  },
  'analysis/zh/detailed': {
    schemaVersion: '1.0.0',
    title: '数据分析模板',
    scenario: 'code' as const,
    lang: 'zh' as const,
    mode: 'full' as const,
    spec: {
      tech: {
        language: 'Python',
        framework: 'pandas',
      },
      features: ['数据清洗', '统计分析', '可视化'],
      io: {
        input: 'CSV/JSON',
        output: 'Report',
      },
      codeRules: ['数据收集', '数据处理', '分析', '报告'],
    },
  },
};

/**
 * Mock loadTemplate function
 */
export const mockLoadTemplate = vi.fn().mockImplementation(
  async (scenario: string, lang: string, mode: string) => {
    const key = `${scenario}/${lang}/${mode}`;
    const template = mockTemplates[key as keyof typeof mockTemplates];
    
    if (template) {
      // Simulate async loading delay
      await new Promise(resolve => setTimeout(resolve, 1));
      return template;
    }
    
    return null; // Return null instead of throwing for graceful handling
  }
);

/**
 * Mock getTemplateRegistry function
 */
export const mockGetTemplateRegistry = vi.fn().mockImplementation(
  async (scenario: string) => {
    const templates = Object.entries(mockTemplates)
      .filter(([key]) => key.startsWith(scenario))
      .map(([key, template]) => ({
        id: key,
        ...template,
      }));
    
    return templates;
  }
);

/**
 * Mock validateTemplate function
 */
export const mockValidateTemplate = vi.fn().mockImplementation((template: any) => {
  if (!template) {
    return {
      isValid: false,
      errors: ['Template is null or undefined'],
      warnings: [],
    };
  }
  
  const errors = [];
  const warnings = [];
  
  if (!template.schemaVersion) errors.push('Missing schemaVersion');
  if (!template.title) errors.push('Missing title');
  if (!template.scenario) errors.push('Missing scenario');
  if (!template.lang) errors.push('Missing lang');
  if (!template.mode) errors.push('Missing mode');
  if (!template.spec) errors.push('Missing spec');
  
  if (!template.spec?.features?.length) {
    warnings.push('No features defined');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
});

/**
 * Mock searchTemplates function
 */
export const mockSearchTemplates = vi.fn().mockImplementation(
  async (query: string, scenario?: string) => {
    let templates = Object.entries(mockTemplates);
    
    if (scenario) {
      templates = templates.filter(([key]) => key.startsWith(scenario));
    }
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      templates = templates.filter(([key, template]) =>
        template.title.toLowerCase().includes(lowerQuery) ||
        key.toLowerCase().includes(lowerQuery)
      );
    }
    
    return templates.map(([key, template]) => ({
      id: key,
      ...template,
    }));
  }
);

/**
 * Mock getTemplateOptions function
 */
export const mockGetTemplateOptions = vi.fn().mockImplementation(
  async (scenario: string) => {
    const templates = await mockGetTemplateRegistry(scenario);
    
    return templates.map((template: any) => ({
      id: template.id,
      title: template.title,
      lang: template.lang,
      mode: template.mode,
      description: `${template.scenario} template for ${template.lang} in ${template.mode} mode`,
    }));
  }
);

/**
 * Mock getTemplateStats function
 */
export const mockGetTemplateStats = vi.fn().mockImplementation(async () => {
  const allTemplates = Object.entries(mockTemplates);
  
  const stats = {
    total: allTemplates.length,
    byScenario: {} as Record<string, number>,
    byLanguage: {} as Record<string, number>,
    byMode: {} as Record<string, number>,
  };
  
  allTemplates.forEach(([key, template]) => {
    stats.byScenario[template.scenario] = (stats.byScenario[template.scenario] || 0) + 1;
    stats.byLanguage[template.lang] = (stats.byLanguage[template.lang] || 0) + 1;
    stats.byMode[template.mode] = (stats.byMode[template.mode] || 0) + 1;
  });
  
  return stats;
});

/**
 * Mock clearTemplateCache function
 */
export const mockClearTemplateCache = vi.fn().mockImplementation((scenario?: string) => {
  // Mock cache clearing - no actual implementation needed for tests
  return true;
});

/**
 * Setup template mocks
 */
export function setupTemplateMocks() {
  vi.doMock('@/lib/template-registry', () => ({
    loadTemplate: mockLoadTemplate,
    getTemplateRegistry: mockGetTemplateRegistry,
    validateTemplate: mockValidateTemplate,
    searchTemplates: mockSearchTemplates,
    getTemplateOptions: mockGetTemplateOptions,
    getTemplateStats: mockGetTemplateStats,
    clearTemplateCache: mockClearTemplateCache,
  }));
}

/**
 * Reset template mocks
 */
export function resetTemplateMocks() {
  mockLoadTemplate.mockClear();
  mockGetTemplateRegistry.mockClear();
  mockValidateTemplate.mockClear();
  mockSearchTemplates.mockClear();
  mockGetTemplateOptions.mockClear();
  mockGetTemplateStats.mockClear();
  mockClearTemplateCache.mockClear();
}

/**
 * Get mock template by key
 */
export function getMockTemplate(scenario: string, lang: string, mode: string) {
  const key = `${scenario}/${lang}/${mode}`;
  return mockTemplates[key as keyof typeof mockTemplates] || null;
}
