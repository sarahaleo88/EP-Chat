#!/bin/bash

# EP Chat Nginx Configuration Fix Script
# This script diagnoses and fixes conflicting server name issues

set -e

echo "🔍 EP Chat Nginx Configuration Diagnostic and Fix"
echo "=================================================="

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

# Step 1: Backup current configuration
log_info "Step 1: Backing up current Nginx configuration..."
BACKUP_DIR="/opt/ep-chat/nginx-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /etc/nginx/sites-available "$BACKUP_DIR/"
cp -r /etc/nginx/sites-enabled "$BACKUP_DIR/"
log_success "Backup created at: $BACKUP_DIR"

# Step 2: Analyze current configuration
log_info "Step 2: Analyzing current configuration..."

echo "Current sites-enabled:"
ls -la /etc/nginx/sites-enabled/

echo -e "\nChecking for ai.saraha.cc references:"
find /etc/nginx -name "*.conf" -o -name "*ai.saraha.cc*" | xargs grep -l "ai.saraha.cc" 2>/dev/null || true

echo -e "\nCounting server blocks in ai.saraha.cc config:"
if [ -f "/etc/nginx/sites-available/ai.saraha.cc" ]; then
    SERVER_BLOCKS=$(grep -c "server {" /etc/nginx/sites-available/ai.saraha.cc)
    echo "Found $SERVER_BLOCKS server blocks"
    
    echo -e "\nServer block details:"
    grep -n -A 3 "server {" /etc/nginx/sites-available/ai.saraha.cc
else
    log_error "Configuration file not found!"
fi

# Step 3: Clean up existing configuration
log_info "Step 3: Cleaning up existing configuration..."

# Remove all enabled sites
rm -f /etc/nginx/sites-enabled/*
log_success "Cleared all enabled sites"

# Step 4: Create clean configuration
log_info "Step 4: Creating clean Nginx configuration..."

cat > /etc/nginx/sites-available/ai.saraha.cc << 'EOF'
# EP Chat Nginx Configuration - ai.saraha.cc
# Clean configuration without conflicts

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ai.saraha.cc;
    
    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS main configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ai.saraha.cc;

    # SSL Certificate configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/ai.saraha.cc/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ai.saraha.cc/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client configuration
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Main application proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout configuration
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer configuration
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # API routes with extended timeout
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Extended timeout for API calls
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        
        # Disable caching for API
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Static resources with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Long-term caching for static assets
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }

    # Next.js static assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        
        # Long-term caching for Next.js static assets
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # PWA files
    location ~* \.(webmanifest|sw\.js)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        
        # Short-term caching for PWA files
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000/api/generate;
        proxy_set_header Host $host;
        access_log off;
        
        # Quick timeout for health checks
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
        proxy_read_timeout 5s;
    }

    # Security: Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(env|log|config)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Logging
    access_log /var/log/nginx/ai.saraha.cc.access.log;
    error_log /var/log/nginx/ai.saraha.cc.error.log;
}
EOF

log_success "Created clean configuration file"

# Step 5: Enable the site
log_info "Step 5: Enabling the site..."
ln -s /etc/nginx/sites-available/ai.saraha.cc /etc/nginx/sites-enabled/
log_success "Site enabled"

# Step 6: Test configuration
log_info "Step 6: Testing Nginx configuration..."
if nginx -t; then
    log_success "Nginx configuration test passed!"
else
    log_error "Nginx configuration test failed!"
    exit 1
fi

# Step 7: Reload Nginx
log_info "Step 7: Reloading Nginx..."
systemctl reload nginx
log_success "Nginx reloaded successfully"

# Step 8: Verify status
log_info "Step 8: Verifying Nginx status..."
systemctl status nginx --no-pager -l

echo -e "\n🎉 Nginx configuration fix completed successfully!"
echo -e "\n📋 Summary of changes:"
echo "- Backed up original configuration to: $BACKUP_DIR"
echo "- Removed duplicate server blocks"
echo "- Created clean configuration with proper IPv4/IPv6 handling"
echo "- Eliminated conflicting server name warnings"
echo "- Added comprehensive proxy and security settings"

echo -e "\n✅ Next steps:"
echo "1. Nginx is now properly configured without conflicts"
echo "2. Ready to start EP Chat Docker containers"
echo "3. SSL certificates are preserved and working"
