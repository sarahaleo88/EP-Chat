#!/bin/bash

# EP Chat VPS 紧急修复脚本
# 一键解决磁盘空间不足和Node.js版本问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}EP Chat VPS 紧急修复脚本${NC}"
echo -e "${BLUE}=========================${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请以root用户运行此脚本${NC}"
    exit 1
fi

# 显示当前状态
echo -e "\n${YELLOW}当前系统状态:${NC}"
echo -e "磁盘使用情况:"
df -h /
echo -e "Docker状态:"
docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "Docker未运行或无容器"

# 第一阶段：紧急清理磁盘空间
echo -e "\n${BLUE}第一阶段: 紧急清理磁盘空间${NC}"
echo -e "${YELLOW}停止所有Docker容器...${NC}"
docker stop $(docker ps -aq) 2>/dev/null || true

echo -e "${YELLOW}清理Docker资源...${NC}"
docker container prune -f 2>/dev/null || true
docker image prune -a -f 2>/dev/null || true
docker network prune -f 2>/dev/null || true
docker volume prune -f 2>/dev/null || true
docker builder prune -a -f 2>/dev/null || true

echo -e "${YELLOW}清理系统缓存...${NC}"
apt-get clean 2>/dev/null || true
apt-get autoclean 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

echo -e "${YELLOW}清理日志文件...${NC}"
journalctl --vacuum-time=3d 2>/dev/null || true
find /var/log -name "*.log" -type f -mtime +3 -delete 2>/dev/null || true
find /var/log -name "*.gz" -type f -mtime +3 -delete 2>/dev/null || true

echo -e "${YELLOW}清理临时文件...${NC}"
find /tmp -type f -atime +1 -delete 2>/dev/null || true
find /var/tmp -type f -atime +1 -delete 2>/dev/null || true

echo -e "${YELLOW}清理npm缓存...${NC}"
npm cache clean --force 2>/dev/null || true
rm -rf /root/.npm/_logs/* 2>/dev/null || true
rm -rf /root/.npm/_cacache/* 2>/dev/null || true
rm -rf /root/.cache/* 2>/dev/null || true

echo -e "${GREEN}✓ 第一阶段清理完成${NC}"
echo -e "清理后磁盘使用情况:"
df -h /

# 检查可用空间
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
REQUIRED_SPACE=1048576  # 1GB in KB

if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
    echo -e "${RED}警告: 可用空间仍然不足1GB${NC}"
    echo -e "${YELLOW}尝试更激进的清理...${NC}"
    
    # 更激进的清理
    docker system prune -a --volumes -f 2>/dev/null || true
    find /var -name "*.log" -type f -size +100M -delete 2>/dev/null || true
    
    # 再次检查
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
        echo -e "${RED}磁盘空间仍然不足，请手动清理更多文件${NC}"
        echo -e "${YELLOW}建议检查大文件: du -sh /* | sort -hr | head -10${NC}"
        exit 1
    fi
fi

# 第二阶段：更新项目代码
echo -e "\n${BLUE}第二阶段: 更新项目代码${NC}"

# 检查项目目录
PROJECT_DIRS=("/opt/ep-chat" "/root/ep-chat" "./")
PROJECT_DIR=""

for dir in "${PROJECT_DIRS[@]}"; do
    if [ -f "$dir/docker-compose.yml" ]; then
        PROJECT_DIR="$dir"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo -e "${RED}未找到EP Chat项目目录${NC}"
    echo -e "${YELLOW}请确保在正确的目录运行此脚本${NC}"
    exit 1
fi

echo -e "${GREEN}找到项目目录: $PROJECT_DIR${NC}"
cd "$PROJECT_DIR"

# 备份当前配置
echo -e "${YELLOW}备份当前配置...${NC}"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp .env "$BACKUP_DIR/" 2>/dev/null || echo "警告: .env文件不存在"
cp docker-compose.yml "$BACKUP_DIR/"

# 拉取最新代码
echo -e "${YELLOW}拉取最新代码...${NC}"
git fetch origin 2>/dev/null || true
git reset --hard origin/feature/mobile-ui-optimization-and-timeout-improvements 2>/dev/null || \
git reset --hard origin/main 2>/dev/null || \
echo -e "${RED}Git更新失败，继续使用当前代码${NC}"

# 检查Dockerfile是否包含Node 22
if grep -q "FROM node:22-alpine" Dockerfile; then
    echo -e "${GREEN}✓ Dockerfile已更新为Node.js 22${NC}"
else
    echo -e "${YELLOW}更新Dockerfile为Node.js 22...${NC}"
    sed -i 's/FROM node:18-alpine/FROM node:22-alpine/g' Dockerfile
    sed -i 's/FROM node:20-alpine/FROM node:22-alpine/g' Dockerfile
    sed -i 's/--only=production/--omit=dev/g' Dockerfile
fi

# 第三阶段：重新构建和部署
echo -e "\n${BLUE}第三阶段: 重新构建和部署${NC}"

# 创建.dockerignore以减少构建上下文
echo -e "${YELLOW}优化构建上下文...${NC}"
cat > .dockerignore << EOF
node_modules
.git
*.log
.next
backups
backup-*
test-results
EOF

# 停止现有服务
echo -e "${YELLOW}停止现有服务...${NC}"
docker compose down 2>/dev/null || true

# 清理旧镜像
echo -e "${YELLOW}清理旧镜像...${NC}"
docker rmi $(docker images -q "*ep*" 2>/dev/null) 2>/dev/null || true

# 重新构建
echo -e "${YELLOW}重新构建Docker镜像...${NC}"
echo -e "${YELLOW}这可能需要几分钟时间，请耐心等待...${NC}"
docker compose build --no-cache --parallel

# 启动服务
echo -e "${YELLOW}启动服务...${NC}"
docker compose up -d

# 第四阶段：验证部署
echo -e "\n${BLUE}第四阶段: 验证部署${NC}"

echo -e "${YELLOW}等待服务启动...${NC}"
sleep 30

echo -e "${YELLOW}检查服务状态...${NC}"
docker compose ps

echo -e "${YELLOW}检查应用健康状态...${NC}"
for i in {1..5}; do
    if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 应用健康检查通过${NC}"
        break
    else
        echo -e "${YELLOW}等待应用启动... ($i/5)${NC}"
        sleep 10
    fi
done

# 最终状态报告
echo -e "\n${GREEN}EP Chat VPS 修复完成！${NC}"
echo -e "${GREEN}=====================${NC}"
echo -e "应用地址: ${YELLOW}http://localhost:3000${NC}"
echo -e "应用地址: ${YELLOW}https://ai.saraha.cc${NC}"

echo -e "\n${BLUE}服务状态:${NC}"
docker compose ps

echo -e "\n${BLUE}磁盘使用情况:${NC}"
df -h /

echo -e "\n${BLUE}有用的命令:${NC}"
echo -e "查看日志: ${YELLOW}docker compose logs -f ep-app${NC}"
echo -e "重启服务: ${YELLOW}docker compose restart${NC}"
echo -e "查看状态: ${YELLOW}docker compose ps${NC}"

# 如果健康检查失败，显示调试信息
if ! curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "\n${RED}警告: 应用健康检查失败${NC}"
    echo -e "${YELLOW}调试信息:${NC}"
    echo -e "容器状态:"
    docker compose ps
    echo -e "\n最近的日志:"
    docker compose logs --tail=20 ep-app
fi
