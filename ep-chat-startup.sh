#!/bin/bash

# EP Chat Docker Startup Script
# Comprehensive startup and validation script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 EP Chat Docker Startup Script"
echo "================================="

# Step 1: Environment validation
log_info "Step 1: Validating environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "Dockerfile" ]; then
    log_error "Not in EP Chat project directory. Please run from /opt/ep-chat"
    exit 1
fi

# Check required files
REQUIRED_FILES=(".env" "docker-compose.prod.yml" "Dockerfile")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "✅ $file exists"
    else
        log_error "❌ $file missing"
        exit 1
    fi
done

# Step 2: Environment variables check
log_info "Step 2: Checking environment variables..."

if grep -q "DEEPSEEK_API_KEY=" .env && ! grep -q "your_deepseek_api_key_here" .env; then
    log_success "✅ DEEPSEEK_API_KEY configured"
else
    log_error "❌ DEEPSEEK_API_KEY not properly configured"
    echo "Please edit .env file and set your DeepSeek API key"
    exit 1
fi

if grep -q "REDIS_PASSWORD=" .env; then
    log_success "✅ REDIS_PASSWORD configured"
else
    log_warning "⚠️  REDIS_PASSWORD not set, using default"
fi

# Step 3: Port availability check
log_info "Step 3: Checking port availability..."

check_port() {
    local port=$1
    if netstat -tlnp | grep -q ":$port "; then
        log_warning "⚠️  Port $port is in use"
        netstat -tlnp | grep ":$port "
        return 1
    else
        log_success "✅ Port $port available"
        return 0
    fi
}

# Check ports (but don't fail if they're used by our containers)
check_port 3000 || true
check_port 6379 || true

# Step 4: Docker environment check
log_info "Step 4: Checking Docker environment..."

if ! docker info > /dev/null 2>&1; then
    log_error "❌ Docker is not running or accessible"
    exit 1
fi
log_success "✅ Docker is running"

# Step 5: Clean up existing containers
log_info "Step 5: Cleaning up existing containers..."

# Stop and remove existing containers
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
log_success "✅ Cleaned up existing containers"

# Step 6: Create necessary directories
log_info "Step 6: Creating necessary directories..."

mkdir -p logs
chmod 755 logs
log_success "✅ Created logs directory"

# Step 7: Build Docker images
log_info "Step 7: Building Docker images..."

log_info "Building EP Chat application image..."
if docker compose -f docker-compose.prod.yml build --no-cache ep-app; then
    log_success "✅ EP Chat application image built successfully"
else
    log_error "❌ Failed to build EP Chat application image"
    exit 1
fi

# Step 8: Start services
log_info "Step 8: Starting services..."

log_info "Starting Redis service..."
if docker compose -f docker-compose.prod.yml up -d redis; then
    log_success "✅ Redis service started"
else
    log_error "❌ Failed to start Redis service"
    exit 1
fi

# Wait for Redis to be ready
log_info "Waiting for Redis to be ready..."
sleep 5

log_info "Starting EP Chat application..."
if docker compose -f docker-compose.prod.yml up -d ep-app; then
    log_success "✅ EP Chat application started"
else
    log_error "❌ Failed to start EP Chat application"
    exit 1
fi

# Step 9: Health checks
log_info "Step 9: Performing health checks..."

# Wait for application to start
log_info "Waiting for application to initialize..."
sleep 10

# Check container status
log_info "Checking container status..."
docker compose -f docker-compose.prod.yml ps

# Check if containers are running
RUNNING_CONTAINERS=$(docker compose -f docker-compose.prod.yml ps --format "table {{.Service}}\t{{.Status}}" | grep -c "Up" || true)
if [ "$RUNNING_CONTAINERS" -eq 2 ]; then
    log_success "✅ All containers are running"
else
    log_error "❌ Not all containers are running properly"
    docker compose -f docker-compose.prod.yml logs
    exit 1
fi

# Test local application response
log_info "Testing local application response..."
for i in {1..30}; do
    if curl -f -s --max-time 5 http://localhost:3000 > /dev/null 2>&1; then
        log_success "✅ Application responding on localhost:3000"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "❌ Application not responding after 30 attempts"
        docker compose -f docker-compose.prod.yml logs ep-app
        exit 1
    fi
    log_info "Waiting for application... (attempt $i/30)"
    sleep 2
done

# Test HTTPS access
log_info "Testing HTTPS access..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://ai.saraha.cc 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    log_success "✅ HTTPS access working (Status: $HTTP_STATUS)"
else
    log_warning "⚠️  HTTPS access issue (Status: $HTTP_STATUS)"
    log_info "This might be normal if DNS hasn't propagated yet"
fi

# Step 10: Display status and next steps
log_info "Step 10: Deployment summary..."

echo -e "\n🎉 EP Chat deployment completed successfully!"
echo -e "\n📊 Container Status:"
docker compose -f docker-compose.prod.yml ps

echo -e "\n🌐 Access Information:"
echo "- Local access: http://localhost:3000"
echo "- Public access: https://ai.saraha.cc"
echo "- Health check: https://ai.saraha.cc/health"

echo -e "\n📋 Useful Commands:"
echo "- View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "- Restart app: docker compose -f docker-compose.prod.yml restart ep-app"
echo "- Stop all: docker compose -f docker-compose.prod.yml down"
echo "- Check status: docker compose -f docker-compose.prod.yml ps"

echo -e "\n✅ Deployment completed successfully!"
echo "Your EP Chat application is now running in production mode."
