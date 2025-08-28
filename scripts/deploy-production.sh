#!/bin/bash

# EP Chat 生产环境部署脚本
# 支持长文本优化的零停机部署

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="ep-chat"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)-longtext}"
BACKUP_DIR="./backups/$(date +%Y%m%d-%H%M%S)"
DEPLOYMENT_LOG="./logs/deployment-$(date +%Y%m%d-%H%M%S).log"

# 创建必要目录
mkdir -p backups logs

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

# 检查必要工具
check_dependencies() {
    log "检查部署依赖..."
    
    local missing_deps=()
    
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "缺少必要依赖: ${missing_deps[*]}"
        exit 1
    fi
    
    log "依赖检查通过"
}

# 检查环境变量
check_environment() {
    log "检查环境配置..."
    
    if [ ! -f ".env" ]; then
        error ".env 文件不存在"
        exit 1
    fi
    
    # 检查关键环境变量
    source .env
    
    if [ -z "$DEEPSEEK_API_KEY" ]; then
        error "DEEPSEEK_API_KEY 未设置"
        exit 1
    fi
    
    # 检查长文本守护配置
    if [ -z "$EP_LONG_OUTPUT_GUARD" ]; then
        warn "EP_LONG_OUTPUT_GUARD 未设置，将使用默认值 'on'"
        echo "EP_LONG_OUTPUT_GUARD=on" >> .env
    fi
    
    log "环境配置检查通过"
}

# 备份当前部署
backup_current_deployment() {
    log "备份当前部署..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 备份 docker-compose 配置
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml "$BACKUP_DIR/"
    fi
    
    # 备份环境变量
    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/"
    fi
    
    # 备份 nginx 配置
    if [ -f "nginx.conf" ]; then
        cp nginx.conf "$BACKUP_DIR/"
    fi
    
    # 导出当前运行的镜像信息
    docker-compose ps --format json > "$BACKUP_DIR/running-services.json" 2>/dev/null || true
    
    log "备份完成: $BACKUP_DIR"
}

# 构建新镜像
build_image() {
    log "构建 Docker 镜像..."
    
    # 构建镜像
    docker build -t "${PROJECT_NAME}:${IMAGE_TAG}" \
        --build-arg NODE_ENV=production \
        --build-arg NEXT_TELEMETRY_DISABLED=1 \
        .
    
    if [ $? -ne 0 ]; then
        error "镜像构建失败"
        exit 1
    fi
    
    # 如果配置了镜像仓库，推送镜像
    if [ -n "$DOCKER_REGISTRY" ]; then
        log "推送镜像到仓库..."
        docker tag "${PROJECT_NAME}:${IMAGE_TAG}" "${DOCKER_REGISTRY}/${PROJECT_NAME}:${IMAGE_TAG}"
        docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}:${IMAGE_TAG}"
        
        # 更新 latest 标签
        docker tag "${PROJECT_NAME}:${IMAGE_TAG}" "${DOCKER_REGISTRY}/${PROJECT_NAME}:latest"
        docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}:latest"
    fi
    
    log "镜像构建完成: ${PROJECT_NAME}:${IMAGE_TAG}"
}

# 更新 docker-compose 配置
update_compose_config() {
    log "更新 docker-compose 配置..."
    
    # 创建临时配置文件
    cp docker-compose.yml docker-compose.yml.tmp
    
    # 更新镜像标签
    if [ -n "$DOCKER_REGISTRY" ]; then
        sed -i.bak "s|image:.*|image: ${DOCKER_REGISTRY}/${PROJECT_NAME}:${IMAGE_TAG}|g" docker-compose.yml.tmp
    else
        sed -i.bak "s|build:|# build:|g" docker-compose.yml.tmp
        sed -i.bak "s|context: .|# context: .|g" docker-compose.yml.tmp
        sed -i.bak "s|dockerfile: Dockerfile|# dockerfile: Dockerfile|g" docker-compose.yml.tmp
        sed -i.bak "/# build:/a\\
    image: ${PROJECT_NAME}:${IMAGE_TAG}" docker-compose.yml.tmp
    fi
    
    # 添加长文本优化的环境变量
    if ! grep -q "EP_LONG_OUTPUT_GUARD" docker-compose.yml.tmp; then
        sed -i.bak '/environment:/a\\
      - EP_LONG_OUTPUT_GUARD=${EP_LONG_OUTPUT_GUARD:-on}' docker-compose.yml.tmp
    fi
    
    log "docker-compose 配置更新完成"
}

# 健康检查
health_check() {
    local service_url="$1"
    local max_attempts=30
    local attempt=1
    
    log "执行健康检查: $service_url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$service_url/api/generate" > /dev/null 2>&1; then
            log "健康检查通过 (尝试 $attempt/$max_attempts)"
            return 0
        fi
        
        info "健康检查失败，等待重试... ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    error "健康检查失败，服务可能未正常启动"
    return 1
}

# 运行长文本压力测试
run_stress_test() {
    log "运行长文本压力测试..."
    
    # 等待服务完全启动
    sleep 30
    
    # 运行压力测试
    if npm run stress-test:full; then
        log "压力测试通过"
        return 0
    else
        warn "压力测试失败，但继续部署"
        return 1
    fi
}

# 零停机部署
zero_downtime_deploy() {
    log "开始零停机部署..."
    
    # 使用临时配置启动新服务
    mv docker-compose.yml.tmp docker-compose.yml
    
    # 拉取最新镜像（如果使用镜像仓库）
    if [ -n "$DOCKER_REGISTRY" ]; then
        docker-compose pull
    fi
    
    # 启动新服务
    docker-compose up -d --no-deps ep-app
    
    # 等待新服务启动
    sleep 20
    
    # 健康检查
    if ! health_check "http://localhost:3000"; then
        error "新服务健康检查失败，回滚部署"
        rollback_deployment
        exit 1
    fi
    
    # 更新 nginx 配置（如果需要）
    if docker-compose ps nginx > /dev/null 2>&1; then
        docker-compose exec nginx nginx -s reload
    fi
    
    # 清理旧容器
    docker-compose up -d --remove-orphans
    
    log "零停机部署完成"
}

# 回滚部署
rollback_deployment() {
    error "开始回滚部署..."
    
    if [ -d "$BACKUP_DIR" ]; then
        # 恢复配置文件
        cp "$BACKUP_DIR/docker-compose.yml" . 2>/dev/null || true
        cp "$BACKUP_DIR/.env" . 2>/dev/null || true
        cp "$BACKUP_DIR/nginx.conf" . 2>/dev/null || true
        
        # 重启服务
        docker-compose down
        docker-compose up -d
        
        log "回滚完成"
    else
        error "备份目录不存在，无法回滚"
    fi
}

# 清理旧镜像
cleanup_old_images() {
    log "清理旧镜像..."
    
    # 保留最近的5个镜像
    docker images "${PROJECT_NAME}" --format "table {{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +2 | sort -k2 -r | tail -n +6 | awk '{print $1}' | \
        xargs -r -I {} docker rmi "${PROJECT_NAME}:{}" 2>/dev/null || true
    
    # 清理悬空镜像
    docker image prune -f
    
    log "镜像清理完成"
}

# 生成部署报告
generate_deployment_report() {
    local report_file="./logs/deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# EP Chat 部署报告

## 部署信息
- **时间**: $(date)
- **版本**: ${IMAGE_TAG}
- **备份位置**: ${BACKUP_DIR}
- **部署日志**: ${DEPLOYMENT_LOG}

## 服务状态
\`\`\`
$(docker-compose ps)
\`\`\`

## 镜像信息
\`\`\`
$(docker images "${PROJECT_NAME}" | head -5)
\`\`\`

## 环境配置
- EP_LONG_OUTPUT_GUARD: ${EP_LONG_OUTPUT_GUARD:-on}
- MODEL_CTX: ${MODEL_CTX:-128000}
- RESERVE_OUTPUT: ${RESERVE_OUTPUT:-8192}

## 健康检查
- API 端点: ✅ 正常
- 长文本功能: $([ -f "./test-results/stress-test-*.json" ] && echo "✅ 测试通过" || echo "⚠️ 未测试")

## 回滚命令
如需回滚，请执行：
\`\`\`bash
./scripts/rollback.sh ${BACKUP_DIR}
\`\`\`
EOF

    log "部署报告生成: $report_file"
}

# 主部署流程
main() {
    log "开始 EP Chat 长文本优化部署"
    
    # 检查依赖和环境
    check_dependencies
    check_environment
    
    # 备份当前部署
    backup_current_deployment
    
    # 构建新镜像
    build_image
    
    # 更新配置
    update_compose_config
    
    # 执行零停机部署
    zero_downtime_deploy
    
    # 运行压力测试
    run_stress_test
    
    # 清理旧镜像
    cleanup_old_images
    
    # 生成部署报告
    generate_deployment_report
    
    log "🎉 EP Chat 长文本优化部署完成！"
    log "📊 访问 http://localhost:3000 查看应用"
    log "📋 部署报告: ./logs/deployment-report-*.md"
    
    # 显示服务状态
    echo ""
    info "当前服务状态:"
    docker-compose ps
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
