#!/bin/bash

# EP Chat VPS 清理脚本
# 用于清理VPS上的磁盘空间，解决Docker构建时的空间不足问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}EP Chat VPS 清理脚本${NC}"
echo -e "${BLUE}=====================${NC}"

# 显示当前磁盘使用情况
echo -e "\n${YELLOW}当前磁盘使用情况:${NC}"
df -h

echo -e "\n${YELLOW}开始清理...${NC}"

# 1. 清理Docker资源
echo -e "\n${BLUE}1. 清理Docker资源...${NC}"
echo -e "${YELLOW}  - 停止所有容器...${NC}"
docker stop $(docker ps -aq) 2>/dev/null || true

echo -e "${YELLOW}  - 删除未使用的容器...${NC}"
docker container prune -f

echo -e "${YELLOW}  - 删除未使用的镜像...${NC}"
docker image prune -a -f

echo -e "${YELLOW}  - 删除未使用的网络...${NC}"
docker network prune -f

echo -e "${YELLOW}  - 删除未使用的卷...${NC}"
docker volume prune -f

echo -e "${YELLOW}  - 清理构建缓存...${NC}"
docker builder prune -a -f

# 2. 清理系统缓存
echo -e "\n${BLUE}2. 清理系统缓存...${NC}"
echo -e "${YELLOW}  - 清理APT缓存...${NC}"
apt-get clean 2>/dev/null || true
apt-get autoclean 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

# 3. 清理日志文件
echo -e "\n${BLUE}3. 清理日志文件...${NC}"
echo -e "${YELLOW}  - 清理系统日志...${NC}"
journalctl --vacuum-time=7d 2>/dev/null || true

echo -e "${YELLOW}  - 清理旧的日志文件...${NC}"
find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
find /var/log -name "*.gz" -type f -mtime +7 -delete 2>/dev/null || true

# 4. 清理临时文件
echo -e "\n${BLUE}4. 清理临时文件...${NC}"
echo -e "${YELLOW}  - 清理/tmp目录...${NC}"
find /tmp -type f -atime +7 -delete 2>/dev/null || true

echo -e "${YELLOW}  - 清理/var/tmp目录...${NC}"
find /var/tmp -type f -atime +7 -delete 2>/dev/null || true

# 5. 清理npm缓存
echo -e "\n${BLUE}5. 清理npm缓存...${NC}"
npm cache clean --force 2>/dev/null || true

# 6. 清理用户缓存
echo -e "\n${BLUE}6. 清理用户缓存...${NC}"
echo -e "${YELLOW}  - 清理root用户缓存...${NC}"
rm -rf /root/.npm/_logs/* 2>/dev/null || true
rm -rf /root/.npm/_cacache/* 2>/dev/null || true
rm -rf /root/.cache/* 2>/dev/null || true

# 显示清理后的磁盘使用情况
echo -e "\n${GREEN}清理完成！${NC}"
echo -e "\n${YELLOW}清理后磁盘使用情况:${NC}"
df -h

echo -e "\n${GREEN}建议的后续操作:${NC}"
echo -e "1. 重新构建Docker镜像: ${YELLOW}docker compose build --no-cache${NC}"
echo -e "2. 启动服务: ${YELLOW}docker compose up -d${NC}"
echo -e "3. 检查服务状态: ${YELLOW}docker compose ps${NC}"

# 检查是否有足够空间进行Docker构建
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
REQUIRED_SPACE=2097152  # 2GB in KB

if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
    echo -e "\n${RED}警告: 可用空间可能仍然不足进行Docker构建${NC}"
    echo -e "${YELLOW}建议释放更多空间或考虑升级VPS配置${NC}"
else
    echo -e "\n${GREEN}✓ 磁盘空间充足，可以进行Docker构建${NC}"
fi
