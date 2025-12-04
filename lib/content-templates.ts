/**
 * Content Templates for Enhanced Message Rendering
 * Provides structured templates for different message types with progressive disclosure
 */

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  type: 'summary' | 'detail' | 'code' | 'list' | 'metadata';
  collapsible: boolean;
  defaultExpanded: boolean;
  priority: 'primary' | 'secondary' | 'tertiary';
  icon?: string;
  className?: string;
}

export interface ContentTemplate {
  id: string;
  type: 'code' | 'explanation' | 'problem' | 'discussion' | 'error' | 'loading';
  title: string;
  summary: string;
  sections: ContentSection[];
  metadata: {
    model?: string;
    timestamp?: Date;
    tokens?: number;
    processingTime?: number;
  };
  accessibility: {
    ariaLabel: string;
    role: string;
    description: string;
  };
}

/**
 * Content Analysis and Template Selection
 */
export function analyzeContentForTemplate(content: string, messageType: 'user' | 'assistant', model?: string): ContentTemplate {
  const analysis = analyzeMessageContent(content);
  
  switch (analysis.primaryType) {
    case 'code':
      return createCodeTemplate(content, analysis, model);
    case 'explanation':
      return createExplanationTemplate(content, analysis, model);
    case 'problem':
      return createProblemTemplate(content, analysis, model);
    case 'discussion':
      return createDiscussionTemplate(content, analysis, model);
    case 'error':
      return createErrorTemplate(content, analysis, model);
    default:
      return createDefaultTemplate(content, analysis, model);
  }
}

/**
 * Message Content Analysis
 */
interface ContentAnalysis {
  primaryType: 'code' | 'explanation' | 'problem' | 'discussion' | 'error' | 'default';
  complexity: 'simple' | 'medium' | 'complex';
  hasCode: boolean;
  hasLists: boolean;
  hasSteps: boolean;
  hasExamples: boolean;
  wordCount: number;
  estimatedReadTime: number;
  keyTopics: string[];
}

function analyzeMessageContent(content: string): ContentAnalysis {
  const wordCount = content.split(/\s+/).length;
  const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute
  
  // Detect code blocks and inline code
  const hasCode = /```[\s\S]*?```|`[^`]+`/.test(content);
  
  // Detect lists
  const hasLists = /^\s*[-*+]\s|^\s*\d+\.\s/m.test(content);
  
  // Detect step-by-step content
  const hasSteps = /step\s*\d+|first|second|third|next|then|finally/i.test(content);
  
  // Detect examples
  const hasExamples = /example|for instance|such as|like this/i.test(content);
  
  // Determine primary type
  let primaryType: ContentAnalysis['primaryType'] = 'default';
  
  if (hasCode && content.includes('```')) {
    primaryType = 'code';
  } else if (content.includes('error') || content.includes('failed') || content.includes('❌')) {
    primaryType = 'error';
  } else if (hasSteps || content.includes('solution') || content.includes('solve')) {
    primaryType = 'problem';
  } else if (content.includes('explain') || content.includes('understand') || hasExamples) {
    primaryType = 'explanation';
  } else if (content.includes('discuss') || content.includes('opinion') || content.includes('think')) {
    primaryType = 'discussion';
  }
  
  // Determine complexity
  let complexity: ContentAnalysis['complexity'] = 'simple';
  if (wordCount > 100) {complexity = 'medium';}
  if (wordCount > 300 || content.split('\n').length > 10) {complexity = 'complex';}
  
  // Extract key topics (simplified)
  const keyTopics = extractKeyTopics(content);
  
  return {
    primaryType,
    complexity,
    hasCode,
    hasLists,
    hasSteps,
    hasExamples,
    wordCount,
    estimatedReadTime,
    keyTopics
  };
}

function extractKeyTopics(content: string): string[] {
  // Simplified topic extraction - in production, this could use NLP
  const topics: string[] = [];
  const techKeywords = ['react', 'javascript', 'typescript', 'python', 'css', 'html', 'api', 'database'];
  
  techKeywords.forEach(keyword => {
    if (content.toLowerCase().includes(keyword)) {
      topics.push(keyword);
    }
  });
  
  return topics.slice(0, 3); // Limit to 3 key topics
}

/**
 * Code Template
 */
function createCodeTemplate(content: string, analysis: ContentAnalysis, model?: string): ContentTemplate {
  const codeBlocks = extractCodeBlocks(content);
  const explanation = extractNonCodeContent(content);
  
  const sections: ContentSection[] = [
    {
      id: 'summary',
      title: 'Code Summary',
      content: generateCodeSummary(codeBlocks, analysis.keyTopics),
      type: 'summary',
      collapsible: false,
      defaultExpanded: true,
      priority: 'primary',
      icon: '💻',
      className: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
    }
  ];
  
  if (codeBlocks.length > 0) {
    sections.push({
      id: 'code',
      title: `Code Implementation (${codeBlocks.length} block${codeBlocks.length > 1 ? 's' : ''})`,
      content: codeBlocks.join('\n\n'),
      type: 'code',
      collapsible: true,
      defaultExpanded: analysis.complexity === 'simple',
      priority: 'primary',
      icon: '📝',
      className: 'font-mono text-sm'
    });
  }
  
  if (explanation.trim()) {
    sections.push({
      id: 'explanation',
      title: 'Explanation & Usage',
      content: explanation,
      type: 'detail',
      collapsible: true,
      defaultExpanded: analysis.complexity !== 'complex',
      priority: 'secondary',
      icon: '📖'
    });
  }
  
  return {
    id: `code-${Date.now()}`,
    type: 'code',
    title: 'Programming Solution',
    summary: generateCodeSummary(codeBlocks, analysis.keyTopics),
    sections,
    metadata: {
      ...(model && { model }),
      timestamp: new Date(),
      tokens: analysis.wordCount * 1.3 // Rough estimate
    },
    accessibility: {
      ariaLabel: `Code solution message with ${codeBlocks.length} code blocks`,
      role: 'article',
      description: `Programming solution using ${analysis.keyTopics.join(', ')}`
    }
  };
}

/**
 * Explanation Template
 */
function createExplanationTemplate(content: string, analysis: ContentAnalysis, model?: string): ContentTemplate {
  const keyPoints = extractKeyPoints(content);
  const details = extractDetailedContent(content);
  
  const sections: ContentSection[] = [
    {
      id: 'key-points',
      title: 'Key Points',
      content: keyPoints.map(point => `• ${point}`).join('\n'),
      type: 'list',
      collapsible: false,
      defaultExpanded: true,
      priority: 'primary',
      icon: '🔑',
      className: 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
    }
  ];
  
  if (details.trim()) {
    sections.push({
      id: 'detailed-explanation',
      title: 'Detailed Explanation',
      content: details,
      type: 'detail',
      collapsible: true,
      defaultExpanded: analysis.complexity === 'simple',
      priority: 'secondary',
      icon: '📚'
    });
  }
  
  if (analysis.hasExamples) {
    const examples = extractExamples(content);
    sections.push({
      id: 'examples',
      title: 'Examples & Use Cases',
      content: examples,
      type: 'detail',
      collapsible: true,
      defaultExpanded: false,
      priority: 'tertiary',
      icon: '💡'
    });
  }
  
  return {
    id: `explanation-${Date.now()}`,
    type: 'explanation',
    title: 'Concept Explanation',
    summary: keyPoints.slice(0, 2).join(' • '),
    sections,
    metadata: {
      ...(model && { model }),
      timestamp: new Date(),
      tokens: analysis.wordCount * 1.3
    },
    accessibility: {
      ariaLabel: `Explanation message covering ${analysis.keyTopics.join(', ')}`,
      role: 'article',
      description: `Detailed explanation with ${keyPoints.length} key points`
    }
  };
}

/**
 * Problem-Solving Template
 */
function createProblemTemplate(content: string, analysis: ContentAnalysis, model?: string): ContentTemplate {
  const quickAnswer = extractQuickAnswer(content);
  const steps = extractSteps(content);
  const alternatives = extractAlternatives(content);
  
  const sections: ContentSection[] = [
    {
      id: 'quick-answer',
      title: 'Quick Answer',
      content: quickAnswer,
      type: 'summary',
      collapsible: false,
      defaultExpanded: true,
      priority: 'primary',
      icon: '⚡',
      className: 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
    }
  ];
  
  if (steps.length > 0) {
    sections.push({
      id: 'step-by-step',
      title: `Step-by-Step Solution (${steps.length} steps)`,
      content: steps.map((step, i) => `${i + 1}. ${step}`).join('\n\n'),
      type: 'list',
      collapsible: true,
      defaultExpanded: analysis.complexity !== 'complex',
      priority: 'primary',
      icon: '📋'
    });
  }
  
  if (alternatives.trim()) {
    sections.push({
      id: 'alternatives',
      title: 'Alternative Approaches',
      content: alternatives,
      type: 'detail',
      collapsible: true,
      defaultExpanded: false,
      priority: 'tertiary',
      icon: '🔄'
    });
  }
  
  return {
    id: `problem-${Date.now()}`,
    type: 'problem',
    title: 'Problem Resolution',
    summary: quickAnswer,
    sections,
    metadata: {
      ...(model && { model }),
      timestamp: new Date(),
      tokens: analysis.wordCount * 1.3
    },
    accessibility: {
      ariaLabel: `Problem solution with ${steps.length} steps`,
      role: 'article',
      description: 'Step-by-step problem resolution guide'
    }
  };
}

/**
 * Helper Functions for Content Extraction
 */
function extractCodeBlocks(content: string): string[] {
  const codeBlockRegex = /```[\s\S]*?```/g;
  return content.match(codeBlockRegex) || [];
}

function extractNonCodeContent(content: string): string {
  return content.replace(/```[\s\S]*?```/g, '').trim();
}

function generateCodeSummary(codeBlocks: string[], topics: string[]): string {
  if (codeBlocks.length === 0) {return 'Code solution provided';}

  const language = detectLanguage(codeBlocks[0] || '');
  const topicsStr = topics.length > 0 ? ` for ${topics.join(', ')}` : '';

  return `${language} implementation${topicsStr} (${codeBlocks.length} code block${codeBlocks.length > 1 ? 's' : ''})`;
}

function detectLanguage(codeBlock: string): string {
  const langMatch = codeBlock.match(/```(\w+)/);
  return langMatch ? (langMatch[1] || 'Code') : 'Code';
}

function extractKeyPoints(content: string): string[] {
  // Simplified key point extraction
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.slice(0, 3).map(s => s.trim());
}

function extractDetailedContent(content: string): string {
  // Return content after first paragraph for detailed explanation
  const paragraphs = content.split('\n\n');
  return paragraphs.slice(1).join('\n\n');
}

function extractExamples(content: string): string {
  // Extract content that appears to be examples
  const exampleRegex = /(example|for instance|such as)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi;
  const examples = content.match(exampleRegex) || [];
  return examples.join('\n\n');
}

function extractQuickAnswer(content: string): string {
  // Extract first sentence or paragraph as quick answer
  const firstParagraph = content.split('\n\n')[0] || '';
  return (firstParagraph.split('.')[0] || '') + '.';
}

function extractSteps(content: string): string[] {
  // Extract numbered or bulleted steps
  const stepRegex = /^\s*(?:\d+\.|[-*+])\s*(.+)$/gm;
  const matches = content.match(stepRegex) || [];
  return matches.map(match => match.replace(/^\s*(?:\d+\.|[-*+])\s*/, ''));
}

function extractAlternatives(content: string): string {
  // Extract content that mentions alternatives
  const altRegex = /(alternative|another way|you could also|alternatively)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi;
  const alternatives = content.match(altRegex) || [];
  return alternatives.join('\n\n');
}

/**
 * Discussion Template
 */
function createDiscussionTemplate(content: string, analysis: ContentAnalysis, model?: string): ContentTemplate {
  const mainPoints = extractKeyPoints(content);
  const elaboration = extractDetailedContent(content);

  const sections: ContentSection[] = [
    {
      id: 'main-points',
      title: 'Main Points',
      content: mainPoints.map(point => `• ${point}`).join('\n'),
      type: 'list',
      collapsible: false,
      defaultExpanded: true,
      priority: 'primary',
      icon: '💭',
      className: 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500'
    }
  ];

  if (elaboration.trim()) {
    sections.push({
      id: 'elaboration',
      title: 'Detailed Discussion',
      content: elaboration,
      type: 'detail',
      collapsible: true,
      defaultExpanded: analysis.complexity !== 'complex',
      priority: 'secondary',
      icon: '🗣️'
    });
  }

  return {
    id: `discussion-${Date.now()}`,
    type: 'discussion',
    title: 'Discussion',
    summary: mainPoints[0] || content.split('.')[0] + '.',
    sections,
    metadata: {
      ...(model && { model }),
      timestamp: new Date(),
      tokens: analysis.wordCount * 1.3
    },
    accessibility: {
      ariaLabel: `Discussion message with ${mainPoints.length} main points`,
      role: 'article',
      description: 'Discussion content with key points and elaboration'
    }
  };
}

/**
 * Default Template for unclassified content
 */
function createDefaultTemplate(content: string, analysis: ContentAnalysis, model?: string): ContentTemplate {
  return {
    id: `default-${Date.now()}`,
    type: 'discussion',
    title: 'Message',
    summary: content.split('.')[0] + '.',
    sections: [
      {
        id: 'content',
        title: 'Content',
        content,
        type: 'detail',
        collapsible: false,
        defaultExpanded: true,
        priority: 'primary'
      }
    ],
    metadata: {
      ...(model && { model }),
      timestamp: new Date(),
      tokens: analysis.wordCount * 1.3
    },
    accessibility: {
      ariaLabel: 'Message content',
      role: 'article',
      description: 'General message content'
    }
  };
}

/**
 * Error Template
 */
function createErrorTemplate(content: string, analysis: ContentAnalysis, model?: string): ContentTemplate {
  const errorType = detectErrorType(content);
  const troubleshooting = extractTroubleshooting(content);

  const sections: ContentSection[] = [
    {
      id: 'error-summary',
      title: 'Error Summary',
      content: extractErrorSummary(content),
      type: 'summary',
      collapsible: false,
      defaultExpanded: true,
      priority: 'primary',
      icon: '❌',
      className: 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
    }
  ];

  if (troubleshooting.trim()) {
    sections.push({
      id: 'troubleshooting',
      title: 'Troubleshooting Steps',
      content: troubleshooting,
      type: 'detail',
      collapsible: true,
      defaultExpanded: true,
      priority: 'secondary',
      icon: '🔧'
    });
  }

  return {
    id: `error-${Date.now()}`,
    type: 'error',
    title: `${errorType} Error`,
    summary: extractErrorSummary(content),
    sections,
    metadata: {
      ...(model && { model }),
      timestamp: new Date()
    },
    accessibility: {
      ariaLabel: `${errorType} error message`,
      role: 'alert',
      description: 'Error information with troubleshooting guidance'
    }
  };
}

/**
 * Helper functions for error template
 */
function detectErrorType(content: string): string {
  if (content.toLowerCase().includes('api')) {return 'API';}
  if (content.toLowerCase().includes('network')) {return 'Network';}
  if (content.toLowerCase().includes('timeout')) {return 'Timeout';}
  if (content.toLowerCase().includes('auth')) {return 'Authentication';}
  return 'System';
}

function extractErrorSummary(content: string): string {
  const firstLine = content.split('\n')[0] || '';
  return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
}

function extractTroubleshooting(content: string): string {
  // Look for troubleshooting content
  const troubleRegex = /(try|check|verify|ensure|make sure)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi;
  const matches = content.match(troubleRegex) || [];
  return matches.join('\n\n');
}
