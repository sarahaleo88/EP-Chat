# Reverse Proxy Troubleshooting Guide

## 🔍 Common Issues and Solutions

This guide covers troubleshooting for both Nginx and Caddy reverse proxy configurations with EP Chat.

## 🚨 SSL/TLS Issues

### Certificate Problems

**Issue**: SSL certificate not working or expired

**Nginx Solutions:**
```bash
# Check certificate status
sudo openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew --nginx

# Test certificate renewal
sudo certbot renew --dry-run

# Check certificate expiry
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Caddy Solutions:**
```bash
# Check certificate status
sudo caddy list-certificates

# Force certificate renewal
sudo systemctl stop caddy
sudo caddy run --config /etc/caddy/Caddyfile

# View certificate logs
sudo journalctl -u caddy | grep -i certificate
```

### Mixed Content Warnings

**Issue**: HTTP content loaded over HTTPS

**Solution**: Update Content Security Policy
```nginx
# Nginx: Update CSP header
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:;" always;
```

```caddy
# Caddy: Update CSP header
header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:;"
```

## 🌐 Connection Issues

### 502 Bad Gateway

**Symptoms**: Nginx/Caddy returns 502 error

**Diagnosis Commands:**
```bash
# Check if EP Chat is running
curl http://localhost:3000/health
docker compose ps
docker compose logs ep-app

# Check port availability
netstat -tulpn | grep :3000
ss -tulpn | grep :3000

# Test direct connection
curl -I http://localhost:3000
```

**Solutions:**
1. **EP Chat not running**
   ```bash
   # Start EP Chat
   docker compose up -d
   
   # Check logs
   docker compose logs -f ep-app
   ```

2. **Wrong upstream configuration**
   ```nginx
   # Nginx: Check upstream block
   upstream ep_chat_backend {
       server 127.0.0.1:3000;  # Ensure correct IP and port
   }
   ```

3. **Firewall blocking connection**
   ```bash
   # Check firewall rules
   sudo ufw status
   sudo iptables -L
   
   # Allow local connections
   sudo ufw allow from 127.0.0.1 to any port 3000
   ```

### 504 Gateway Timeout

**Symptoms**: Requests timeout after 60 seconds

**Solutions:**
```nginx
# Nginx: Increase timeout values
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

```caddy
# Caddy: Increase timeout values
reverse_proxy localhost:3000 {
    dial_timeout 30s
    read_timeout 300s
    write_timeout 300s
}
```

## 🔒 Security Header Issues

### CORS Errors

**Issue**: Cross-origin requests blocked

**Nginx Solution:**
```nginx
# Add CORS headers
location /api/ {
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    
    proxy_pass http://ep_chat_backend;
}
```

**Caddy Solution:**
```caddy
# Handle CORS
@options method OPTIONS
handle @options {
    header {
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
        Access-Control-Max-Age "86400"
    }
    respond 204
}

handle /api/* {
    header {
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }
    reverse_proxy localhost:3000
}
```

### CSP Violations

**Issue**: Content Security Policy blocking resources

**Diagnosis:**
```bash
# Check browser console for CSP violations
# Look for messages like: "Refused to load script because it violates CSP"
```

**Solution**: Update CSP header
```nginx
# Nginx: More permissive CSP for development
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.deepseek.com;" always;
```

## 📊 Performance Issues

### Slow Response Times

**Diagnosis Commands:**
```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/

# Create curl-format.txt
cat > curl-format.txt << EOF
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF

# Monitor backend response
curl -w "Backend response time: %{time_total}s\n" -o /dev/null -s http://localhost:3000/
```

**Solutions:**
1. **Enable compression**
   ```nginx
   # Nginx: Enable gzip
   gzip on;
   gzip_comp_level 6;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **Optimize buffer sizes**
   ```nginx
   # Nginx: Optimize buffers
   proxy_buffering on;
   proxy_buffer_size 128k;
   proxy_buffers 4 256k;
   proxy_busy_buffers_size 256k;
   ```

3. **Enable caching**
   ```nginx
   # Nginx: Cache static assets
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
       proxy_pass http://ep_chat_backend;
   }
   ```

### Rate Limiting Issues

**Issue**: Legitimate requests being blocked

**Diagnosis:**
```bash
# Check rate limit logs
sudo grep "limiting requests" /var/log/nginx/error.log
sudo journalctl -u caddy | grep -i "rate limit"
```

**Solutions:**
```nginx
# Nginx: Adjust rate limits
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;  # Increase rate
limit_req zone=api burst=100 nodelay;  # Increase burst
```

```caddy
# Caddy: Adjust rate limits
rate_limit @api {
    zone api
    key {remote_host}
    events 20  # Increase events
    window 1s
}
```

## 🔧 Configuration Issues

### Nginx Configuration Errors

**Test configuration:**
```bash
# Test Nginx configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Check syntax with detailed output
sudo nginx -T
```

**Common errors:**
1. **Duplicate server blocks**
   ```bash
   # Error: conflicting server name
   # Solution: Ensure unique server_name directives
   ```

2. **Missing semicolons**
   ```bash
   # Error: unexpected "}" in /etc/nginx/sites-available/ep-chat:45
   # Solution: Add missing semicolons to directives
   ```

### Caddy Configuration Errors

**Test configuration:**
```bash
# Validate Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Format configuration
sudo caddy fmt --overwrite /etc/caddy/Caddyfile

# Test run configuration
sudo caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
```

## 📋 Diagnostic Checklist

### Pre-deployment Checklist

- [ ] EP Chat is running on localhost:3000
- [ ] Domain DNS is configured correctly
- [ ] Firewall allows HTTP (80) and HTTPS (443)
- [ ] SSL certificate is valid and not expired
- [ ] Reverse proxy configuration is tested
- [ ] Security headers are properly configured
- [ ] Rate limiting is appropriately set
- [ ] Logging is enabled and working

### Health Check Commands

```bash
# 1. Check EP Chat backend
curl -I http://localhost:3000/health

# 2. Check reverse proxy
curl -I https://yourdomain.com/health

# 3. Check SSL certificate
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# 4. Check security headers
curl -I https://yourdomain.com/ | grep -E "(Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options)"

# 5. Test API endpoint
curl -X POST https://yourdomain.com/api/generate -H "Content-Type: application/json" -d '{"test": true}'

# 6. Check rate limiting
for i in {1..10}; do curl -I https://yourdomain.com/api/generate; done
```

### Log Analysis

```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Caddy logs
sudo journalctl -u caddy -f
sudo tail -f /var/log/caddy/access.log

# EP Chat logs
docker compose logs -f ep-app

# System logs
sudo journalctl -f
```

## 🆘 Emergency Procedures

### Service Recovery

```bash
# Quick service restart
sudo systemctl restart nginx  # or caddy
docker compose restart

# Emergency fallback (direct access)
# Temporarily allow direct access to port 3000
sudo ufw allow 3000/tcp
# Access via: http://yourdomain.com:3000

# Restore from backup configuration
sudo cp /etc/nginx/sites-available/ep-chat.backup /etc/nginx/sites-available/ep-chat
sudo nginx -t && sudo systemctl reload nginx
```

### Contact Information

For additional support:
- Check EP Chat documentation: [docs/README.md](./README.md)
- Review Docker troubleshooting: [DOCKER_DEPLOYMENT_TROUBLESHOOTING.md](./DOCKER_DEPLOYMENT_TROUBLESHOOTING.md)
- Submit issues: [GitHub Issues](https://github.com/sarahaleo88/EP-Chat/issues)
