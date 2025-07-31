#!/usr/bin/env node
/**
 * Code cleanup script for production readiness
 * Removes console.log statements and fixes code style issues
 */

const fs = require('fs');
const path = require('path');

class CodeCleanup {
  constructor() {
    this.filesToProcess = [];
    this.consoleLogsRemoved = 0;
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
   * Remove console.log statements from code
   */
  removeConsoleLogs(content) {
    let modified = false;
    let newContent = content;

    // More comprehensive regex patterns for console.log removal
    const patterns = [
      // Standard console.log statements
      /^\s*console\.log\([^)]*\);\s*$/gm,
      // Console.log without semicolon
      /^\s*console\.log\([^)]*\)\s*$/gm,
      // Console.log with complex arguments
      /^\s*console\.log\([^;]*\);\s*$/gm,
      // Inline console.log statements
      /\s*console\.log\([^)]*\);\s*/g,
    ];

    for (const pattern of patterns) {
      const matches = newContent.match(pattern);
      if (matches) {
        this.consoleLogsRemoved += matches.length;
        modified = true;
        newContent = newContent.replace(pattern, '');
      }
    }

    // Remove empty lines that might be left after console.log removal
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    // Remove trailing whitespace
    newContent = newContent.replace(/[ \t]+$/gm, '');

    return { content: newContent, modified };
  }

  /**
   * Process a single file
   */
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: newContent, modified } = this.removeConsoleLogs(content);

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Cleaned: ${filePath}`);
        this.filesProcessed++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  /**
   * Run the cleanup process
   */
  run() {
    console.log('🧹 Starting code cleanup...\n');

    // Find all files to process
    this.findFiles('./app');
    this.findFiles('./lib');
    this.findFiles('./tests');

    console.log(`📁 Found ${this.filesToProcess.length} files to process\n`);

    // Process each file
    for (const filePath of this.filesToProcess) {
      this.processFile(filePath);
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`Files processed: ${this.filesProcessed}`);
    console.log(`Console.log statements removed: ${this.consoleLogsRemoved}`);
    console.log('\n✨ Code cleanup completed!');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  const cleanup = new CodeCleanup();
  cleanup.run();
}

module.exports = CodeCleanup;
