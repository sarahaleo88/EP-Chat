# 📝 Developer Certificate of Origin (DCO)

## 🎯 Overview

EP Chat requires all contributors to certify their contributions using the Developer Certificate of Origin (DCO). This is a simple way to certify that you wrote or otherwise have the right to submit the code you are contributing to the project.

## 📋 Developer Certificate of Origin v1.1

By making a contribution to this project, I certify that:

**(a)** The contribution was created in whole or in part by me and I have the right to submit it under the open source license indicated in the file; or

**(b)** The contribution is based upon previous work that, to the best of my knowledge, is covered under an appropriate open source license and I have the right under that license to submit that work with modifications, whether created in whole or in part by me, under the same open source license (unless I am permitted to submit under a different license), as indicated in the file; or

**(c)** The contribution was provided directly to me by some other person who certified (a), (b) or (c) and I have not modified it.

**(d)** I understand and agree that this project and the contribution are public and that a record of the contribution (including all personal information I submit with it, including my sign-off) is maintained indefinitely and may be redistributed consistent with this project or the open source license(s) involved.

## ✍️ How to Sign Your Commits

### Automatic Signing (Recommended)

Configure Git to automatically sign your commits:

```bash
# Set your name and email (required for DCO)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Enable automatic signing for all commits
git config --global commit.gpgsign true
git config --global format.signoff true
```

### Manual Signing

For each commit, add the `-s` flag:

```bash
git commit -s -m "Your commit message"
```

This adds a "Signed-off-by" line to your commit message:

```
Your commit message

Signed-off-by: Your Name <your.email@example.com>
```

### Bulk Signing Existing Commits

If you need to sign existing commits in a branch:

```bash
# Interactive rebase to sign commits
git rebase --signoff HEAD~<number-of-commits>

# Or sign all commits in current branch
git rebase --signoff main
```

## 🔍 Verification Process

### Automated Checks

Our CI/CD pipeline automatically verifies that:
- All commits in a pull request are signed off
- The email address matches the GitHub account
- The sign-off format is correct

### Manual Verification

You can manually check if commits are signed:

```bash
# Check last commit
git log -1 --pretty=format:"%h %s%n%b"

# Check all commits in branch
git log --pretty=format:"%h %s%n%b" main..HEAD
```

Look for the "Signed-off-by" line at the end of each commit message.

## 🚫 What Happens Without DCO

Pull requests without proper DCO sign-offs will:
- **Fail CI checks** - Automated builds will fail
- **Be blocked from merging** - Branch protection rules prevent merging
- **Require fixes** - Contributors must add missing sign-offs before review

## 🔧 Fixing Missing Sign-offs

### For the Last Commit
```bash
git commit --amend --signoff
```

### For Multiple Commits
```bash
# Interactive rebase to sign multiple commits
git rebase -i HEAD~<number-of-commits> --signoff

# Sign all commits in current branch
git rebase --signoff main
```

### Force Push After Fixing
```bash
# After fixing sign-offs, force push to update PR
git push --force-with-lease origin your-branch-name
```

## ⚖️ Legal Significance

The DCO serves several important purposes:

### 🛡️ Legal Protection
- **Origin Verification**: Confirms you have the right to contribute the code
- **License Compliance**: Ensures contributions are properly licensed
- **Intellectual Property**: Protects against IP disputes
- **Audit Trail**: Creates a permanent record of contribution rights

### 📈 Project Benefits
- **Compliance**: Meets open source legal requirements
- **Trust**: Builds confidence in the project's legal status
- **Adoption**: Enables corporate adoption with clear provenance
- **Maintenance**: Simplifies long-term project maintenance

## 🤝 Corporate Contributors

### For Employees
If you're contributing as part of your employment:
- Ensure your employer allows open source contributions
- Use your corporate email address for sign-offs
- Follow your company's open source contribution policies
- Consider having your employer sign a Corporate CLA if required

### For Contractors
- Verify that your contract allows open source contributions
- Ensure you own the intellectual property being contributed
- Use appropriate email address for attribution
- Consider IP assignment clauses in your contract

## 🔄 DCO vs. CLA

### Developer Certificate of Origin (DCO)
- **Lightweight**: Simple sign-off process
- **Distributed**: No central agreement required  
- **Standard**: Widely used in open source projects
- **Flexible**: Works for individual and corporate contributors

### Contributor License Agreement (CLA)
- **Formal**: Separate legal agreement
- **Centralized**: Managed through external services
- **Complex**: More legal overhead
- **Restrictive**: May require legal review

EP Chat uses DCO because it provides legal protection while maintaining a low barrier to contribution.

## 📚 Resources

### Official Documentation
- [Developer Certificate of Origin](https://developercertificate.org/)
- [Git Sign-off Documentation](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---signoff)
- [Linux Foundation DCO Guide](https://wiki.linuxfoundation.org/dco)

### Tools and Automation
- [DCO GitHub App](https://github.com/apps/dco) - Automated DCO checking
- [Probot DCO](https://probot.github.io/apps/dco/) - Alternative DCO bot
- [Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks) - Local automation

### Examples
- [Kubernetes DCO](https://github.com/kubernetes/community/blob/master/CLA.md)
- [Docker DCO](https://github.com/moby/moby/blob/master/CONTRIBUTING.md#sign-your-work)
- [Node.js DCO](https://github.com/nodejs/node/blob/main/CONTRIBUTING.md#developers-certificate-of-origin-11)

## ❓ Frequently Asked Questions

### Q: Why do we need DCO sign-offs?
A: DCO protects both contributors and the project by ensuring legal right to contribute code and maintaining clear intellectual property provenance.

### Q: What if I forget to sign a commit?
A: You can amend the commit with `git commit --amend --signoff` or use interactive rebase for multiple commits.

### Q: Can I contribute without signing?
A: No, all contributions must be signed off. This is enforced by automated checks and branch protection rules.

### Q: What email should I use?
A: Use the same email address associated with your GitHub account to avoid verification issues.

### Q: Is DCO legally binding?
A: Yes, the sign-off constitutes a legal certification under the DCO terms, though it's less formal than a CLA.

## 📞 Support

Need help with DCO sign-offs?
- **Documentation Issues**: Open an issue in the repository
- **Technical Problems**: Check our troubleshooting guide
- **Legal Questions**: Consult with legal counsel
- **Process Questions**: Contact project maintainers

---

**DCO Policy Version**: 1.1  
**Effective Date**: July 2025  
**Last Updated**: July 2025  
**Next Review**: January 2026

*This DCO requirement ensures EP Chat maintains the highest standards of legal compliance while keeping contribution barriers low.*