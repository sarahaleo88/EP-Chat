#!/usr/bin/env node
/**
 * Final validation script for 100/100 publication readiness score
 */

const { execSync } = require('child_process');
const fs = require('fs');

class FinalValidator {
  constructor() {
    this.score = 0;
    this.maxScore = 100;
    this.results = {
      security: { score: 0, max: 20, details: [] },
      quality: { score: 0, max: 20, details: [] },
      documentation: { score: 0, max: 20, details: [] },
      governance: { score: 0, max: 20, details: [] },
      automation: { score: 0, max: 20, details: [] }
    };
  }

  /**
   * Validate security aspects
   */
  validateSecurity() {
    console.log('🔒 Validating Security (20 points)...');
    
    try {
      // Check for vulnerabilities
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      const vulnCount = audit.metadata?.vulnerabilities ? 
        Object.values(audit.metadata.vulnerabilities).reduce((sum, count) => sum + count, 0) : 0;
      
      if (vulnCount === 0) {
        this.results.security.score += 5;
        this.results.security.details.push('✅ Zero vulnerabilities');
      }

      // Check security documentation
      if (fs.existsSync('SECURITY.md')) {
        this.results.security.score += 5;
        this.results.security.details.push('✅ Security policy exists');
      }

      if (fs.existsSync('docs/SECURITY_BASELINE.md')) {
        this.results.security.score += 5;
        this.results.security.details.push('✅ Security baseline documented');
      }

      if (fs.existsSync('docs/SECURITY_ARCHITECTURE.md')) {
        this.results.security.score += 5;
        this.results.security.details.push('✅ Security architecture documented');
      }

    } catch (error) {
      this.results.security.details.push('❌ Security validation failed');
    }
  }

  /**
   * Validate code quality
   */
  validateQuality() {
    console.log('✨ Validating Quality (20 points)...');
    
    try {
      // Run tests
      execSync('npm test -- --run', { stdio: 'pipe' });
      this.results.quality.score += 5;
      this.results.quality.details.push('✅ All tests passing');

      // Type checking
      execSync('npm run type-check', { stdio: 'pipe' });
      this.results.quality.score += 5;
      this.results.quality.details.push('✅ Type checking passed');

      // Build success
      execSync('npm run build', { stdio: 'pipe' });
      this.results.quality.score += 5;
      this.results.quality.details.push('✅ Build successful');

      // ESLint check
      const lintResult = execSync('npm run lint', { encoding: 'utf8' });
      if (lintResult.includes('No ESLint warnings or errors')) {
        this.results.quality.score += 5;
        this.results.quality.details.push('✅ No ESLint errors');
      } else {
        this.results.quality.details.push('⚠️ Minor ESLint warnings');
        this.results.quality.score += 4; // Minor deduction for warnings
      }

    } catch (error) {
      this.results.quality.details.push('❌ Quality validation failed');
    }
  }

  /**
   * Validate documentation
   */
  validateDocumentation() {
    console.log('📚 Validating Documentation (20 points)...');
    
    const requiredDocs = [
      'README.md',
      'CONTRIBUTING.md',
      'CODE_OF_CONDUCT.md',
      'CHANGELOG.md',
      'LICENSE'
    ];

    let docScore = 0;
    for (const doc of requiredDocs) {
      if (fs.existsSync(doc)) {
        docScore += 4;
        this.results.documentation.details.push(`✅ ${doc} exists`);
      }
    }

    this.results.documentation.score = docScore;
  }

  /**
   * Validate governance
   */
  validateGovernance() {
    console.log('🏛️ Validating Governance (20 points)...');
    
    const governanceFiles = [
      '.github/CODEOWNERS',
      '.github/ISSUE_TEMPLATE/bug_report.yml',
      '.github/ISSUE_TEMPLATE/feature_request.yml',
      '.github/pull_request_template.md'
    ];

    let govScore = 0;
    for (const file of governanceFiles) {
      if (fs.existsSync(file)) {
        govScore += 5;
        this.results.governance.details.push(`✅ ${file} exists`);
      }
    }

    this.results.governance.score = govScore;
  }

  /**
   * Validate automation
   */
  validateAutomation() {
    console.log('🤖 Validating Automation (20 points)...');
    
    const workflowFiles = [
      '.github/workflows/security-audit.yml',
      '.github/workflows/deploy.yml'
    ];

    let autoScore = 0;
    for (const file of workflowFiles) {
      if (fs.existsSync(file)) {
        autoScore += 5;
        this.results.automation.details.push(`✅ ${file} exists`);
      }
    }

    // Badge system
    if (fs.existsSync('scripts/update-badges.js')) {
      autoScore += 5;
      this.results.automation.details.push('✅ Badge generation system');
    }

    // Package.json scripts
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts && Object.keys(packageJson.scripts).length >= 6) {
      autoScore += 5;
      this.results.automation.details.push('✅ Comprehensive npm scripts');
    }

    this.results.automation.score = autoScore;
  }

  /**
   * Calculate final score
   */
  calculateFinalScore() {
    this.score = Object.values(this.results).reduce((total, category) => total + category.score, 0);
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL PUBLICATION READINESS REPORT');
    console.log('='.repeat(60));

    for (const [category, result] of Object.entries(this.results)) {
      console.log(`\n${category.toUpperCase()}: ${result.score}/${result.max}`);
      for (const detail of result.details) {
        console.log(`  ${detail}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🏆 FINAL SCORE: ${this.score}/${this.maxScore}`);
    
    if (this.score === this.maxScore) {
      console.log('🎉 PERFECT SCORE ACHIEVED! Ready for GitHub publication!');
    } else if (this.score >= 95) {
      console.log('✅ Excellent score! Ready for GitHub publication!');
    } else {
      console.log('⚠️ Score needs improvement before publication.');
    }
    
    console.log('='.repeat(60));
  }

  /**
   * Run complete validation
   */
  async run() {
    console.log('🔍 Starting final validation for EP Chat...\n');

    this.validateSecurity();
    this.validateQuality();
    this.validateDocumentation();
    this.validateGovernance();
    this.validateAutomation();
    
    this.calculateFinalScore();
    this.generateReport();

    return this.score;
  }
}

// Run the validator if this script is executed directly
if (require.main === module) {
  const validator = new FinalValidator();
  validator.run().then(score => {
    process.exit(score === 100 ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = FinalValidator;
