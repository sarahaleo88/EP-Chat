#!/bin/bash

# EP Chat VPS 更新部署脚本
# 用于在VPS上更新和重新部署EP Chat项目

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="/opt/ep-chat"

echo -e "${BLUE}EP Chat VPS 更新部署脚本${NC}"
echo -e "${BLUE}===========================${NC}"

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}错误: 未找到docker-compose.yml文件${NC}"
    echo -e "${YELLOW}请确保在EP Chat项目目录中运行此脚本${NC}"
    exit 1
fi

# 检查磁盘空间
echo -e "\n${BLUE}1. 检查磁盘空间...${NC}"
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
REQUIRED_SPACE=2097152  # 2GB in KB

if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
    echo -e "${RED}警告: 磁盘空间不足 (需要至少2GB)${NC}"
    echo -e "${YELLOW}是否要运行清理脚本? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        if [ -f "scripts/cleanup-vps.sh" ]; then
            chmod +x scripts/cleanup-vps.sh
            ./scripts/cleanup-vps.sh
        else
            echo -e "${RED}清理脚本不存在，请手动清理磁盘空间${NC}"
            exit 1
        fi
    else
        echo -e "${RED}请先清理磁盘空间后再运行此脚本${NC}"
        exit 1
    fi
fi

# 创建备份
echo -e "\n${BLUE}2. 创建配置备份...${NC}"
BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp .env "$BACKUP_DIR/" 2>/dev/null || echo -e "${YELLOW}警告: .env文件不存在${NC}"
cp docker-compose.yml "$BACKUP_DIR/"
echo -e "${GREEN}✓ 备份已创建: $BACKUP_DIR${NC}"

# 停止现有服务
echo -e "\n${BLUE}3. 停止现有服务...${NC}"
docker compose down || true

# 拉取最新代码
echo -e "\n${BLUE}4. 拉取最新代码...${NC}"
git fetch origin
git reset --hard origin/main
echo -e "${GREEN}✓ 代码已更新到最新版本${NC}"

# 检查环境配置
echo -e "\n${BLUE}5. 检查环境配置...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}创建.env文件...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}请编辑.env文件并设置必要的环境变量${NC}"
        echo -e "${YELLOW}特别是DEEPSEEK_API_KEY${NC}"
    else
        echo -e "${RED}错误: .env.example文件不存在${NC}"
        exit 1
    fi
fi

# 清理Docker资源
echo -e "\n${BLUE}6. 清理旧的Docker资源...${NC}"
docker system prune -f
docker builder prune -f

# 构建新镜像
echo -e "\n${BLUE}7. 构建新的Docker镜像...${NC}"
echo -e "${YELLOW}这可能需要几分钟时间...${NC}"
docker compose build --no-cache --parallel

# 启动服务
echo -e "\n${BLUE}8. 启动服务...${NC}"
docker compose up -d

# 等待服务启动
echo -e "\n${BLUE}9. 等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo -e "\n${BLUE}10. 检查服务状态...${NC}"
docker compose ps

# 健康检查
echo -e "\n${BLUE}11. 执行健康检查...${NC}"
sleep 5
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 应用健康检查通过${NC}"
else
    echo -e "${RED}✗ 应用健康检查失败${NC}"
    echo -e "${YELLOW}查看日志: docker compose logs ep-app${NC}"
fi

# 显示最终状态
echo -e "\n${GREEN}EP Chat 更新部署完成！${NC}"
echo -e "${GREEN}========================${NC}"
echo -e "应用地址: ${YELLOW}http://localhost:3000${NC}"
echo -e "查看日志: ${YELLOW}docker compose logs -f${NC}"
echo -e "查看状态: ${YELLOW}docker compose ps${NC}"

# 显示有用的命令
echo -e "\n${BLUE}常用命令:${NC}"
echo -e "查看应用日志: ${YELLOW}docker compose logs -f ep-app${NC}"
echo -e "重启服务: ${YELLOW}docker compose restart${NC}"
echo -e "停止服务: ${YELLOW}docker compose down${NC}"
echo -e "查看资源使用: ${YELLOW}docker stats${NC}"
