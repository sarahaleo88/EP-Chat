#!/bin/bash

# EP (Enhanced Prompt) 部署脚本
# 用于快速部署到生产环境

set -e

echo "🍀 EP 部署脚本启动..."

# 检查环境变量
if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "请复制 .env.example 为 .env 并配置必要的环境变量"
    exit 1
fi

# 检查 DeepSeek API Key
if ! grep -q "DEEPSEEK_API_KEY=" .env || grep -q "DEEPSEEK_API_KEY=your_deepseek_api_key_here" .env; then
    echo "❌ 错误: 请在 .env 文件中配置有效的 DEEPSEEK_API_KEY"
    exit 1
fi

echo "✅ 环境变量检查通过"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    echo "请安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    echo "请安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker 环境检查通过"

# 停止现有服务
echo "🛑 停止现有服务..."
docker compose down --remove-orphans || true

# 清理旧镜像（可选）
read -p "是否清理旧的 Docker 镜像? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧镜像..."
    docker system prune -f
    docker image prune -f
fi

# 构建新镜像
echo "🔨 构建 Docker 镜像..."
docker compose build --no-cache

# 启动服务
echo "🚀 启动服务..."
docker compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 健康检查
echo "🔍 执行健康检查..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000/api/generate > /dev/null 2>&1; then
        echo "✅ 服务启动成功!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ 服务启动失败，请检查日志:"
        docker compose logs
        exit 1
    fi
    
    echo "⏳ 等待服务启动... ($attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

# 显示服务状态
echo "📊 服务状态:"
docker compose ps

# 显示访问信息
echo ""
echo "🎉 部署完成!"
echo "📱 访问地址: http://localhost:3000"
echo "📋 查看日志: docker compose logs -f"
echo "🛑 停止服务: docker compose down"
echo ""
echo "🍀 EP - Enhanced Prompt 已成功部署!"
