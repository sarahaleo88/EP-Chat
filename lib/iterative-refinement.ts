/**
 * Iterative Refinement System
 * Continuous improvement framework for content templates based on user feedback and metrics
 */

import { ContentTemplate, ContentSection } from './content-templates';
import { ComprehensionMetrics, TestResult } from './comprehension-testing';

export interface RefinementMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'improving' | 'declining' | 'stable';
  priority: 'high' | 'medium' | 'low';
  lastUpdated: number;
}

export interface TemplatePerformance {
  templateType: string;
  usageCount: number;
  averageMetrics: ComprehensionMetrics;
  userSatisfaction: number;
  commonIssues: string[];
  improvementSuggestions: string[];
  lastOptimized: number;
}

export interface FeedbackData {
  userId: string;
  templateId: string;
  templateType: string;
  timestamp: number;
  metrics: ComprehensionMetrics;
  userFeedback: {
    rating: number;
    comments: string;
    issues: string[];
    suggestions: string[];
  };
  usageContext: {
    contentLength: number;
    complexity: 'simple' | 'medium' | 'complex';
    userExperience: 'novice' | 'intermediate' | 'expert';
    device: 'mobile' | 'tablet' | 'desktop';
  };
}

export interface OptimizationRule {
  id: string;
  name: string;
  condition: (performance: TemplatePerformance) => boolean;
  action: (template: ContentTemplate) => ContentTemplate;
  priority: number;
  description: string;
}

/**
 * Iterative Refinement Manager
 */
export class IterativeRefinementManager {
  private feedbackData: FeedbackData[] = [];
  private templatePerformance: Map<string, TemplatePerformance> = new Map();
  private optimizationRules: OptimizationRule[] = [];
  private refinementMetrics: Map<string, RefinementMetric> = new Map();

  constructor() {
    this.initializeOptimizationRules();
    this.initializeRefinementMetrics();
  }

  /**
   * Collect feedback data from user interactions
   */
  collectFeedback(feedback: FeedbackData): void {
    this.feedbackData.push(feedback);
    this.updateTemplatePerformance(feedback);
    this.updateRefinementMetrics(feedback);
    
    // Trigger optimization if thresholds are met
    this.checkOptimizationTriggers(feedback.templateType);
  }

  /**
   * Get performance data for a specific template type
   */
  getTemplatePerformance(templateType: string): TemplatePerformance | null {
    return this.templatePerformance.get(templateType) || null;
  }

  /**
   * Get all refinement metrics
   */
  getRefinementMetrics(): RefinementMetric[] {
    return Array.from(this.refinementMetrics.values());
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    for (const [templateType, performance] of this.templatePerformance) {
      const issues = this.analyzePerformanceIssues(performance);
      const suggestions = this.generateImprovementSuggestions(performance, issues);
      
      if (issues.length > 0) {
        recommendations.push({
          templateType,
          priority: this.calculateRecommendationPriority(performance, issues),
          issues,
          suggestions,
          estimatedImpact: this.estimateImpact(performance, suggestions),
          implementationEffort: this.estimateEffort(suggestions)
        });
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Apply optimization to a template
   */
  optimizeTemplate(templateType: string, template: ContentTemplate): ContentTemplate {
    const performance = this.templatePerformance.get(templateType);
    if (!performance) {
      return template;
    }

    let optimizedTemplate = { ...template };

    // Apply relevant optimization rules
    for (const rule of this.optimizationRules) {
      if (rule.condition(performance)) {
        optimizedTemplate = rule.action(optimizedTemplate);
      }
    }

    // Update last optimized timestamp
    performance.lastOptimized = Date.now();
    this.templatePerformance.set(templateType, performance);

    return optimizedTemplate;
  }

  /**
   * Generate comprehensive refinement report
   */
  generateRefinementReport(): RefinementReport {
    const metrics = this.getRefinementMetrics();
    const recommendations = this.generateOptimizationRecommendations();
    const trends = this.analyzeTrends();

    return {
      timestamp: Date.now(),
      overallHealth: this.calculateOverallHealth(metrics),
      metrics,
      recommendations,
      trends,
      templatePerformance: Array.from(this.templatePerformance.values()),
      actionItems: this.generateActionItems(recommendations)
    };
  }

  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        id: 'reduce-cognitive-load',
        name: 'Reduce Cognitive Load',
        condition: (performance) => performance.averageMetrics.cognitiveLoadScore > 6,
        action: (template) => this.reduceCognitiveLoad(template),
        priority: 10,
        description: 'Simplify content structure when cognitive load is high'
      },
      {
        id: 'improve-scanability',
        name: 'Improve Scanability',
        condition: (performance) => performance.averageMetrics.scanabilityScore < 6,
        action: (template) => this.improveScanability(template),
        priority: 9,
        description: 'Enhance visual hierarchy and information organization'
      },
      {
        id: 'optimize-section-defaults',
        name: 'Optimize Section Defaults',
        condition: (performance) => performance.averageMetrics.taskCompletionTime > 30000,
        action: (template) => this.optimizeSectionDefaults(template),
        priority: 7,
        description: 'Adjust default expanded/collapsed states for better efficiency'
      },
      {
        id: 'enhance-navigation',
        name: 'Enhance Navigation',
        condition: (performance) => performance.averageMetrics.errorRate > 20,
        action: (template) => this.enhanceNavigation(template),
        priority: 8,
        description: 'Improve navigation and interaction patterns'
      }
    ];
  }

  private initializeRefinementMetrics(): void {
    const baseMetrics = [
      { id: 'scanability', name: 'Information Scanability', target: 8.0 },
      { id: 'cognitive-load', name: 'Cognitive Load', target: 4.0 },
      { id: 'task-completion', name: 'Task Completion Time', target: 20000 },
      { id: 'user-satisfaction', name: 'User Satisfaction', target: 8.5 },
      { id: 'error-rate', name: 'Error Rate', target: 10 }
    ];

    baseMetrics.forEach(metric => {
      this.refinementMetrics.set(metric.id, {
        ...metric,
        value: 0,
        trend: 'stable',
        priority: 'medium',
        lastUpdated: Date.now()
      });
    });
  }

  private updateTemplatePerformance(feedback: FeedbackData): void {
    const existing = this.templatePerformance.get(feedback.templateType);
    
    if (existing) {
      // Update existing performance data
      existing.usageCount++;
      existing.averageMetrics = this.calculateAverageMetrics(
        existing.averageMetrics,
        feedback.metrics,
        existing.usageCount
      );
      existing.userSatisfaction = this.calculateAverageSatisfaction(
        existing.userSatisfaction,
        feedback.userFeedback.rating,
        existing.usageCount
      );
      existing.commonIssues = this.updateCommonIssues(
        existing.commonIssues,
        feedback.userFeedback.issues
      );
      existing.improvementSuggestions = this.updateSuggestions(
        existing.improvementSuggestions,
        feedback.userFeedback.suggestions
      );
    } else {
      // Create new performance record
      this.templatePerformance.set(feedback.templateType, {
        templateType: feedback.templateType,
        usageCount: 1,
        averageMetrics: feedback.metrics,
        userSatisfaction: feedback.userFeedback.rating,
        commonIssues: feedback.userFeedback.issues,
        improvementSuggestions: feedback.userFeedback.suggestions,
        lastOptimized: 0
      });
    }
  }

  private updateRefinementMetrics(feedback: FeedbackData): void {
    const metrics = [
      { id: 'scanability', value: feedback.metrics.scanabilityScore },
      { id: 'cognitive-load', value: feedback.metrics.cognitiveLoadScore },
      { id: 'task-completion', value: feedback.metrics.taskCompletionTime },
      { id: 'user-satisfaction', value: feedback.userFeedback.rating },
      { id: 'error-rate', value: feedback.metrics.errorRate }
    ];

    metrics.forEach(({ id, value }) => {
      const metric = this.refinementMetrics.get(id);
      if (metric) {
        const previousValue = metric.value;
        metric.value = this.calculateMovingAverage(metric.value, value);
        metric.trend = this.calculateTrend(previousValue, metric.value, metric.target);
        metric.priority = this.calculatePriority(metric.value, metric.target);
        metric.lastUpdated = Date.now();
      }
    });
  }

  private checkOptimizationTriggers(templateType: string): void {
    const performance = this.templatePerformance.get(templateType);
    if (!performance) return;

    // Trigger optimization if performance is below thresholds
    const needsOptimization = 
      performance.averageMetrics.scanabilityScore < 6 ||
      performance.averageMetrics.cognitiveLoadScore > 6 ||
      performance.userSatisfaction < 7 ||
      performance.usageCount % 100 === 0; // Periodic optimization

    if (needsOptimization) {
      this.scheduleOptimization(templateType);
    }
  }

  private scheduleOptimization(templateType: string): void {
    // In a real implementation, this would trigger an optimization job
    console.log(`Scheduling optimization for template type: ${templateType}`);
    
    // Emit event for optimization system
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('template-optimization-needed', {
        detail: { templateType }
      }));
    }
  }

  private reduceCognitiveLoad(template: ContentTemplate): ContentTemplate {
    return {
      ...template,
      sections: template.sections.map(section => ({
        ...section,
        // Collapse complex sections by default
        defaultExpanded: section.type === 'summary' || section.priority === 'primary',
        // Simplify content presentation
        className: section.className + ' simplified-layout'
      }))
    };
  }

  private improveScanability(template: ContentTemplate): ContentTemplate {
    return {
      ...template,
      sections: template.sections.map(section => ({
        ...section,
        // Add visual emphasis for better scanning
        className: section.className + ' enhanced-scanability',
        // Ensure key sections are visible
        defaultExpanded: section.priority === 'primary' || section.type === 'summary'
      }))
    };
  }

  private optimizeSectionDefaults(template: ContentTemplate): ContentTemplate {
    return {
      ...template,
      sections: template.sections.map(section => ({
        ...section,
        // Optimize based on usage patterns
        defaultExpanded: section.priority === 'primary' && section.type !== 'metadata'
      }))
    };
  }

  private enhanceNavigation(template: ContentTemplate): ContentTemplate {
    return {
      ...template,
      sections: template.sections.map(section => ({
        ...section,
        // Add navigation aids
        className: section.className + ' enhanced-navigation'
      }))
    };
  }

  private analyzePerformanceIssues(performance: TemplatePerformance): string[] {
    const issues: string[] = [];

    if (performance.averageMetrics.scanabilityScore < 6) {
      issues.push('Low scanability score');
    }
    if (performance.averageMetrics.cognitiveLoadScore > 6) {
      issues.push('High cognitive load');
    }
    if (performance.averageMetrics.taskCompletionTime > 30000) {
      issues.push('Slow task completion');
    }
    if (performance.userSatisfaction < 7) {
      issues.push('Low user satisfaction');
    }
    if (performance.averageMetrics.errorRate > 20) {
      issues.push('High error rate');
    }

    return issues;
  }

  private generateImprovementSuggestions(
    performance: TemplatePerformance, 
    issues: string[]
  ): string[] {
    const suggestions: string[] = [];

    if (issues.includes('Low scanability score')) {
      suggestions.push('Improve visual hierarchy with better headings and spacing');
      suggestions.push('Add more prominent visual cues for key information');
    }
    if (issues.includes('High cognitive load')) {
      suggestions.push('Simplify content structure and reduce information density');
      suggestions.push('Use progressive disclosure more effectively');
    }
    if (issues.includes('Slow task completion')) {
      suggestions.push('Optimize default section states for common tasks');
      suggestions.push('Improve navigation between sections');
    }
    if (issues.includes('Low user satisfaction')) {
      suggestions.push('Gather more detailed user feedback on pain points');
      suggestions.push('Consider alternative layout approaches');
    }

    return suggestions;
  }

  private calculateMovingAverage(current: number, newValue: number, weight: number = 0.1): number {
    return current * (1 - weight) + newValue * weight;
  }

  private calculateTrend(previous: number, current: number, target: number): 'improving' | 'declining' | 'stable' {
    const change = current - previous;
    const threshold = Math.abs(target * 0.05); // 5% of target

    if (Math.abs(change) < threshold) return 'stable';
    
    // For metrics where lower is better (cognitive load, error rate)
    const lowerIsBetter = target < 5;
    
    if (lowerIsBetter) {
      return change < 0 ? 'improving' : 'declining';
    } else {
      return change > 0 ? 'improving' : 'declining';
    }
  }

  private calculatePriority(value: number, target: number): 'high' | 'medium' | 'low' {
    const deviation = Math.abs(value - target) / target;

    if (deviation > 0.3) return 'high';
    if (deviation > 0.15) return 'medium';
    return 'low';
  }

  private calculateRecommendationPriority(performance: TemplatePerformance, issues: string[]): number {
    // Calculate priority based on performance metrics and number of issues
    const scanabilityScore = performance.averageMetrics.scanabilityScore || 0;
    const cognitiveLoadScore = performance.averageMetrics.cognitiveLoadScore || 0;
    const issueCount = issues.length;

    // Higher priority for lower scores and more issues
    const priorityScore = (100 - scanabilityScore) + (100 - cognitiveLoadScore) + (issueCount * 10);

    return Math.min(100, Math.max(0, priorityScore));
  }

  private calculateAverageMetrics(
    existing: ComprehensionMetrics,
    newMetrics: ComprehensionMetrics,
    count: number
  ): ComprehensionMetrics {
    const weight = 1 / count;
    
    return {
      scanabilityScore: existing.scanabilityScore * (1 - weight) + newMetrics.scanabilityScore * weight,
      cognitiveLoadScore: existing.cognitiveLoadScore * (1 - weight) + newMetrics.cognitiveLoadScore * weight,
      taskCompletionTime: existing.taskCompletionTime * (1 - weight) + newMetrics.taskCompletionTime * weight,
      accuracyScore: existing.accuracyScore * (1 - weight) + newMetrics.accuracyScore * weight,
      userSatisfactionScore: existing.userSatisfactionScore * (1 - weight) + newMetrics.userSatisfactionScore * weight,
      errorRate: existing.errorRate * (1 - weight) + newMetrics.errorRate * weight
    };
  }

  private calculateAverageSatisfaction(existing: number, newRating: number, count: number): number {
    const weight = 1 / count;
    return existing * (1 - weight) + newRating * weight;
  }

  private updateCommonIssues(existing: string[], newIssues: string[]): string[] {
    const issueCount = new Map<string, number>();
    
    // Count existing issues
    existing.forEach(issue => {
      issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
    });
    
    // Add new issues
    newIssues.forEach(issue => {
      issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
    });
    
    // Return top 5 most common issues
    return Array.from(issueCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);
  }

  private updateSuggestions(existing: string[], newSuggestions: string[]): string[] {
    const suggestionSet = new Set([...existing, ...newSuggestions]);
    return Array.from(suggestionSet).slice(0, 10); // Keep top 10 suggestions
  }

  private analyzeTrends(): TrendAnalysis {
    const metrics = this.getRefinementMetrics();
    
    return {
      improving: metrics.filter(m => m.trend === 'improving').length,
      declining: metrics.filter(m => m.trend === 'declining').length,
      stable: metrics.filter(m => m.trend === 'stable').length,
      highPriority: metrics.filter(m => m.priority === 'high').length
    };
  }

  private calculateOverallHealth(metrics: RefinementMetric[]): number {
    const scores = metrics.map(metric => {
      const deviation = Math.abs(metric.value - metric.target) / metric.target;
      return Math.max(0, 1 - deviation);
    });
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private generateActionItems(recommendations: OptimizationRecommendation[]): ActionItem[] {
    return recommendations
      .filter(rec => rec.priority > 7)
      .map(rec => ({
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `Optimize ${rec.templateType} template`,
        description: rec.suggestions.join('; '),
        priority: rec.priority > 9 ? 'high' : 'medium',
        estimatedEffort: rec.implementationEffort,
        expectedImpact: rec.estimatedImpact,
        dueDate: Date.now() + (7 * 24 * 60 * 60 * 1000) // 1 week from now
      }));
  }

  private estimateImpact(performance: TemplatePerformance, suggestions: string[]): number {
    // Simplified impact estimation based on current performance gaps
    let impact = 0;
    
    if (performance.averageMetrics.scanabilityScore < 6) impact += 3;
    if (performance.averageMetrics.cognitiveLoadScore > 6) impact += 3;
    if (performance.userSatisfaction < 7) impact += 2;
    
    return Math.min(10, impact + suggestions.length);
  }

  private estimateEffort(suggestions: string[]): 'low' | 'medium' | 'high' {
    if (suggestions.length <= 2) return 'low';
    if (suggestions.length <= 4) return 'medium';
    return 'high';
  }
}

export interface OptimizationRecommendation {
  templateType: string;
  priority: number;
  issues: string[];
  suggestions: string[];
  estimatedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface RefinementReport {
  timestamp: number;
  overallHealth: number;
  metrics: RefinementMetric[];
  recommendations: OptimizationRecommendation[];
  trends: TrendAnalysis;
  templatePerformance: TemplatePerformance[];
  actionItems: ActionItem[];
}

export interface TrendAnalysis {
  improving: number;
  declining: number;
  stable: number;
  highPriority: number;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: 'low' | 'medium' | 'high';
  expectedImpact: number;
  dueDate: number;
}

/**
 * Initialize iterative refinement system
 */
export function initializeIterativeRefinement(): IterativeRefinementManager {
  return new IterativeRefinementManager();
}
