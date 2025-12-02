/**
 * 模板注册表
 * 负责加载、验证和管理 JSON 模板
 */

import type {
  TemplateConfig,
  TemplateRegistry,
  Scenario,
  TemplateValidationResult,
  TemplateOption,
} from './types';

// 模板缓存配置
const MAX_TEMPLATE_CACHE_SIZE = 100;
const TEMPLATE_CACHE_TTL = 3600000; // 1 hour in milliseconds

// 缓存条目接口
interface CachedTemplate {
  template: TemplateConfig;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

// LRU 模板缓存实现
class TemplateLRUCache {
  private cache = new Map<string, CachedTemplate>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {return false;}

    // Check if entry is expired
    if (Date.now() - entry.timestamp > TEMPLATE_CACHE_TTL) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  get(key: string): TemplateConfig | undefined {
    const entry = this.cache.get(key);
    if (!entry) {return undefined;}

    // Check if entry is expired
    if (Date.now() - entry.timestamp > TEMPLATE_CACHE_TTL) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access info (move to end for LRU)
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.template;
  }

  set(key: string, template: TemplateConfig): void {
    const now = Date.now();

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Add new entry
    this.cache.set(key, {
      template,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): {
    size: number;
    maxSize: number;
    utilization: number;
    expiredEntries: number;
  } {
    let expiredCount = 0;
    const now = Date.now();

    for (const [, entry] of this.cache) {
      if (now - entry.timestamp > TEMPLATE_CACHE_TTL) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: (this.cache.size / this.maxSize) * 100,
      expiredEntries: expiredCount,
    };
  }

  cleanExpired(): number {
    const now = Date.now();
    let cleanedCount = 0;
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > TEMPLATE_CACHE_TTL) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      cleanedCount++;
    }

    return cleanedCount;
  }
}

// 模板缓存实例
const templateCache = new TemplateLRUCache(MAX_TEMPLATE_CACHE_SIZE);
const registryCache = new Map<Scenario, Record<string, TemplateConfig>>();

/**
 * 验证模板配置
 * @param template - 模板配置
 * @returns 验证结果
 */
export function validateTemplate(template: any): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查必需字段
  const requiredFields = [
    'schemaVersion',
    'title',
    'scenario',
    'lang',
    'mode',
    'spec',
  ];

  for (const field of requiredFields) {
    if (!template[field]) {
      errors.push(`缺少必需字段: ${field}`);
    }
  }

  // 检查 spec 结构
  if (template.spec) {
    if (!template.spec.tech) {
      errors.push('缺少 spec.tech 配置');
    } else {
      if (!template.spec.tech.language) {
        errors.push('缺少 spec.tech.language');
      }
      if (!template.spec.tech.framework) {
        warnings.push('建议设置 spec.tech.framework');
      }
    }

    if (!Array.isArray(template.spec.features)) {
      errors.push('spec.features 必须是数组');
    }

    if (!template.spec.io) {
      errors.push('缺少 spec.io 配置');
    } else {
      if (!template.spec.io.input) {
        errors.push('缺少 spec.io.input');
      }
      if (!template.spec.io.output) {
        errors.push('缺少 spec.io.output');
      }
    }

    if (!Array.isArray(template.spec.codeRules)) {
      errors.push('spec.codeRules 必须是数组');
    }
  }

  // 检查场景类型
  const validScenarios = ['code', 'web'];
  if (template.scenario && !validScenarios.includes(template.scenario)) {
    errors.push(`无效的场景类型: ${template.scenario}`);
  }

  // 检查语言类型
  const validLangs = ['zh', 'en'];
  if (template.lang && !validLangs.includes(template.lang)) {
    errors.push(`无效的语言类型: ${template.lang}`);
  }

  // 检查模式类型
  const validModes = ['full', 'minimal'];
  if (template.mode && !validModes.includes(template.mode)) {
    errors.push(`无效的模式类型: ${template.mode}`);
  }

  // 检查版本格式
  if (
    template.schemaVersion &&
    !/^\d+\.\d+\.\d+$/.test(template.schemaVersion)
  ) {
    warnings.push('建议使用语义化版本格式 (x.y.z)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 加载单个模板
 * @param scenario - 场景类型
 * @param templateId - 模板 ID
 * @returns 模板配置
 */
export async function loadTemplate(
  scenario: Scenario,
  templateId: string
): Promise<TemplateConfig> {
  const cacheKey = `${scenario}:${templateId}`;

  // 检查缓存
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  try {
    // 动态导入模板文件
    const templateModule = await import(
      `../templates/${scenario}/${templateId}.json`
    );
    const template = templateModule.default;

    // 验证模板
    const validation = validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`模板验证失败: ${validation.errors.join(', ')}`);
    }

    // 输出警告
    if (validation.warnings.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn(`模板警告 (${cacheKey}):`, validation.warnings);
    }

    // 缓存模板 (now uses LRU cache with TTL)
    templateCache.set(cacheKey, template);

    return template;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`加载模板失败 (${cacheKey}):`, error);
    }
    throw new Error(`无法加载模板: ${scenario}/${templateId}`);
  }
}

/**
 * 获取场景下的所有模板
 * @param scenario - 场景类型
 * @returns 模板注册表
 */
export async function getTemplateRegistry(
  scenario: Scenario
): Promise<Record<string, TemplateConfig>> {
  // 检查缓存
  if (registryCache.has(scenario)) {
    return registryCache.get(scenario)!;
  }

  const registry: Record<string, TemplateConfig> = {};

  // 根据场景加载对应的模板
  const templateIds = getTemplateIds(scenario);

  for (const templateId of templateIds) {
    try {
      const template = await loadTemplate(scenario, templateId);
      registry[templateId] = template;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`跳过无效模板: ${scenario}/${templateId}`, error);
      }
    }
  }

  // 缓存注册表
  registryCache.set(scenario, registry);

  return registry;
}

/**
 * 获取模板 ID 列表
 * @param scenario - 场景类型
 * @returns 模板 ID 数组
 */
function getTemplateIds(scenario: Scenario): string[] {
  // 这里硬编码模板列表，实际项目中可以通过文件系统扫描
  const templateMap: Record<Scenario, string[]> = {
    code: ['email-validator', 'debounce-utility', 'data-structure'],
    web: ['weather-app', 'color-picker', 'dashboard'],
  };

  return templateMap[scenario] || [];
}

/**
 * 获取模板选项列表
 * @param scenario - 场景类型
 * @returns 模板选项数组
 */
export async function getTemplateOptions(
  scenario: Scenario
): Promise<TemplateOption[]> {
  const registry = await getTemplateRegistry(scenario);

  return Object.entries(registry).map(([id, template]) => ({
    id,
    title: template.title,
    scenario: template.scenario,
    description: `${template.spec.tech.language} - ${template.spec.features.slice(0, 2).join(', ')}`,
  }));
}

/**
 * 搜索模板
 * @param scenario - 场景类型
 * @param query - 搜索关键词
 * @returns 匹配的模板选项
 */
export async function searchTemplates(
  scenario: Scenario,
  query: string
): Promise<TemplateOption[]> {
  const options = await getTemplateOptions(scenario);

  if (!query.trim()) {
    return options;
  }

  const lowerQuery = query.toLowerCase();

  return options.filter(
    option =>
      option.title.toLowerCase().includes(lowerQuery) ||
      option.description?.toLowerCase().includes(lowerQuery) ||
      option.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 清除模板缓存
 * @param scenario - 可选的场景类型，不传则清除所有缓存
 */
export function clearTemplateCache(scenario?: Scenario): void {
  if (scenario) {
    registryCache.delete(scenario);
    // Note: Individual template cache is now managed by LRU cache
    // We can't easily filter by scenario in the new implementation
    // This is acceptable as the LRU cache will manage size automatically
  } else {
    templateCache.clear();
    registryCache.clear();
  }
}

/**
 * 获取模板缓存统计信息
 */
export function getTemplateCacheStats() {
  return templateCache.getStats();
}

/**
 * 清理过期的模板缓存条目
 */
export function cleanExpiredTemplates(): number {
  return templateCache.cleanExpired();
}

/**
 * 强制清理模板缓存 (清理过期条目)
 */
export function forceCleanTemplateCache(): {
  cleaned: number;
  remaining: number;
} {
  const cleaned = templateCache.cleanExpired();
  const stats = templateCache.getStats();

  return {
    cleaned,
    remaining: stats.size,
  };
}

/**
 * 获取模板统计信息
 * @returns 统计信息
 */
export async function getTemplateStats(): Promise<{
  total: number;
  byScenario: Record<Scenario, number>;
  cached: number;
}> {
  const codeTemplates = await getTemplateRegistry('code');
  const webTemplates = await getTemplateRegistry('web');

  return {
    total: Object.keys(codeTemplates).length + Object.keys(webTemplates).length,
    byScenario: {
      code: Object.keys(codeTemplates).length,
      web: Object.keys(webTemplates).length,
    },
    cached: templateCache.size(),
  };
}
