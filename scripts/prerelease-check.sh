#!/bin/bash
echo "=== 预发布检查 ==="

# 1. 确保 package-lock.json 存在
if [ ! -f "package-lock.json" ]; then
    echo "❌ package-lock.json 不存在，正在生成..."
    npm i --package-lock-only
fi

# 2. 类型检查
echo -e "\n=== 类型检查 ==="
npm run type-check

# 3. 安全审计
echo -e "\n=== 安全审计 ==="
npm audit --audit-level=moderate

# 4. 构建测试
echo -e "\n=== 构建测试 ==="
npm run build

# 5. 单元测试（如果有）
# echo -e "\n=== 单元测试 ==="
# npm test

echo -e "\n✅ 所有检查完成！"