# 🛡️ Branch Protection Policy

This document outlines EP Chat's branch protection strategy and required settings to maintain code quality, security, and project integrity.

## 🎯 Policy Overview

Branch protection is a critical security control that ensures all changes to the main codebase undergo proper review, testing, and validation before integration.

## 🔒 Protected Branches

### Main Branch (`main`)
**Protection Level**: Maximum Security
**Purpose**: Production-ready code
**Required Settings**:

#### Pull Request Requirements
- ✅ **Require pull requests before merging**
- ✅ **Require at least 1 approval from code owners**
- ✅ **Dismiss stale reviews when new commits are pushed**
- ✅ **Require review from code owners**
- ✅ **Restrict reviews to users with write permissions**

#### Status Check Requirements
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- **Required Checks**:
  - `test (18.x)` - Node.js 18 test suite
  - `test (20.x)` - Node.js 20 test suite
  - `build` - Production build validation
  - `security` - Security audit check
  - `lint` - Code quality check
  - `type-check` - TypeScript validation

#### Push Restrictions
- ✅ **Restrict pushes that create files over 100MB**
- ✅ **Prevent force pushes**
- ✅ **Prevent branch deletion**
- ✅ **Restrict pushes to specific people**
  - Only maintainers with admin access
  - Only for emergency hotfixes (with post-incident review)

#### Additional Protections
- ✅ **Include administrators** (no bypass for admins)
- ✅ **Allow specified actors to bypass pull request requirements**
  - Emergency security patches only
  - Must be documented and reviewed post-incident

### Development Branch (`develop`)
**Protection Level**: Standard
**Purpose**: Integration branch for features
**Required Settings**:

#### Pull Request Requirements
- ✅ **Require pull requests before merging**
- ✅ **Require at least 1 approval**
- ❌ Dismiss stale reviews (optional for dev branch)
- ❌ Require review from code owners (optional)

#### Status Check Requirements
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- **Required Checks**:
  - `test (20.x)` - Primary Node.js version tests
  - `lint` - Code quality check
  - `type-check` - TypeScript validation

#### Push Restrictions
- ✅ **Prevent force pushes**
- ✅ **Prevent branch deletion**
- ❌ Restrict pushes (maintainers can push directly for minor fixes)

### Release Branches (`release/*`)
**Protection Level**: High
**Purpose**: Release preparation and stabilization
**Required Settings**:

#### Pull Request Requirements
- ✅ **Require pull requests before merging**
- ✅ **Require at least 1 approval from maintainers**
- ✅ **Require review from release manager**

#### Status Check Requirements
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- **Required Checks**:
  - `test (18.x)` - Node.js 18 compatibility
  - `test (20.x)` - Node.js 20 primary version
  - `build` - Production build validation
  - `security` - Security audit
  - `integration-test` - End-to-end tests

## 👥 Access Control

### Code Owners
Code owners are automatically requested for review on protected branches.

#### Global Code Owners (`CODEOWNERS`)
```
# Global rules
* @project-lead @security-lead

# Critical files require security review
/SECURITY.md @security-lead
/docs/SECURITY_*.md @security-lead
/.github/workflows/ @project-lead @security-lead

# Dependencies require security review
/package.json @security-lead
/package-lock.json @security-lead

# Configuration files
/.github/ @project-lead
/next.config.js @project-lead
/tsconfig.json @project-lead

# API routes require careful review
/app/api/ @project-lead @security-lead

# Security-sensitive components
/lib/deepseek*.ts @security-lead
/lib/security/ @security-lead
```

### Reviewer Requirements

#### Mandatory Reviewers
- **Security Changes**: Security lead required
- **API Changes**: Project lead required
- **Infrastructure**: Both leads required
- **Dependencies**: Security lead required

#### Review Guidelines
- **Security Focus**: All reviewers must consider security implications
- **Performance Impact**: Review bundle size and performance impact
- **Breaking Changes**: Explicit approval for breaking changes
- **Documentation**: Ensure documentation is updated

## 🚨 Emergency Procedures

### Hotfix Process
For critical security vulnerabilities or production issues:

1. **Assessment**: Confirm emergency status
2. **Approval**: Security lead + project lead approval
3. **Direct Push**: Authorized emergency push to main
4. **Immediate Review**: Create post-incident PR for review
5. **Documentation**: Document emergency bypass reason
6. **Process Review**: Review and improve emergency procedures

### Emergency Bypass Criteria
- **Critical Security Vulnerability**: CVSS 9.0+ actively exploited
- **Production Down**: Complete service unavailability
- **Data Loss Risk**: Imminent risk of data corruption/loss
- **Legal/Compliance**: Immediate compliance requirement

### Post-Emergency Requirements
- **Incident Report**: Within 24 hours
- **Review PR**: Full code review of emergency changes
- **Process Improvement**: Update procedures based on learnings
- **Communication**: Notify stakeholders of emergency changes

## 📊 Compliance Monitoring

### Automated Checks
- **Branch Protection Status**: Daily verification of protection settings
- **Code Owner Coverage**: Ensure all critical paths have code owners
- **Review Compliance**: Monitor review requirements compliance
- **Bypass Monitoring**: Track and audit all protection bypasses

### Metrics & Reporting

#### Weekly Metrics
- **Protection Compliance**: % of merges following protection rules
- **Review Coverage**: % of changes with required reviews
- **Bypass Incidents**: Number and reason for protection bypasses
- **Time to Review**: Average time from PR creation to approval

#### Monthly Reports
- **Security Review Coverage**: % of security-sensitive changes reviewed
- **Emergency Bypasses**: Detailed report of emergency procedures used
- **Process Violations**: Any violations of branch protection policy
- **Improvement Recommendations**: Suggested policy updates

## 🔧 Configuration Management

### GitHub Branch Protection Settings

#### Main Branch Configuration
```yaml
protection_rules:
  required_status_checks:
    strict: true
    contexts:
      - "test (18.x)"
      - "test (20.x)" 
      - "build"
      - "security"
      - "lint"
      - "type-check"
  
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
    restrict_review_dismissals: true
    
  restrictions:
    users: []
    teams: ["maintainers"]
    apps: []
    
  enforce_admins: true
  allow_force_pushes: false
  allow_deletions: false
```

#### Automated Configuration
- **Terraform**: Infrastructure as code for GitHub settings
- **GitHub Apps**: Automated enforcement and monitoring
- **Policy as Code**: Version-controlled protection policies
- **Compliance Scanning**: Regular verification of settings

## 🔄 Policy Updates

### Review Schedule
- **Quarterly**: Regular policy review and updates
- **Post-Incident**: After any security incident or bypass
- **Major Release**: Before each major version release
- **Annually**: Comprehensive policy overhaul

### Update Process
1. **Proposal**: Document proposed changes
2. **Review**: Security and project leads review
3. **Testing**: Test changes in development environment
4. **Approval**: Formal approval by maintainer team
5. **Implementation**: Apply changes to protected branches
6. **Communication**: Notify team of policy changes
7. **Documentation**: Update policy documentation

### Change Categories

#### Minor Updates (No Approval Required)
- Documentation clarifications
- Typo corrections
- Formatting improvements

#### Standard Updates (Security Lead Approval)
- New required status checks
- Additional review requirements
- Code owner additions

#### Major Updates (Full Team Approval)
- Protection level changes
- Emergency procedure modifications
- Fundamental policy restructuring

## 🎓 Training & Education

### Maintainer Training
- **Branch Protection Concepts**: Understanding protection mechanisms
- **Code Review Skills**: Effective security-focused reviews
- **Emergency Procedures**: Proper emergency response protocols
- **Tool Usage**: GitHub protection features and configuration

### Contributor Education
- **Pull Request Process**: How to create effective PRs
- **Review Expectations**: What reviewers look for
- **Protection Rationale**: Why protections exist
- **Compliance Requirements**: Following protection policies

### Resources
- **Documentation**: Comprehensive policy documentation
- **Examples**: Sample PRs and review comments
- **Training Videos**: Visual guides for common procedures
- **Best Practices**: Security review checklists

---

**Policy Version**: 1.0.0  
**Effective Date**: July 2025  
**Next Review**: October 2025  
**Approved By**: Project Lead, Security Lead