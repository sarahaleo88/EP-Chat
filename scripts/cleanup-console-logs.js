#!/usr/bin/env node

/**
 * Console Log Cleanup Script
 * Removes console.log statements from production code while preserving console.error and console.warn
 */

const fs = require('fs');
const path = require('path');

// Directories to process
const DIRECTORIES = [
  'app',
  'lib',
  'components',
  'hooks'
];

// File extensions to process
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Console methods to remove (keep error and warn)
// Note: These methods are handled by regex patterns in cleanConsoleLogsFromContent
// const CONSOLE_METHODS_TO_REMOVE = ['console.log', 'console.debug', 'console.info', 'console.trace'];

// Console methods to keep
const CONSOLE_METHODS_TO_KEEP = [
  'console.error',
  'console.warn'
];

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return EXTENSIONS.includes(ext);
}

/**
 * Get all files recursively
 */
function getAllFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', '.next', 'dist', 'build', 'coverage'].includes(entry)) {
        getAllFiles(fullPath, files);
      }
    } else if (shouldProcessFile(fullPath)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Clean console logs from content
 */
function cleanConsoleLogsFromContent(content, filePath) {
  let cleanedContent = content;
  let removedCount = 0;
  
  // Remove console.log statements but preserve console.error and console.warn
  const consoleRegex = /^\s*console\.(log|debug|info|trace)\s*\([^)]*\);\s*$/gm;
  
  cleanedContent = cleanedContent.replace(consoleRegex, (match) => {
    removedCount++;
    return ''; // Remove the entire line
  });
  
  // Also handle multi-line console statements
  const multiLineConsoleRegex = /^\s*console\.(log|debug|info|trace)\s*\(\s*[\s\S]*?\);\s*$/gm;
  
  cleanedContent = cleanedContent.replace(multiLineConsoleRegex, (match) => {
    // Only remove if it doesn't contain console.error or console.warn
    if (!CONSOLE_METHODS_TO_KEEP.some(method => match.includes(method))) {
      removedCount++;
      return '';
    }
    return match;
  });
  
  // Clean up empty lines left by removed console statements
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return { content: cleanedContent, removedCount };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: cleanedContent, removedCount } = cleanConsoleLogsFromContent(content, filePath);
    
    if (removedCount > 0) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`✅ ${filePath}: Removed ${removedCount} console statements`);
      return removedCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🧹 Starting console log cleanup...\n');
  
  let totalFiles = 0;
  let totalRemoved = 0;
  let processedFiles = 0;
  
  // Process each directory
  for (const dir of DIRECTORIES) {
    const files = getAllFiles(dir);
    totalFiles += files.length;
    
    console.log(`📁 Processing ${files.length} files in ${dir}/`);
    
    for (const file of files) {
      const removed = processFile(file);
      if (removed > 0) {
        processedFiles++;
        totalRemoved += removed;
      }
    }
  }
  
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${processedFiles}`);
  console.log(`   Console statements removed: ${totalRemoved}`);
  
  if (totalRemoved > 0) {
    console.log('\n✅ Console log cleanup completed successfully!');
    console.log('   Note: console.error and console.warn statements were preserved.');
  } else {
    console.log('\n✨ No console logs found to clean up!');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  cleanConsoleLogsFromContent,
  processFile,
  getAllFiles
};
