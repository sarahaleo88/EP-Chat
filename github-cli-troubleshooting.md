# GitHub CLI 认证问题解决方案

## 问题描述
- 浏览器显示认证成功，但 CLI 显示未认证
- 认证过程中进程经常中断

## 解决方案

### 1. 快速验证当前状态
```bash
gh auth status
```

### 2. 如果需要重新认证，使用稳定的方法

#### 方法 A: 使用 Personal Access Token (推荐)
```bash
# 1. 在 GitHub 创建 Personal Access Token
# 访问: https://github.com/settings/tokens
# 选择 scopes: repo, workflow, gist, read:org

# 2. 使用 token 认证
echo "YOUR_TOKEN_HERE" | gh auth login --with-token
```

#### 方法 B: 使用浏览器认证 (改进版)
```bash
# 使用更稳定的认证方式
gh auth login --web --git-protocol https --hostname github.com
```

### 3. 验证认证成功
```bash
gh auth status
gh api user
```

### 4. 预防进程中断的最佳实践

1. **使用 screen 或 tmux**:
```bash
# 启动 screen 会话
screen -S github-auth
gh auth login
# Ctrl+A, D 分离会话
# screen -r github-auth 重新连接
```

2. **设置更长的超时时间**:
```bash
# 在认证前设置环境变量
export GH_BROWSER_TIMEOUT=300  # 5分钟超时
gh auth login
```

3. **使用 nohup 防止进程中断**:
```bash
nohup gh auth login &
```

### 5. 故障排除命令

```bash
# 检查 GitHub CLI 版本
gh --version

# 清除现有认证
gh auth logout

# 检查配置文件
cat ~/.config/gh/hosts.yml

# 检查网络连接
curl -I https://github.com

# 检查进程状态
ps aux | grep gh
```

## 当前状态
✅ GitHub CLI 认证已成功
✅ 用户: sarahaleo88
✅ 协议: HTTPS
✅ 权限: repo, workflow, gist, read:org
