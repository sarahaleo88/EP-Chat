#!/bin/bash

# EP (Enhanced Prompt) 项目验证脚本
# 验证项目完整性和配置正确性

set -e

echo "🍀 EP 项目验证脚本启动..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_file() {
    if [ -f "$1" ]; then
        echo -e "✅ ${GREEN}$1${NC}"
        return 0
    else
        echo -e "❌ ${RED}$1 缺失${NC}"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "✅ ${GREEN}$1/${NC}"
        return 0
    else
        echo -e "❌ ${RED}$1/ 目录缺失${NC}"
        return 1
    fi
}

# 项目结构检查
echo "📁 检查项目结构..."

# 核心文件
check_file "package.json"
check_file "next.config.js"
check_file "tailwind.config.js"
check_file "tsconfig.json"
check_file "vitest.config.ts"
check_file "README.md"
check_file "Dockerfile"
check_file "docker-compose.yml"
check_file ".env.example"
check_file ".eslintrc.json"
check_file ".prettierrc"
check_file ".gitignore"

# 目录结构
check_dir "app"
check_dir "app/components"
check_dir "app/api"
check_dir "lib"
check_dir "templates"
check_dir "templates/code"
check_dir "templates/web"
check_dir "tests"
check_dir "public"
check_dir "scripts"

# 关键组件文件
echo ""
echo "🧩 检查核心组件..."
check_file "app/layout.tsx"
check_file "app/page.tsx"
check_file "app/globals.css"
check_file "app/api/generate/route.ts"
check_file "app/components/PromptInput.tsx"
check_file "app/components/PromptOutput.tsx"
check_file "app/components/TemplateSelector.tsx"
check_file "app/components/ModelSwitch.tsx"
check_file "app/components/LoadingSpinner.tsx"

# 核心库文件
echo ""
echo "📚 检查核心库..."
check_file "lib/types.ts"
check_file "lib/utils.ts"
check_file "lib/deepseek.ts"
check_file "lib/template-registry.ts"
check_file "lib/prompt-generator.ts"

# 模板文件
echo ""
echo "📋 检查模板文件..."
check_file "templates/schema.json"
check_file "templates/code/email-validator.json"
check_file "templates/code/debounce-utility.json"
check_file "templates/code/data-structure.json"
check_file "templates/web/weather-app.json"
check_file "templates/web/color-picker.json"
check_file "templates/web/dashboard.json"

# 测试文件
echo ""
echo "🧪 检查测试文件..."
check_file "tests/setup.ts"
check_file "tests/template-registry.test.ts"
check_file "tests/prompt-generator.test.ts"

# 静态资源
echo ""
echo "🎨 检查静态资源..."
check_file "public/favicon.svg"
check_file "public/favicon.ico"
check_file "public/shamrock-logo.png"
check_file "public/manifest.json"

# 检查 package.json 依赖
echo ""
echo "📦 检查依赖配置..."
if command -v node &> /dev/null; then
    if node -e "
        const pkg = require('./package.json');
        const requiredDeps = ['next', 'react', 'react-dom', '@headlessui/react', '@heroicons/react'];
        const requiredDevDeps = ['typescript', 'tailwindcss', 'vitest', '@testing-library/react'];
        
        let missing = [];
        requiredDeps.forEach(dep => {
            if (!pkg.dependencies[dep]) missing.push('dependencies.' + dep);
        });
        requiredDevDeps.forEach(dep => {
            if (!pkg.devDependencies[dep]) missing.push('devDependencies.' + dep);
        });
        
        if (missing.length > 0) {
            console.log('❌ 缺少依赖:', missing.join(', '));
            process.exit(1);
        } else {
            console.log('✅ 依赖配置正确');
        }
    "; then
        echo -e "✅ ${GREEN}package.json 依赖检查通过${NC}"
    else
        echo -e "❌ ${RED}package.json 依赖检查失败${NC}"
    fi
else
    echo -e "⚠️ ${YELLOW}Node.js 未安装，跳过依赖检查${NC}"
fi

# 检查环境变量配置
echo ""
echo "🔧 检查环境配置..."
if [ -f ".env" ]; then
    if grep -q "DEEPSEEK_API_KEY=" .env && ! grep -q "DEEPSEEK_API_KEY=your_deepseek_api_key_here" .env; then
        echo -e "✅ ${GREEN}.env 文件配置正确${NC}"
    else
        echo -e "⚠️ ${YELLOW}.env 文件存在但 DEEPSEEK_API_KEY 未配置${NC}"
    fi
else
    echo -e "⚠️ ${YELLOW}.env 文件不存在，请从 .env.example 复制并配置${NC}"
fi

# 检查 Docker 配置
echo ""
echo "🐳 检查 Docker 配置..."
if command -v docker &> /dev/null; then
    echo -e "✅ ${GREEN}Docker 已安装${NC}"
    if docker compose version &> /dev/null || command -v docker-compose &> /dev/null; then
        echo -e "✅ ${GREEN}Docker Compose 已安装${NC}"
    else
        echo -e "❌ ${RED}Docker Compose 未安装${NC}"
    fi
else
    echo -e "⚠️ ${YELLOW}Docker 未安装${NC}"
fi

# 项目统计
echo ""
echo "📊 项目统计..."
echo "📁 总文件数: $(find . -type f | wc -l)"
echo "📝 TypeScript 文件: $(find . -name "*.ts" -o -name "*.tsx" | wc -l)"
echo "🧪 测试文件: $(find . -name "*.test.ts" -o -name "*.spec.ts" | wc -l)"
echo "📋 模板文件: $(find templates -name "*.json" | wc -l)"

echo ""
echo "🎉 项目验证完成!"
echo ""
echo "📋 下一步操作:"
echo "1. 复制 .env.example 为 .env 并配置 DEEPSEEK_API_KEY"
echo "2. 运行 npm install 安装依赖"
echo "3. 运行 npm run dev 启动开发服务器"
echo "4. 或运行 ./scripts/deploy.sh 进行 Docker 部署"
echo ""
echo "🍀 EP - Enhanced Prompt 项目已准备就绪!"
