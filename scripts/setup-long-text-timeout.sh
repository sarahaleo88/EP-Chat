#!/bin/bash

# EP Chat 长文本超时功能设置脚本
# 自动配置长文本超时相关的环境变量和设置

set -e

echo "🚀 EP Chat 长文本超时功能设置"
echo "================================"

# 检查是否存在 .env 文件
if [ ! -f ".env" ]; then
    echo "📝 创建 .env 文件..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ 已从 .env.example 复制配置"
    else
        echo "❌ 错误: .env.example 文件不存在"
        exit 1
    fi
fi

# 检查 API 密钥
if ! grep -q "DEEPSEEK_API_KEY=" .env || grep -q "DEEPSEEK_API_KEY=$" .env || grep -q "DEEPSEEK_API_KEY=your_" .env; then
    echo ""
    echo "🔑 API 密钥配置"
    echo "请输入您的 DeepSeek API 密钥:"
    read -r api_key
    
    if [ -n "$api_key" ]; then
        # 更新或添加 API 密钥
        if grep -q "DEEPSEEK_API_KEY=" .env; then
            sed -i.bak "s/DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=$api_key/" .env
        else
            echo "DEEPSEEK_API_KEY=$api_key" >> .env
        fi
        echo "✅ API 密钥已配置"
    else
        echo "⚠️  警告: 未设置 API 密钥，请稍后手动配置"
    fi
fi

# 配置长文本超时设置
echo ""
echo "⚙️  配置长文本超时设置"

# 询问用户使用场景
echo "请选择您的主要使用场景:"
echo "1) 快速对话 (较短超时，适合聊天)"
echo "2) 长文本生成 (较长超时，适合文章写作)"
echo "3) 代码生成 (中等超时，适合编程任务)"
echo "4) 自定义配置"
echo "5) 使用默认配置"

read -p "请输入选择 (1-5): " choice

case $choice in
    1)
        echo "📱 配置快速对话模式..."
        STREAMING_TIMEOUT=120000
        CHUNK_INTERVAL_TIMEOUT=15000
        CONTINUATION_TIMEOUT=90000
        ;;
    2)
        echo "📝 配置长文本生成模式..."
        STREAMING_TIMEOUT=600000
        CHUNK_INTERVAL_TIMEOUT=60000
        CONTINUATION_TIMEOUT=300000
        ;;
    3)
        echo "💻 配置代码生成模式..."
        STREAMING_TIMEOUT=480000
        CHUNK_INTERVAL_TIMEOUT=45000
        CONTINUATION_TIMEOUT=240000
        ;;
    4)
        echo "🔧 自定义配置模式..."
        read -p "流式响应超时 (毫秒, 默认300000): " custom_streaming
        read -p "数据块间隔超时 (毫秒, 默认30000): " custom_chunk
        read -p "续写段超时 (毫秒, 默认180000): " custom_continuation
        
        STREAMING_TIMEOUT=${custom_streaming:-300000}
        CHUNK_INTERVAL_TIMEOUT=${custom_chunk:-30000}
        CONTINUATION_TIMEOUT=${custom_continuation:-180000}
        ;;
    *)
        echo "📋 使用默认配置..."
        STREAMING_TIMEOUT=300000
        CHUNK_INTERVAL_TIMEOUT=30000
        CONTINUATION_TIMEOUT=180000
        ;;
esac

# 更新 .env 文件中的超时配置
update_env_var() {
    local var_name=$1
    local var_value=$2
    
    if grep -q "^$var_name=" .env; then
        sed -i.bak "s/^$var_name=.*/$var_name=$var_value/" .env
    else
        echo "$var_name=$var_value" >> .env
    fi
}

echo "📝 更新配置文件..."
update_env_var "STREAMING_TIMEOUT" "$STREAMING_TIMEOUT"
update_env_var "CHUNK_INTERVAL_TIMEOUT" "$CHUNK_INTERVAL_TIMEOUT"
update_env_var "CONTINUATION_TIMEOUT" "$CONTINUATION_TIMEOUT"

# 确保长文本守护功能启用
if ! grep -q "EP_LONG_OUTPUT_GUARD=" .env; then
    echo "EP_LONG_OUTPUT_GUARD=on" >> .env
elif grep -q "EP_LONG_OUTPUT_GUARD=off" .env; then
    read -p "是否启用长文本守护功能? (y/n): " enable_guard
    if [[ $enable_guard =~ ^[Yy]$ ]]; then
        update_env_var "EP_LONG_OUTPUT_GUARD" "on"
    fi
fi

# 显示配置摘要
echo ""
echo "✅ 配置完成!"
echo "📊 当前超时配置:"
echo "   - 流式响应超时: $(($STREAMING_TIMEOUT / 1000)) 秒"
echo "   - 数据块间隔超时: $(($CHUNK_INTERVAL_TIMEOUT / 1000)) 秒"
echo "   - 续写段超时: $(($CONTINUATION_TIMEOUT / 1000)) 秒"
echo "   - 长文本守护: $(grep "EP_LONG_OUTPUT_GUARD=" .env | cut -d'=' -f2)"

# 询问是否运行测试
echo ""
read -p "是否运行长文本超时测试? (y/n): " run_test

if [[ $run_test =~ ^[Yy]$ ]]; then
    echo "🧪 运行长文本超时测试..."
    
    # 检查是否安装了依赖
    if [ ! -d "node_modules" ]; then
        echo "📦 安装依赖..."
        npm install
    fi
    
    # 运行测试
    if [ -f "scripts/test-long-text-timeout.js" ]; then
        node scripts/test-long-text-timeout.js
    else
        echo "❌ 测试脚本不存在: scripts/test-long-text-timeout.js"
    fi
fi

# 提供启动建议
echo ""
echo "🎯 下一步操作:"
echo "1. 启动应用: npm run dev"
echo "2. 访问: http://localhost:3000"
echo "3. 测试长文本生成功能"
echo ""
echo "📚 更多信息请查看: docs/LONG_TEXT_TIMEOUT_GUIDE.md"

# 创建备份清理
if [ -f ".env.bak" ]; then
    rm .env.bak
fi

echo ""
echo "🎉 长文本超时功能设置完成!"
