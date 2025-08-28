#!/bin/bash

# EP Chat 回滚脚本
# 快速回滚到之前的稳定版本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
BACKUP_DIR="${1:-}"
ROLLBACK_LOG="./logs/rollback-$(date +%Y%m%d-%H%M%S).log"

# 创建日志目录
mkdir -p logs

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$ROLLBACK_LOG"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$ROLLBACK_LOG"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$ROLLBACK_LOG"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$ROLLBACK_LOG"
}

# 显示使用说明
show_usage() {
    echo "EP Chat 回滚脚本"
    echo ""
    echo "用法:"
    echo "  $0 [backup_directory]     # 回滚到指定备份"
    echo "  $0 --list                 # 列出可用备份"
    echo "  $0 --latest               # 回滚到最新备份"
    echo "  $0 --emergency            # 紧急回滚（禁用长文本守护）"
    echo ""
    echo "示例:"
    echo "  $0 ./backups/20241228-143022"
    echo "  $0 --latest"
    echo "  $0 --emergency"
}

# 列出可用备份
list_backups() {
    log "可用备份列表:"
    
    if [ ! -d "./backups" ]; then
        warn "备份目录不存在"
        return 1
    fi
    
    local backups=($(ls -1t ./backups/ 2>/dev/null || true))
    
    if [ ${#backups[@]} -eq 0 ]; then
        warn "没有找到备份"
        return 1
    fi
    
    echo ""
    printf "%-20s %-15s %-30s\n" "备份目录" "创建时间" "包含文件"
    printf "%-20s %-15s %-30s\n" "--------" "--------" "--------"
    
    for backup in "${backups[@]}"; do
        local backup_path="./backups/$backup"
        local create_time=$(stat -c %y "$backup_path" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1 || echo "未知")
        local files=$(ls -1 "$backup_path" 2>/dev/null | wc -l || echo "0")
        printf "%-20s %-15s %-30s\n" "$backup" "$create_time" "$files 个文件"
    done
    
    echo ""
}

# 获取最新备份
get_latest_backup() {
    if [ ! -d "./backups" ]; then
        error "备份目录不存在"
        return 1
    fi
    
    local latest=$(ls -1t ./backups/ 2>/dev/null | head -1)
    
    if [ -z "$latest" ]; then
        error "没有找到备份"
        return 1
    fi
    
    echo "./backups/$latest"
}

# 验证备份目录
validate_backup() {
    local backup_path="$1"
    
    if [ ! -d "$backup_path" ]; then
        error "备份目录不存在: $backup_path"
        return 1
    fi
    
    # 检查必要文件
    local required_files=("docker-compose.yml" ".env")
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$backup_path/$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -ne 0 ]; then
        error "备份不完整，缺少文件: ${missing_files[*]}"
        return 1
    fi
    
    log "备份验证通过: $backup_path"
    return 0
}

# 创建当前状态快照
create_pre_rollback_snapshot() {
    local snapshot_dir="./backups/pre-rollback-$(date +%Y%m%d-%H%M%S)"
    
    log "创建回滚前快照: $snapshot_dir"
    
    mkdir -p "$snapshot_dir"
    
    # 备份当前配置
    cp docker-compose.yml "$snapshot_dir/" 2>/dev/null || true
    cp .env "$snapshot_dir/" 2>/dev/null || true
    cp nginx.conf "$snapshot_dir/" 2>/dev/null || true
    
    # 记录当前服务状态
    docker-compose ps --format json > "$snapshot_dir/services-before-rollback.json" 2>/dev/null || true
    
    # 记录当前镜像
    docker images --format json > "$snapshot_dir/images-before-rollback.json" 2>/dev/null || true
    
    log "回滚前快照创建完成"
}

# 执行回滚
perform_rollback() {
    local backup_path="$1"
    
    log "开始回滚到: $backup_path"
    
    # 停止当前服务
    log "停止当前服务..."
    docker-compose down --remove-orphans
    
    # 恢复配置文件
    log "恢复配置文件..."
    
    if [ -f "$backup_path/docker-compose.yml" ]; then
        cp "$backup_path/docker-compose.yml" .
        log "恢复 docker-compose.yml"
    fi
    
    if [ -f "$backup_path/.env" ]; then
        cp "$backup_path/.env" .
        log "恢复 .env"
    fi
    
    if [ -f "$backup_path/nginx.conf" ]; then
        cp "$backup_path/nginx.conf" .
        log "恢复 nginx.conf"
    fi
    
    # 启动服务
    log "启动回滚后的服务..."
    docker-compose up -d
    
    # 等待服务启动
    sleep 20
    
    # 健康检查
    if health_check; then
        log "回滚成功，服务正常运行"
        return 0
    else
        error "回滚后服务异常"
        return 1
    fi
}

# 紧急回滚（禁用长文本守护）
emergency_rollback() {
    log "执行紧急回滚..."
    
    # 创建紧急配置
    if [ -f ".env" ]; then
        # 禁用长文本守护
        sed -i.emergency.bak 's/EP_LONG_OUTPUT_GUARD=on/EP_LONG_OUTPUT_GUARD=off/g' .env
        
        # 如果没有该配置，添加它
        if ! grep -q "EP_LONG_OUTPUT_GUARD" .env; then
            echo "EP_LONG_OUTPUT_GUARD=off" >> .env
        fi
        
        log "已禁用长文本守护功能"
    fi
    
    # 重启服务
    log "重启服务..."
    docker-compose down
    docker-compose up -d
    
    # 等待服务启动
    sleep 20
    
    if health_check; then
        log "紧急回滚成功"
        warn "长文本守护功能已禁用，请检查问题后重新启用"
        return 0
    else
        error "紧急回滚失败"
        return 1
    fi
}

# 健康检查
health_check() {
    local max_attempts=10
    local attempt=1
    
    log "执行健康检查..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:3000/api/generate" > /dev/null 2>&1; then
            log "健康检查通过"
            return 0
        fi
        
        info "健康检查失败，等待重试... ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    error "健康检查失败"
    return 1
}

# 生成回滚报告
generate_rollback_report() {
    local backup_path="$1"
    local report_file="./logs/rollback-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# EP Chat 回滚报告

## 回滚信息
- **时间**: $(date)
- **回滚到**: ${backup_path}
- **回滚日志**: ${ROLLBACK_LOG}

## 服务状态
\`\`\`
$(docker-compose ps)
\`\`\`

## 当前配置
- EP_LONG_OUTPUT_GUARD: $(grep EP_LONG_OUTPUT_GUARD .env 2>/dev/null | cut -d'=' -f2 || echo "未设置")

## 健康检查
- API 端点: $(curl -f -s "http://localhost:3000/api/generate" > /dev/null 2>&1 && echo "✅ 正常" || echo "❌ 异常")

## 后续操作建议
1. 检查应用功能是否正常
2. 查看日志确认问题原因
3. 如需重新部署，请修复问题后执行部署脚本
EOF

    log "回滚报告生成: $report_file"
}

# 主函数
main() {
    case "${1:-}" in
        --help|-h)
            show_usage
            exit 0
            ;;
        --list|-l)
            list_backups
            exit 0
            ;;
        --latest)
            BACKUP_DIR=$(get_latest_backup)
            if [ $? -ne 0 ]; then
                exit 1
            fi
            ;;
        --emergency|-e)
            emergency_rollback
            exit $?
            ;;
        "")
            error "请指定备份目录或使用 --latest"
            show_usage
            exit 1
            ;;
        *)
            BACKUP_DIR="$1"
            ;;
    esac
    
    # 验证备份
    if ! validate_backup "$BACKUP_DIR"; then
        exit 1
    fi
    
    # 创建回滚前快照
    create_pre_rollback_snapshot
    
    # 执行回滚
    if perform_rollback "$BACKUP_DIR"; then
        # 生成回滚报告
        generate_rollback_report "$BACKUP_DIR"
        
        log "🎉 回滚完成！"
        log "📊 访问 http://localhost:3000 查看应用"
        log "📋 回滚报告: ./logs/rollback-report-*.md"
        
        # 显示服务状态
        echo ""
        info "当前服务状态:"
        docker-compose ps
    else
        error "回滚失败"
        exit 1
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
