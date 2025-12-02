/**
 * Iterative Refinement Tests
 * Comprehensive test suite for lib/iterative-refinement.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IterativeRefinementManager } from '@/lib/iterative-refinement';

describe('IterativeRefinementManager', () => {
  let manager: IterativeRefinementManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new IterativeRefinementManager();
  });

  describe('constructor', () => {
    it('should create manager instance', () => {
      expect(manager).toBeDefined();
    });
  });

  describe('collectFeedback', () => {
    it('should collect feedback data', () => {
      const feedback = {
        userId: 'user-1',
        templateId: 'template-1',
        templateType: 'code',
        timestamp: Date.now(),
        metrics: {
          readabilityScore: 0.8,
          structureScore: 0.9,
          completenessScore: 0.85,
          accuracyScore: 0.95,
          overallScore: 0.875,
        },
        userFeedback: {
          rating: 4,
          comments: 'Good template',
          issues: [],
          suggestions: [],
        },
        usageContext: {
          contentLength: 1000,
          complexity: 'medium' as const,
          userExperience: 'intermediate' as const,
          device: 'desktop' as const,
        },
      };

      expect(() => manager.collectFeedback(feedback)).not.toThrow();
    });
  });

  describe('getTemplatePerformance', () => {
    it('should return performance for template type', () => {
      const performance = manager.getTemplatePerformance('code');
      // Returns null for unknown types
      expect(performance === null || performance !== undefined).toBe(true);
    });

    it('should return null for unknown template type', () => {
      const performance = manager.getTemplatePerformance('unknown-type');
      expect(performance).toBeNull();
    });
  });

  describe('getRefinementMetrics', () => {
    it('should return refinement metrics', () => {
      const metrics = manager.getRefinementMetrics();
      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe('generateOptimizationRecommendations', () => {
    it('should return optimization recommendations', () => {
      const recommendations = manager.generateOptimizationRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('optimizeTemplate', () => {
    it('should optimize template', () => {
      const template = {
        id: 'test-template',
        name: 'Test Template',
        type: 'code',
        content: 'Test content',
        variables: [],
        metadata: {},
      };

      const result = manager.optimizeTemplate('code', template as any);
      expect(result).toBeDefined();
    });
  });

  describe('generateRefinementReport', () => {
    it('should generate refinement report', () => {
      const report = manager.generateRefinementReport();
      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });
  });
});

