# EP Chat Deployment Automation
# Makefile for streamlined Docker operations

# Variables
COMPOSE_FILE = docker-compose.yml
PROJECT_NAME = ep-chat
DOCKER_REGISTRY = 
IMAGE_TAG = latest

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Help target
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)EP Chat Deployment Automation$(NC)"
	@echo "$(BLUE)==============================$(NC)"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Examples:$(NC)"
	@echo "  make build     # Build Docker images"
	@echo "  make up        # Start services"
	@echo "  make logs      # View logs"
	@echo "  make clean     # Clean up resources"

# Environment validation
.PHONY: check-env
check-env: ## Validate environment configuration
	@echo "$(BLUE)Checking environment configuration...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)Error: .env file not found$(NC)"; \
		echo "$(YELLOW)Run: cp .env.example .env$(NC)"; \
		exit 1; \
	fi
	@if ! grep -q "DEEPSEEK_API_KEY=" .env || grep -q "your_deepseek_api_key_here" .env; then \
		echo "$(RED)Error: DEEPSEEK_API_KEY not configured$(NC)"; \
		echo "$(YELLOW)Please set your DeepSeek API key in .env file$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Environment configuration is valid$(NC)"

# Build targets
.PHONY: build
build: check-env ## Build Docker images without cache
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker compose -f $(COMPOSE_FILE) build --no-cache
	@echo "$(GREEN)✓ Build completed$(NC)"

.PHONY: build-quick
build-quick: check-env ## Build Docker images with cache
	@echo "$(BLUE)Building Docker images (with cache)...$(NC)"
	docker compose -f $(COMPOSE_FILE) build
	@echo "$(GREEN)✓ Quick build completed$(NC)"

# Service management
.PHONY: up
up: check-env ## Start all services in detached mode
	@echo "$(BLUE)Starting EP Chat services...$(NC)"
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo "$(YELLOW)Application available at: http://localhost:3000$(NC)"
	@make status

.PHONY: down
down: ## Stop and remove all containers
	@echo "$(BLUE)Stopping EP Chat services...$(NC)"
	docker compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)✓ Services stopped$(NC)"

.PHONY: restart
restart: ## Restart all services
	@echo "$(BLUE)Restarting EP Chat services...$(NC)"
	docker compose -f $(COMPOSE_FILE) restart
	@echo "$(GREEN)✓ Services restarted$(NC)"
	@make status

.PHONY: stop
stop: ## Stop all services without removing containers
	@echo "$(BLUE)Stopping EP Chat services...$(NC)"
	docker compose -f $(COMPOSE_FILE) stop
	@echo "$(GREEN)✓ Services stopped$(NC)"

.PHONY: start
start: ## Start existing containers
	@echo "$(BLUE)Starting EP Chat services...$(NC)"
	docker compose -f $(COMPOSE_FILE) start
	@echo "$(GREEN)✓ Services started$(NC)"
	@make status

# Monitoring and debugging
.PHONY: status
status: ## Show service status
	@echo "$(BLUE)Service Status:$(NC)"
	@docker compose -f $(COMPOSE_FILE) ps

.PHONY: logs
logs: ## View logs from all services
	@echo "$(BLUE)Viewing logs (Press Ctrl+C to exit)...$(NC)"
	docker compose -f $(COMPOSE_FILE) logs -f

.PHONY: logs-app
logs-app: ## View application logs only
	@echo "$(BLUE)Viewing application logs (Press Ctrl+C to exit)...$(NC)"
	docker compose -f $(COMPOSE_FILE) logs -f ep-app

.PHONY: logs-redis
logs-redis: ## View Redis logs only
	@echo "$(BLUE)Viewing Redis logs (Press Ctrl+C to exit)...$(NC)"
	docker compose -f $(COMPOSE_FILE) logs -f redis

.PHONY: health
health: ## Check application health
	@echo "$(BLUE)Checking application health...$(NC)"
	@if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then \
		echo "$(GREEN)✓ Application is healthy$(NC)"; \
	else \
		echo "$(RED)✗ Application health check failed$(NC)"; \
		echo "$(YELLOW)Check logs with: make logs-app$(NC)"; \
	fi

# Development and debugging
.PHONY: shell
shell: ## Open shell in application container
	@echo "$(BLUE)Opening shell in application container...$(NC)"
	docker compose -f $(COMPOSE_FILE) exec ep-app sh

.PHONY: shell-redis
shell-redis: ## Open Redis CLI
	@echo "$(BLUE)Opening Redis CLI...$(NC)"
	docker compose -f $(COMPOSE_FILE) exec redis redis-cli

.PHONY: stats
stats: ## Show container resource usage
	@echo "$(BLUE)Container Resource Usage:$(NC)"
	docker stats --no-stream $$(docker compose -f $(COMPOSE_FILE) ps -q)

# Maintenance and cleanup
.PHONY: clean
clean: ## Clean up unused Docker resources
	@echo "$(BLUE)Cleaning up Docker resources...$(NC)"
	@echo "$(YELLOW)Removing unused containers...$(NC)"
	docker container prune -f
	@echo "$(YELLOW)Removing unused images...$(NC)"
	docker image prune -f
	@echo "$(YELLOW)Removing unused networks...$(NC)"
	docker network prune -f
	@echo "$(YELLOW)Removing unused volumes...$(NC)"
	docker volume prune -f
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

.PHONY: clean-all
clean-all: down ## Stop services and clean all Docker resources
	@echo "$(BLUE)Performing complete cleanup...$(NC)"
	@echo "$(YELLOW)Removing project containers and volumes...$(NC)"
	docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans
	@make clean
	@echo "$(GREEN)✓ Complete cleanup finished$(NC)"

.PHONY: reset
reset: clean-all build up ## Complete reset: clean, build, and start
	@echo "$(GREEN)✓ EP Chat has been reset and restarted$(NC)"

# Backup and restore
.PHONY: backup
backup: ## Backup configuration and data
	@echo "$(BLUE)Creating backup...$(NC)"
	@mkdir -p backups
	@BACKUP_FILE="backups/ep-chat-backup-$$(date +%Y%m%d-%H%M%S).tar.gz"; \
	tar -czf "$$BACKUP_FILE" .env docker-compose.yml Dockerfile; \
	echo "$(GREEN)✓ Backup created: $$BACKUP_FILE$(NC)"

# Update and deployment
.PHONY: update
update: ## Update from Git and rebuild
	@echo "$(BLUE)Updating EP Chat...$(NC)"
	@echo "$(YELLOW)Creating backup before update...$(NC)"
	@make backup
	@echo "$(YELLOW)Pulling latest changes...$(NC)"
	git pull origin main
	@echo "$(YELLOW)Rebuilding and restarting...$(NC)"
	@make build
	@make restart
	@echo "$(GREEN)✓ Update completed$(NC)"

.PHONY: deploy
deploy: check-env build up ## Full deployment: check, build, and start
	@echo "$(GREEN)✓ EP Chat deployed successfully$(NC)"
	@echo "$(YELLOW)Application available at: http://localhost:3000$(NC)"

# Testing and validation
.PHONY: test
test: ## Run basic functionality tests
	@echo "$(BLUE)Running basic tests...$(NC)"
	@echo "$(YELLOW)Testing application health...$(NC)"
	@make health
	@echo "$(YELLOW)Testing API endpoint...$(NC)"
	@if curl -f -s -X GET http://localhost:3000/api/health > /dev/null 2>&1; then \
		echo "$(GREEN)✓ API endpoint is responding$(NC)"; \
	else \
		echo "$(RED)✗ API endpoint test failed$(NC)"; \
	fi
	@echo "$(GREEN)✓ Basic tests completed$(NC)"

# Production targets
.PHONY: prod-deploy
prod-deploy: ## Deploy for production (with additional checks)
	@echo "$(BLUE)Production deployment...$(NC)"
	@if [ "$$NODE_ENV" != "production" ]; then \
		echo "$(RED)Warning: NODE_ENV is not set to production$(NC)"; \
		read -p "Continue anyway? (y/N): " confirm; \
		if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
			echo "$(YELLOW)Deployment cancelled$(NC)"; \
			exit 1; \
		fi; \
	fi
	@make deploy
	@echo "$(GREEN)✓ Production deployment completed$(NC)"

# Information targets
.PHONY: info
info: ## Show system information
	@echo "$(BLUE)EP Chat System Information$(NC)"
	@echo "$(BLUE)=========================$(NC)"
	@echo "Docker version: $$(docker --version)"
	@echo "Docker Compose version: $$(docker compose version)"
	@echo "Project name: $(PROJECT_NAME)"
	@echo "Compose file: $(COMPOSE_FILE)"
	@echo "Current directory: $$(pwd)"
	@echo "Git branch: $$(git branch --show-current 2>/dev/null || echo 'Not a git repository')"
	@echo "Git commit: $$(git rev-parse --short HEAD 2>/dev/null || echo 'Not a git repository')"

.PHONY: ports
ports: ## Show port usage
	@echo "$(BLUE)Port Usage:$(NC)"
	@echo "Application: http://localhost:3000"
	@echo "Redis: localhost:6379 (internal)"
	@echo ""
	@echo "$(BLUE)Active ports:$(NC)"
	@netstat -tulpn 2>/dev/null | grep -E ':(3000|6379)' || echo "No EP Chat ports currently in use"

# Quick shortcuts
.PHONY: dev
dev: build up logs ## Development workflow: build, start, and show logs

.PHONY: quick
quick: up ## Quick start (assumes images are built)

# Validation targets
.PHONY: validate
validate: ## Validate Docker configuration
	@echo "$(BLUE)Validating Docker configuration...$(NC)"
	@docker compose -f $(COMPOSE_FILE) config > /dev/null
	@echo "$(GREEN)✓ Docker Compose configuration is valid$(NC)"

# ============================================
# Project Recovery from VPS
# ============================================

# VPS Configuration (modify these values)
VPS_HOST = root@204.44.70.207
SSH_PORT = 22
CONTAINER_NAME = ep-enhanced-prompt
REMOTE_DIR = /app
LOCAL_RECOVER_DIR = ./_recovered_project
VPS_TEMP_DIR = /root/project_recover

.PHONY: recover-check
recover-check: ## Check VPS connection and container status
	@echo "$(BLUE)[1/6] Checking VPS connection...$(NC)"
	@ssh -p $(SSH_PORT) $(VPS_HOST) "echo '$(GREEN)✓ Connected to VPS$(NC)'" || (echo "$(RED)✗ VPS unreachable$(NC)"; exit 1)
	@echo "$(BLUE)Checking Docker containers on VPS...$(NC)"
	@ssh -p $(SSH_PORT) $(VPS_HOST) "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

.PHONY: recover-pull
recover-pull: ## Extract project from Docker container on VPS
	@echo "$(BLUE)[2/6] Extracting project from Docker container...$(NC)"
	@ssh -p $(SSH_PORT) $(VPS_HOST) "\
		rm -rf $(VPS_TEMP_DIR) && \
		docker cp $(CONTAINER_NAME):$(REMOTE_DIR) $(VPS_TEMP_DIR) || \
		(echo '$(RED)✗ docker cp failed. Check container name and path.$(NC)'; exit 1)"
	@echo "$(GREEN)✓ Project extracted to VPS temp directory$(NC)"

.PHONY: recover-package
recover-package: ## Package recovered folder on VPS
	@echo "$(BLUE)[3/6] Packaging recovered folder...$(NC)"
	@ssh -p $(SSH_PORT) $(VPS_HOST) "\
		cd /root && \
		tar -czf project_recover.tar.gz project_recover && \
		ls -lh project_recover.tar.gz"
	@echo "$(GREEN)✓ Package created$(NC)"

.PHONY: recover-download
recover-download: ## Download project from VPS to local
	@echo "$(BLUE)[4/6] Downloading project to local machine...$(NC)"
	@rm -f ./project_recover.tar.gz
	@scp -P $(SSH_PORT) $(VPS_HOST):/root/project_recover.tar.gz ./project_recover.tar.gz
	@echo "$(GREEN)✓ Downloaded to local: $$(ls -lh project_recover.tar.gz | awk '{print $$5}')$(NC)"

.PHONY: recover-backup
recover-backup: ## Backup current local project before recovery
	@echo "$(BLUE)[5/6] Creating backup of current local project...$(NC)"
	@mkdir -p backups
	@BACKUP_FILE="backups/pre-recovery-backup-$$(date +%Y%m%d-%H%M%S).tar.gz"; \
	tar --exclude='node_modules' --exclude='.git' --exclude='backups' --exclude='_recovered_project' \
		-czf "$$BACKUP_FILE" . && \
	echo "$(GREEN)✓ Backup created: $$BACKUP_FILE$(NC)"

.PHONY: recover-restore
recover-restore: ## Extract and restore project files
	@echo "$(BLUE)[6/6] Extracting & restoring project files...$(NC)"
	@echo "$(YELLOW)⚠️  This will overwrite local files!$(NC)"
	@rm -rf $(LOCAL_RECOVER_DIR)
	@mkdir -p $(LOCAL_RECOVER_DIR)
	@tar -xzf project_recover.tar.gz -C $(LOCAL_RECOVER_DIR)
	@echo "$(YELLOW)Copying files to current directory...$(NC)"
	@cp -r $(LOCAL_RECOVER_DIR)/project_recover/* ./ || (echo '$(RED)✗ Failed to restore files$(NC)'; exit 1)
	@echo "$(GREEN)✓ Project restored successfully!$(NC)"
	@echo "$(YELLOW)Cleaning up temporary files...$(NC)"
	@rm -f project_recover.tar.gz
	@rm -rf $(LOCAL_RECOVER_DIR)
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

.PHONY: recover
recover: recover-check recover-backup recover-pull recover-package recover-download recover-restore ## Full recovery: backup, pull from VPS, and restore
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)✓ Project recovery completed!$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(YELLOW)Your local project has been restored to the VPS deployment version.$(NC)"
	@echo "$(YELLOW)Previous version backed up in: backups/$(NC)"

.PHONY: recover-info
recover-info: ## Show recovery configuration
	@echo "$(BLUE)Project Recovery Configuration$(NC)"
	@echo "$(BLUE)=============================$(NC)"
	@echo "VPS Host: $(VPS_HOST)"
	@echo "SSH Port: $(SSH_PORT)"
	@echo "Container Name: $(CONTAINER_NAME)"
	@echo "Remote Directory: $(REMOTE_DIR)"
	@echo "Local Recovery Directory: $(LOCAL_RECOVER_DIR)"
	@echo ""
	@echo "$(GREEN)Usage:$(NC)"
	@echo "  make recover-check    # Check VPS connection and containers"
	@echo "  make recover          # Full recovery process"
	@echo "  make recover-info     # Show this information"
