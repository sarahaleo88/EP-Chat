#!/usr/bin/env node
/**
 * Fix curly braces for if statements to comply with ESLint rules
 */

const fs = require('fs');
const path = require('path');

class CurlyBraceFixer {
  constructor() {
    this.filesToProcess = [];
    this.fixesApplied = 0;
    this.filesProcessed = 0;
  }

  /**
   * Find all TypeScript/JavaScript files to process
   */
  findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .next directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
          this.findFiles(filePath, extensions);
        }
      } else if (extensions.some(ext => file.endsWith(ext))) {
        this.filesToProcess.push(filePath);
      }
    }
  }

  /**
   * Fix curly braces for if statements
   */
  fixCurlyBraces(content) {
    let modified = false;
    let newContent = content;

    // Pattern to match if statements without curly braces
    const patterns = [
      // if (condition) statement;
      {
        regex: /(\s*if\s*\([^)]+\))\s*([^{][^;\n]*;)/g,
        replacement: '$1 {\n    $2\n  }'
      },
      // if (condition) return statement;
      {
        regex: /(\s*if\s*\([^)]+\))\s*(return[^;\n]*;)/g,
        replacement: '$1 {\n    $2\n  }'
      },
      // if (condition) throw statement;
      {
        regex: /(\s*if\s*\([^)]+\))\s*(throw[^;\n]*;)/g,
        replacement: '$1 {\n    $2\n  }'
      },
      // if (condition) continue;
      {
        regex: /(\s*if\s*\([^)]+\))\s*(continue;)/g,
        replacement: '$1 {\n    $2\n  }'
      },
      // if (condition) break;
      {
        regex: /(\s*if\s*\([^)]+\))\s*(break;)/g,
        replacement: '$1 {\n    $2\n  }'
      }
    ];

    for (const pattern of patterns) {
      const matches = newContent.match(pattern.regex);
      if (matches) {
        this.fixesApplied += matches.length;
        modified = true;
        newContent = newContent.replace(pattern.regex, pattern.replacement);
      }
    }

    return { content: newContent, modified };
  }

  /**
   * Process a single file
   */
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: newContent, modified } = this.fixCurlyBraces(content);

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Fixed curly braces: ${filePath}`);
        this.filesProcessed++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  /**
   * Run the fix process
   */
  run() {
    console.log('🔧 Fixing curly braces for ESLint compliance...\n');

    // Find all files to process
    this.findFiles('./app');
    this.findFiles('./lib');

    console.log(`📁 Found ${this.filesToProcess.length} files to process\n`);

    // Process each file
    for (const filePath of this.filesToProcess) {
      this.processFile(filePath);
    }

    console.log('\n📊 Fix Summary:');
    console.log(`Files processed: ${this.filesProcessed}`);
    console.log(`Curly brace fixes applied: ${this.fixesApplied}`);
    console.log('\n✨ Curly brace fixes completed!');
  }
}

// Run the fixer if this script is executed directly
if (require.main === module) {
  const fixer = new CurlyBraceFixer();
  fixer.run();
}

module.exports = CurlyBraceFixer;
