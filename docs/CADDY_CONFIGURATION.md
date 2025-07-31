# Caddy Configuration for EP Chat

## 🌐 Production Reverse Proxy Setup

This guide provides comprehensive Caddy configuration for production deployment of EP Chat with automatic SSL, security headers, rate limiting, and performance optimization.

## 📋 Prerequisites

- Caddy 2.0+ installed
- Domain name configured
- EP Chat running on `localhost:3000`

## 🔧 Basic Configuration

### `/etc/caddy/Caddyfile`

```caddy
# EP Chat Caddy Configuration
# File: /etc/caddy/Caddyfile

# Global options
{
    # Email for Let's Encrypt
    email admin@yourdomain.com
    
    # Enable admin API
    admin localhost:2019
    
    # Log configuration
    log {
        output file /var/log/caddy/access.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
        format json
        level INFO
    }
}

# Main site configuration
yourdomain.com, www.yourdomain.com {
    # Automatic HTTPS with Let's Encrypt
    tls {
        protocols tls1.2 tls1.3
    }
    
    # Security headers
    header {
        # HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        
        # Content security
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        
        # CSP for EP Chat
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.deepseek.com; frame-ancestors 'none';"
        
        # Permissions policy
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
        
        # Remove server header
        -Server
    }
    
    # Gzip compression
    encode {
        gzip 6
        minimum_length 1024
    }
    
    # Rate limiting for API endpoints
    @api path /api/*
    rate_limit @api {
        zone api
        key {remote_host}
        events 10
        window 1s
    }
    
    # General rate limiting
    rate_limit {
        zone general
        key {remote_host}
        events 30
        window 1s
    }
    
    # API routes with specific handling
    handle /api/* {
        # Additional headers for API
        header {
            Cache-Control "no-cache, no-store, must-revalidate"
            Pragma "no-cache"
            Expires "0"
        }
        
        # Reverse proxy to EP Chat
        reverse_proxy localhost:3000 {
            # Health check
            health_uri /api/health
            health_interval 30s
            health_timeout 5s
            
            # Headers
            header_up Host {upstream_hostport}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-Host {host}
            header_up X-Forwarded-Port {port}
        }
    }
    
    # Static assets with caching
    @static path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2 *.ttf *.eot
    handle @static {
        # Cache headers for static assets
        header {
            Cache-Control "public, max-age=31536000, immutable"
            Vary "Accept-Encoding"
        }
        
        # Reverse proxy to EP Chat
        reverse_proxy localhost:3000 {
            header_up Host {upstream_hostport}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }
    
    # Health check endpoint (no rate limiting)
    handle /health {
        reverse_proxy localhost:3000 {
            header_up Host {upstream_hostport}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }
    
    # Main application
    handle {
        # Reverse proxy to EP Chat
        reverse_proxy localhost:3000 {
            # WebSocket support
            header_up Connection {>Connection}
            header_up Upgrade {>Upgrade}
            
            # Standard headers
            header_up Host {upstream_hostport}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-Host {host}
            header_up X-Forwarded-Port {port}
            
            # Health check
            health_uri /api/health
            health_interval 30s
            health_timeout 5s
            
            # Timeouts
            dial_timeout 5s
            read_timeout 60s
            write_timeout 60s
        }
    }
    
    # Security: Block sensitive files
    @sensitive path /.* *.env *.log *.config
    handle @sensitive {
        respond "Access denied" 403
    }
    
    # Logging
    log {
        output file /var/log/caddy/ep-chat.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
        format json
        level INFO
    }
}

# HTTP to HTTPS redirect (handled automatically by Caddy)
# Caddy automatically redirects HTTP to HTTPS when TLS is enabled
```

## 🔧 Advanced Configuration

### Load Balancing Setup

```caddy
# Load balancing configuration for multiple EP Chat instances
yourdomain.com {
    # Multiple upstream servers
    reverse_proxy {
        to localhost:3000
        to localhost:3001
        to localhost:3002
        
        # Load balancing policy
        lb_policy round_robin
        
        # Health checks
        health_uri /api/health
        health_interval 30s
        health_timeout 5s
        health_status 200
        
        # Failover settings
        fail_duration 30s
        max_fails 3
        unhealthy_status 5xx
        unhealthy_latency 10s
    }
}
```

### Development Configuration

```caddy
# Development configuration with hot reload
localhost:3000 {
    # Disable TLS for local development
    tls off
    
    # CORS headers for development
    header {
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }
    
    # Handle preflight requests
    @options method OPTIONS
    handle @options {
        respond 200
    }
    
    # Proxy to development server
    reverse_proxy localhost:3001 {
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

## 🚀 Deployment Commands

```bash
# Install Caddy (Ubuntu/Debian)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Validate configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Start Caddy
sudo systemctl start caddy
sudo systemctl enable caddy

# Reload configuration
sudo systemctl reload caddy

# Check status
sudo systemctl status caddy

# View logs
sudo journalctl -u caddy -f

# Test configuration
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
```

## 📊 Monitoring and Logging

### Log Analysis

```bash
# View access logs
sudo tail -f /var/log/caddy/ep-chat.log

# View system logs
sudo journalctl -u caddy -f

# Check certificate status
curl -I https://yourdomain.com

# Monitor SSL certificate expiry
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Health Monitoring

```bash
# Check upstream health
curl -s http://localhost:2019/config/apps/http/servers/srv0/routes/0/handle/0/upstreams/0/health

# API endpoint for monitoring
curl -s https://yourdomain.com/health

# Performance testing
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/
```

## 🔒 Security Best Practices

### Firewall Configuration

```bash
# UFW firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check firewall status
sudo ufw status verbose
```

### SSL Security Testing

```bash
# Test SSL configuration
curl -I https://yourdomain.com

# Check SSL rating (external tool)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

## 🔧 Troubleshooting

### Common Issues

1. **Certificate Issues**
   ```bash
   # Check certificate status
   sudo caddy list-certificates
   
   # Force certificate renewal
   sudo systemctl stop caddy
   sudo caddy run --config /etc/caddy/Caddyfile
   ```

2. **Configuration Errors**
   ```bash
   # Validate configuration
   sudo caddy validate --config /etc/caddy/Caddyfile
   
   # Test configuration
   sudo caddy fmt --overwrite /etc/caddy/Caddyfile
   ```

3. **Connection Issues**
   ```bash
   # Check if EP Chat is running
   curl http://localhost:3000/health
   
   # Check Caddy status
   sudo systemctl status caddy
   
   # View detailed logs
   sudo journalctl -u caddy --no-pager -l
   ```
