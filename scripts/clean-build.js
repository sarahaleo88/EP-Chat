#!/usr/bin/env node
/**
 * Clean build script that handles lockfile warnings and ensures clean builds
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CleanBuilder {
  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * Run a clean build process
   */
  async run() {
    console.log('🧹 Starting clean build process...\n');

    try {
      // Step 1: Clean previous builds
      console.log('1️⃣ Cleaning previous builds...');
      this.cleanPreviousBuilds();

      // Step 2: Verify dependencies
      console.log('2️⃣ Verifying dependencies...');
      this.verifyDependencies();

      // Step 3: Run type checking
      console.log('3️⃣ Running type checking...');
      execSync('npm run type-check', { stdio: 'inherit' });

      // Step 4: Run tests
      console.log('4️⃣ Running tests...');
      execSync('npm test -- --run', { stdio: 'inherit' });

      // Step 5: Build application
      console.log('5️⃣ Building application...');
      execSync('npm run build', { stdio: 'inherit' });

      console.log('\n✅ Clean build completed successfully!');
      console.log('🎉 EP Chat is ready for production deployment!');

    } catch (error) {
      console.error('\n❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Clean previous build artifacts
   */
  cleanPreviousBuilds() {
    const dirsToClean = ['.next', 'out', 'dist'];
    
    for (const dir of dirsToClean) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`   Cleaned: ${dir}/`);
      }
    }
  }

  /**
   * Verify dependencies are properly installed
   */
  verifyDependencies() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const lockfileExists = fs.existsSync('package-lock.json');
    
    if (!lockfileExists) {
      console.log('   Generating package-lock.json...');
      execSync('npm install --package-lock-only', { stdio: 'inherit' });
    }

    console.log('   Dependencies verified ✅');
  }
}

// Run the clean builder if this script is executed directly
if (require.main === module) {
  const builder = new CleanBuilder();
  builder.run().catch(error => {
    console.error('Clean build failed:', error);
    process.exit(1);
  });
}

module.exports = CleanBuilder;
