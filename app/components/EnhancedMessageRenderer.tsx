/**
 * Enhanced Message Renderer with Progressive Disclosure
 * Renders messages using content templates for improved scanability and reduced cognitive load
 */

'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ContentTemplate, ContentSection, analyzeContentForTemplate } from '@/lib/content-templates';
import { ChevronDown, ChevronRight, Copy, Clock, Zap } from 'lucide-react';

interface EnhancedMessageRendererProps {
  content: string;
  messageType: 'user' | 'assistant';
  model?: string;
  isStreaming?: boolean;
  className?: string;
  onCopy?: (content: string) => void;
}

/**
 * Main Enhanced Message Renderer Component
 */
export default function EnhancedMessageRenderer({
  content,
  messageType,
  model,
  isStreaming = false,
  className = '',
  onCopy
}: EnhancedMessageRendererProps) {
  // Generate content template based on message analysis
  const template = useMemo(() => {
    if (messageType === 'user') {
      // User messages use simple rendering
      return null;
    }
    return analyzeContentForTemplate(content, messageType, model);
  }, [content, messageType, model]);

  // For user messages or when template generation fails, use simple rendering
  if (!template || messageType === 'user') {
    return (
      <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    );
  }

  return (
    <div 
      className={cn('enhanced-message', className)}
      role={template.accessibility.role}
      aria-label={template.accessibility.ariaLabel}
    >
      {onCopy ? (
        <TemplateRenderer
          template={template}
          isStreaming={isStreaming}
          onCopy={onCopy}
        />
      ) : (
        <TemplateRenderer
          template={template}
          isStreaming={isStreaming}
        />
      )}
    </div>
  );
}

/**
 * Template Renderer Component
 */
interface TemplateRendererProps {
  template: ContentTemplate;
  isStreaming: boolean;
  onCopy?: (content: string) => void;
}

function TemplateRenderer({ template, isStreaming, onCopy }: TemplateRendererProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(template.sections.filter(s => s.defaultExpanded).map(s => s.id))
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleCopySection = (sectionContent: string) => {
    if (onCopy) {
      onCopy(sectionContent);
    }
  };

  return (
    <article className="space-y-4">
      {/* Message Header */}
      <MessageHeader template={template} isStreaming={isStreaming} />
      
      {/* Content Sections */}
      <div className="space-y-3">
        {template.sections.map((section) => (
          <ContentSectionRenderer
            key={section.id}
            section={section}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            onCopy={() => handleCopySection(section.content)}
          />
        ))}
      </div>
      
      {/* Message Footer */}
      {onCopy ? (
        <MessageFooter template={template} onCopy={onCopy} />
      ) : (
        <MessageFooter template={template} />
      )}
    </article>
  );
}

/**
 * Message Header Component
 */
interface MessageHeaderProps {
  template: ContentTemplate;
  isStreaming: boolean;
}

function MessageHeader({ template, isStreaming }: MessageHeaderProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code': return '💻';
      case 'explanation': return '📚';
      case 'problem': return '🔧';
      case 'discussion': return '💭';
      case 'error': return '❌';
      default: return '💬';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'code': return 'text-blue-600 dark:text-blue-400';
      case 'explanation': return 'text-green-600 dark:text-green-400';
      case 'problem': return 'text-yellow-600 dark:text-yellow-400';
      case 'discussion': return 'text-purple-600 dark:text-purple-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-2">
        <span className="text-lg" role="img" aria-label={`${template.type} message`}>
          {getTypeIcon(template.type)}
        </span>
        <div>
          <h3 className={cn('text-sm font-semibold', getTypeColor(template.type))}>
            {template.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {template.summary}
          </p>
        </div>
      </div>
      
      {isStreaming && (
        <div className="flex items-center space-x-1 text-blue-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs">Streaming</span>
        </div>
      )}
    </div>
  );
}

/**
 * Content Section Renderer Component
 */
interface ContentSectionRendererProps {
  section: ContentSection;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
}

function ContentSectionRenderer({ 
  section, 
  isExpanded, 
  onToggle, 
  onCopy 
}: ContentSectionRendererProps) {
  const getSectionIcon = () => {
    if (section.icon) return section.icon;
    
    switch (section.type) {
      case 'summary': return '📋';
      case 'detail': return '📖';
      case 'code': return '💻';
      case 'list': return '📝';
      case 'metadata': return 'ℹ️';
      default: return '📄';
    }
  };

  const renderContent = () => {
    switch (section.type) {
      case 'code':
        return (
          <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
            <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
              {section.content}
            </code>
          </pre>
        );
      case 'list':
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-line">{section.content}</div>
          </div>
        );
      default:
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">{section.content}</div>
          </div>
        );
    }
  };

  if (!section.collapsible) {
    return (
      <div className={cn(
        'rounded-lg p-4',
        section.className || 'bg-gray-50 dark:bg-gray-800/50'
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm" role="img" aria-label={section.title}>
              {getSectionIcon()}
            </span>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {section.title}
            </h4>
          </div>
          <button
            onClick={onCopy}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            title="Copy section content"
            aria-label={`Copy ${section.title} content`}
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <details 
      className="group rounded-lg border border-gray-200 dark:border-gray-700"
      open={isExpanded}
    >
      <summary 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        aria-expanded={isExpanded}
        aria-controls={`section-${section.id}`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm" role="img" aria-label={section.title}>
            {getSectionIcon()}
          </span>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {section.title}
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            title="Copy section content"
            aria-label={`Copy ${section.title} content`}
          >
            <Copy className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </summary>
      
      {isExpanded && (
        <div 
          id={`section-${section.id}`}
          className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700"
        >
          {renderContent()}
        </div>
      )}
    </details>
  );
}

/**
 * Message Footer Component
 */
interface MessageFooterProps {
  template: ContentTemplate;
  onCopy?: (content: string) => void;
}

function MessageFooter({ template, onCopy }: MessageFooterProps) {
  const handleCopyAll = () => {
    if (onCopy) {
      const allContent = template.sections.map(s => s.content).join('\n\n');
      onCopy(allContent);
    }
  };

  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center space-x-4">
        {template.metadata.model && (
          <span className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>{template.metadata.model}</span>
          </span>
        )}
        {template.metadata.tokens && (
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{template.metadata.tokens} tokens</span>
          </span>
        )}
      </div>
      
      {onCopy && (
        <button
          onClick={handleCopyAll}
          className="flex items-center space-x-1 px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
          title="Copy entire message"
          aria-label="Copy entire message content"
        >
          <Copy className="w-3 h-3" />
          <span>Copy All</span>
        </button>
      )}
    </div>
  );
}
