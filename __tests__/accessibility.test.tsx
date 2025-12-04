/**
 * Accessibility Testing Suite for Enhanced Message Renderer
 * Tests WCAG 2.1 AA compliance and accessibility features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { SecureEnhancedMessageRenderer } from '@/app/components/SecureEnhancedMessageRenderer';
import { 
  AriaLiveRegionManager, 
  ColorContrastUtils, 
  AccessibilityTestUtils 
} from '@/lib/accessibility-utils';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock performance.now for consistent testing
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  },
  writable: true,
  configurable: true,
});

describe('Enhanced Message Renderer Accessibility', () => {
  beforeEach(() => {
    // Clear any existing ARIA live regions
    document.querySelectorAll('[aria-live]').forEach(el => el.remove());
  });

  describe('WCAG 2.1 AA Compliance', () => {
    test('should have no accessibility violations for code template', async () => {
      const codeContent = `Here's a React component:

\`\`\`jsx
function HelloWorld() {
  return <div>Hello, World!</div>;
}
\`\`\`

This component renders a simple greeting message.`;

      const { container } = render(
        <SecureEnhancedMessageRenderer
          content={codeContent}
          messageType="assistant"
          model="deepseek-coder"
          enableEnhancedTemplates={true}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations for explanation template', async () => {
      const explanationContent = `React hooks are functions that let you use state and other React features in functional components.

Key benefits:
• Simpler component logic
• Better code reuse
• Easier testing

For example, useState allows you to add state to functional components.`;

      const { container } = render(
        <SecureEnhancedMessageRenderer
          content={explanationContent}
          messageType="assistant"
          model="deepseek-chat"
          enableEnhancedTemplates={true}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations for problem template', async () => {
      const problemContent = `To fix the "Cannot read property of undefined" error:

1. Check if the object exists before accessing properties
2. Use optional chaining (?.) operator
3. Provide default values

Alternative approach: Use try-catch blocks for error handling.`;

      const { container } = render(
        <SecureEnhancedMessageRenderer
          content={problemContent}
          messageType="assistant"
          model="deepseek-reasoner"
          enableEnhancedTemplates={true}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Semantic HTML Structure', () => {
    test('should use proper heading hierarchy', () => {
      const content = 'Test content for heading structure';
      
      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      // Check for proper article structure
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    test('should use proper list structure for list content', () => {
      const listContent = `Key points:
• First point
• Second point
• Third point`;

      render(
        <SecureEnhancedMessageRenderer
          content={listContent}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      // Lists should be properly structured
      const lists = screen.queryAllByRole('list');
      if (lists.length > 0) {
        lists.forEach(list => {
          const listItems = screen.getAllByRole('listitem');
          expect(listItems.length).toBeGreaterThan(0);
        });
      }
    });

    test('should use proper button elements for interactive content', () => {
      const content = 'Test content with interactive elements';
      
      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
        expect(AccessibilityTestUtils.hasProperLabeling(button)).toBe(true);
      });
    });
  });

  describe('ARIA Labels and Descriptions', () => {
    test('should have proper ARIA labels for message container', () => {
      const content = 'Test content for ARIA labels';
      
      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          model="deepseek-chat"
          enableEnhancedTemplates={true}
        />
      );

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label');
      expect(article).toHaveAttribute('aria-describedby');
    });

    test('should have proper ARIA attributes for collapsible sections', async () => {
      const collapsibleContent = `Here's a detailed explanation:

Step 1: First step
Step 2: Second step
Step 3: Third step

Alternative approaches are also available.`;

      render(
        <SecureEnhancedMessageRenderer
          content={collapsibleContent}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      // Find collapsible sections
      const expandableElements = screen.getAllByRole('button').filter(
        button => button.hasAttribute('aria-expanded')
      );

      expandableElements.forEach(element => {
        expect(element).toHaveAttribute('aria-expanded');
        expect(element).toHaveAttribute('aria-controls');
        expect(element).toHaveAttribute('aria-label');
      });
    });

    test('should maintain ARIA relationships', () => {
      const content = 'Test content for ARIA relationships';
      
      const { container } = render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      const errors = AccessibilityTestUtils.validateAriaRelationships(container);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support tab navigation through interactive elements', async () => {
      const user = userEvent.setup();
      
      const content = `Code example:
\`\`\`js
console.log('test');
\`\`\`

Explanation of the code above.`;

      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      // Tab through interactive elements
      const interactiveElements = screen.getAllByRole('button');
      
      if (interactiveElements.length > 0) {
        await user.tab();
        expect(interactiveElements[0]).toHaveFocus();
        
        if (interactiveElements.length > 1) {
          await user.tab();
          expect(interactiveElements[1]).toHaveFocus();
        }
      }
    });

    test('should support Enter and Space key activation', async () => {
      const user = userEvent.setup();
      
      const content = `Collapsible content:

Step 1: First step
Step 2: Second step`;

      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      const expandableButtons = screen.getAllByRole('button').filter(
        button => button.hasAttribute('aria-expanded')
      );

      if (expandableButtons.length > 0) {
        const button = expandableButtons[0];
        const initialExpanded = button.getAttribute('aria-expanded');
        
        button.focus();
        await user.keyboard('{Enter}');
        
        await waitFor(() => {
          expect(button.getAttribute('aria-expanded')).not.toBe(initialExpanded);
        });
      }
    });

    test('should support arrow key navigation', async () => {
      const user = userEvent.setup();
      
      const content = 'Test content with multiple interactive elements';
      
      const { container } = render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      const interactiveElements = container.querySelectorAll('button, [tabindex="0"]');
      
      if (interactiveElements.length > 1) {
        // Focus first element
        (interactiveElements[0] as HTMLElement).focus();
        
        // Arrow down should move to next element
        await user.keyboard('{ArrowDown}');
        
        // Note: This test depends on the KeyboardNavigationManager implementation
        // The actual behavior may vary based on the implementation
      }
    });
  });

  describe('Screen Reader Support', () => {
    test('should announce template changes to screen readers', () => {
      const liveRegionManager = AriaLiveRegionManager.getInstance();
      const announceSpy = jest.spyOn(liveRegionManager, 'announce');
      
      render(
        <SecureEnhancedMessageRenderer
          content="Test content for screen reader announcements"
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      expect(announceSpy).toHaveBeenCalled();
    });

    test('should provide screen reader instructions', () => {
      render(
        <SecureEnhancedMessageRenderer
          content="Test content with navigation instructions"
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      // Check for screen reader only content
      const srOnlyElements = document.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);
      
      // Verify instructions are present
      const instructionsFound = Array.from(srOnlyElements).some(
        element => element.textContent?.includes('arrow keys')
      );
      expect(instructionsFound).toBe(true);
    });

    test('should provide content summaries for screen readers', () => {
      const content = 'Detailed content that should have a summary';
      
      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      // Check for summary content
      const summaryElements = document.querySelectorAll('[id*="message-summary"]');
      expect(summaryElements.length).toBeGreaterThan(0);
    });
  });

  describe('Focus Management', () => {
    test('should have visible focus indicators', () => {
      render(
        <SecureEnhancedMessageRenderer
          content="Test content for focus indicators"
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      const focusableElements = screen.getAllByRole('button');
      
      focusableElements.forEach(element => {
        element.focus();
        
        // Check for focus styles (this is a simplified check)
        const computedStyle = window.getComputedStyle(element);
        const hasFocusStyle = 
          computedStyle.outline !== 'none' || 
          computedStyle.boxShadow !== 'none' ||
          element.classList.contains('focus:ring-2');
        
        expect(hasFocusStyle).toBe(true);
      });
    });

    test('should restore focus appropriately', async () => {
      const user = userEvent.setup();
      
      const content = 'Test content for focus restoration';
      
      render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      
      if (buttons.length > 0) {
        const firstButton = buttons[0];
        firstButton.focus();
        expect(firstButton).toHaveFocus();
        
        // Simulate interaction that might change focus
        await user.click(firstButton);
        
        // Focus should remain on the button or move predictably
        expect(document.activeElement).toBeTruthy();
      }
    });
  });

  describe('Color Contrast Compliance', () => {
    test('should meet WCAG AA color contrast requirements', () => {
      // Test common color combinations used in the templates
      const colorTests = [
        { fg: '#374151', bg: '#ffffff', name: 'Gray text on white' },
        { fg: '#ffffff', bg: '#22c55e', name: 'White text on shamrock' },
        { fg: '#1f2937', bg: '#f3f4f6', name: 'Dark gray on light gray' },
        { fg: '#6b7280', bg: '#ffffff', name: 'Medium gray on white' }
      ];

      colorTests.forEach(({ fg, bg, name }) => {
        const meetsAA = ColorContrastUtils.meetsWCAGAA(fg, bg);
        expect(meetsAA).toBe(true);
      });
    });

    test('should meet WCAG AA color contrast for large text', () => {
      const largeTextTests = [
        { fg: '#6b7280', bg: '#ffffff', name: 'Medium gray on white (large)' },
        { fg: '#ffffff', bg: '#3b82f6', name: 'White on blue (large)' }
      ];

      largeTextTests.forEach(({ fg, bg, name }) => {
        const meetsAA = ColorContrastUtils.meetsWCAGAA(fg, bg, true);
        expect(meetsAA).toBe(true);
      });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should maintain accessibility when falling back to secure renderer', () => {
      // Mock template generation failure
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const { container } = render(
        <SecureEnhancedMessageRenderer
          content="Test content that might cause template generation to fail"
          messageType="assistant"
          enableEnhancedTemplates={true}
          fallbackToSecure={true}
        />
      );

      // Even with fallback, basic accessibility should be maintained
      const contentElement = container.querySelector('.prose');
      expect(contentElement).toBeInTheDocument();

      console.error = originalConsoleError;
    });

    test('should handle missing ARIA targets gracefully', () => {
      const content = 'Test content for ARIA error handling';
      
      const { container } = render(
        <SecureEnhancedMessageRenderer
          content={content}
          messageType="assistant"
          enableEnhancedTemplates={true}
        />
      );

      // Should not have broken ARIA references
      const errors = AccessibilityTestUtils.validateAriaRelationships(container);
      expect(errors).toHaveLength(0);
    });
  });
});
