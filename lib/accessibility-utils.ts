/**
 * Accessibility Utilities for Enhanced Message Renderer
 * Provides WCAG 2.1 AA compliant accessibility features
 */

import React from 'react';
import { ContentTemplate, ContentSection } from './content-templates';

/**
 * ARIA Live Region Manager
 * Manages dynamic content announcements for screen readers
 */
export class AriaLiveRegionManager {
  private static instance: AriaLiveRegionManager;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  static getInstance(): AriaLiveRegionManager {
    if (!AriaLiveRegionManager.instance) {
      AriaLiveRegionManager.instance = new AriaLiveRegionManager();
    }
    return AriaLiveRegionManager.instance;
  }

  initialize() {
    if (typeof document === 'undefined') {return;}

    // Create polite live region for non-urgent announcements
    if (!this.politeRegion) {
      this.politeRegion = document.createElement('div');
      this.politeRegion.setAttribute('aria-live', 'polite');
      this.politeRegion.setAttribute('aria-atomic', 'true');
      this.politeRegion.className = 'sr-only';
      this.politeRegion.id = 'aria-live-polite';
      document.body.appendChild(this.politeRegion);
    }

    // Create assertive live region for urgent announcements
    if (!this.assertiveRegion) {
      this.assertiveRegion = document.createElement('div');
      this.assertiveRegion.setAttribute('aria-live', 'assertive');
      this.assertiveRegion.setAttribute('aria-atomic', 'true');
      this.assertiveRegion.className = 'sr-only';
      this.assertiveRegion.id = 'aria-live-assertive';
      document.body.appendChild(this.assertiveRegion);
    }
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (region) {
      // Clear and set new message
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  announceTemplateChange(template: ContentTemplate) {
    const message = `${template.title} message loaded with ${template.sections.length} sections. ${template.summary}`;
    this.announce(message, 'polite');
  }

  announceSectionToggle(section: ContentSection, expanded: boolean) {
    const action = expanded ? 'expanded' : 'collapsed';
    const message = `${section.title} section ${action}`;
    this.announce(message, 'polite');
  }

  announceError(error: string) {
    this.announce(`Error: ${error}`, 'assertive');
  }
}

/**
 * Keyboard Navigation Manager
 * Handles keyboard navigation for progressive disclosure elements
 */
export class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = [];
  private currentFocusIndex = -1;

  constructor(private container: HTMLElement) {
    this.updateFocusableElements();
    this.attachKeyboardListeners();
  }

  private updateFocusableElements() {
    const selector = [
      'button',
      '[tabindex="0"]',
      'summary',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])'
    ].join(', ');

    this.focusableElements = Array.from(
      this.container.querySelectorAll(selector)
    ) as HTMLElement[];
  }

  private attachKeyboardListeners() {
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPrevious();
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirst();
        break;
      case 'End':
        event.preventDefault();
        this.focusLast();
        break;
      case 'Enter':
      case ' ':
        if (event.target instanceof HTMLElement && event.target.tagName === 'SUMMARY') {
          // Let default behavior handle details/summary toggle
          return;
        }
        break;
    }
  }

  private focusNext() {
    this.currentFocusIndex = Math.min(
      this.currentFocusIndex + 1,
      this.focusableElements.length - 1
    );
    this.focusCurrentElement();
  }

  private focusPrevious() {
    this.currentFocusIndex = Math.max(this.currentFocusIndex - 1, 0);
    this.focusCurrentElement();
  }

  private focusFirst() {
    this.currentFocusIndex = 0;
    this.focusCurrentElement();
  }

  private focusLast() {
    this.currentFocusIndex = this.focusableElements.length - 1;
    this.focusCurrentElement();
  }

  private focusCurrentElement() {
    const element = this.focusableElements[this.currentFocusIndex];
    if (element) {
      element.focus();
    }
  }

  updateElements() {
    this.updateFocusableElements();
  }

  destroy() {
    this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}

/**
 * Screen Reader Optimization Utilities
 */
export const ScreenReaderUtils = {
  /**
   * Generate descriptive text for screen readers
   */
  generateMessageDescription(template: ContentTemplate): string {
    const sectionTypes = template.sections.map(s => s.type).join(', ');
    const expandableSections = template.sections.filter(s => s.collapsible).length;
    
    return `${template.type} message containing ${template.sections.length} sections: ${sectionTypes}. ${expandableSections} sections are expandable.`;
  },

  /**
   * Generate section navigation instructions
   */
  generateNavigationInstructions(template: ContentTemplate): string {
    const hasExpandable = template.sections.some(s => s.collapsible);
    
    if (hasExpandable) {
      return 'Use arrow keys to navigate between sections. Press Enter or Space to expand or collapse sections.';
    }
    
    return 'Use arrow keys to navigate between sections.';
  },

  /**
   * Generate content summary for quick overview
   */
  generateContentSummary(template: ContentTemplate): string {
    const wordCount = template.sections.reduce(
      (total, section) => total + section.content.split(' ').length,
      0
    );
    
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    return `Content summary: ${template.summary} Estimated reading time: ${readingTime} minute${readingTime !== 1 ? 's' : ''}.`;
  }
};

/**
 * Color Contrast Utilities
 */
export const ColorContrastUtils = {
  /**
   * Calculate relative luminance for WCAG compliance
   */
  getRelativeLuminance(color: string): number {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Apply gamma correction
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    // Calculate relative luminance
    return 0.2126 * (sRGB[0] || 0) + 0.7152 * (sRGB[1] || 0) + 0.0722 * (sRGB[2] || 0);
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if color combination meets WCAG AA standards
   */
  meetsWCAGAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },

  /**
   * Check if color combination meets WCAG AAA standards
   */
  meetsWCAGAAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
};

/**
 * Focus Management Utilities
 */
export const FocusManagementUtils = {
  /**
   * Create a focus trap for modal-like content
   */
  createFocusTrap(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {return;}

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  /**
   * Restore focus to previously focused element
   */
  createFocusRestorer(): (element: HTMLElement) => () => void {
    return (element: HTMLElement) => {
      const previouslyFocused = document.activeElement as HTMLElement;
      
      element.focus();
      
      return () => {
        if (previouslyFocused && previouslyFocused.focus) {
          previouslyFocused.focus();
        }
      };
    };
  },

  /**
   * Ensure element is visible when focused
   */
  ensureElementVisible(element: HTMLElement) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  }
};

/**
 * ARIA Attributes Generator
 */
export const AriaAttributesGenerator = {
  /**
   * Generate ARIA attributes for message container
   */
  generateMessageAttributes(template: ContentTemplate): Record<string, string> {
    return {
      'role': template.accessibility.role,
      'aria-label': template.accessibility.ariaLabel,
      'aria-describedby': `message-summary-${template.id}`,
      'aria-live': 'polite'
    };
  },

  /**
   * Generate ARIA attributes for collapsible sections
   */
  generateSectionAttributes(
    section: ContentSection, 
    isExpanded: boolean,
    templateId: string
  ): Record<string, string> {
    const baseAttributes = {
      'id': `section-${section.id}`,
      'aria-labelledby': `section-header-${section.id}`
    };

    if (section.collapsible) {
      return {
        ...baseAttributes,
        'aria-expanded': isExpanded.toString(),
        'aria-controls': `section-content-${section.id}`,
        'role': 'button',
        'tabindex': '0'
      };
    }

    return baseAttributes;
  },

  /**
   * Generate ARIA attributes for section content
   */
  generateContentAttributes(section: ContentSection): Record<string, string> {
    return {
      'id': `section-content-${section.id}`,
      'aria-labelledby': `section-header-${section.id}`,
      'role': section.type === 'code' ? 'code' : 'region'
    };
  }
};

/**
 * Accessibility Testing Utilities
 */
export const AccessibilityTestUtils = {
  /**
   * Check if element has proper ARIA labels
   */
  hasProperLabeling(element: HTMLElement): boolean {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim()
    );
  },

  /**
   * Check if interactive elements are keyboard accessible
   */
  isKeyboardAccessible(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute('tabindex');
    const isInteractive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
    
    return isInteractive || tabIndex === '0';
  },

  /**
   * Validate ARIA relationships
   */
  validateAriaRelationships(container: HTMLElement): string[] {
    const errors: string[] = [];
    
    // Check aria-describedby references
    const describedByElements = container.querySelectorAll('[aria-describedby]');
    describedByElements.forEach(element => {
      const describedBy = element.getAttribute('aria-describedby');
      if (describedBy && !container.querySelector(`#${describedBy}`)) {
        errors.push(`aria-describedby references non-existent element: ${describedBy}`);
      }
    });

    // Check aria-controls references
    const controlsElements = container.querySelectorAll('[aria-controls]');
    controlsElements.forEach(element => {
      const controls = element.getAttribute('aria-controls');
      if (controls && !container.querySelector(`#${controls}`)) {
        errors.push(`aria-controls references non-existent element: ${controls}`);
      }
    });

    return errors;
  }
};

/**
 * Accessibility Hook for React Components
 */
export function useAccessibility(template: ContentTemplate) {
  const liveRegionManager = AriaLiveRegionManager.getInstance();
  
  React.useEffect(() => {
    liveRegionManager.initialize();
    liveRegionManager.announceTemplateChange(template);
  }, [template, liveRegionManager]);

  const announceSection = (section: ContentSection, expanded: boolean) => {
    liveRegionManager.announceSectionToggle(section, expanded);
  };

  const announceError = (error: string) => {
    liveRegionManager.announceError(error);
  };

  return {
    announceSection,
    announceError,
    generateMessageAttributes: () => AriaAttributesGenerator.generateMessageAttributes(template),
    generateNavigationInstructions: () => ScreenReaderUtils.generateNavigationInstructions(template),
    generateContentSummary: () => ScreenReaderUtils.generateContentSummary(template)
  };
}
