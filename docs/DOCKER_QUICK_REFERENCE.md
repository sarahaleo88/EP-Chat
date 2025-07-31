# EP Chat Docker Quick Reference

## 🚀 Quick Commands

### Start Application
```bash
docker compose up -d
```

### Check Status
```bash
docker compose ps
curl -I http://localhost:3000
```

### View Logs
```bash
docker compose logs -f ep-app
```

### Stop Application
```bash
docker compose down
```

## 🔧 Development Commands

### Rebuild from Scratch
```bash
docker compose build --no-cache
docker compose up -d
```

### Debug Container
```bash
docker exec -it ep-enhanced-prompt sh
```

### Clean Up
```bash
docker compose down --volumes
docker image prune -f
```

## 📊 Monitoring

### Health Check
```bash
# Quick health check
curl -f http://localhost:3000/api/generate

# Container health status
docker inspect ep-enhanced-prompt --format='{{.State.Health.Status}}'
```

### Resource Usage
```bash
docker stats ep-enhanced-prompt
```

## 🐛 Troubleshooting

### Build Fails
```bash
# Check build logs
docker compose build

# Common fix: Clean rebuild
docker compose build --no-cache
```

### App Won't Start
```bash
# Check container logs
docker compose logs ep-app

# Check port conflicts
netstat -tulpn | grep :3000
```

### Module Resolution Errors
- **Issue**: TypeScript compilation fails during build
- **Fix**: Ensure Dockerfile installs all dependencies (not just production) during build stage
- **Reference**: See [DOCKER_DEPLOYMENT_TROUBLESHOOTING.md](./DOCKER_DEPLOYMENT_TROUBLESHOOTING.md)

## 📁 Key Files

- `Dockerfile` - Multi-stage build configuration
- `docker-compose.prod.yml` - Production deployment
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration with standalone output

## 🎯 Success Indicators

- ✅ Build completes without errors (~5 minutes)
- ✅ Container shows "healthy" status
- ✅ HTTP 200 response from `http://localhost:3000`
- ✅ Next.js logs show "Ready in XXXms"
- ✅ Final image size ~703MB

## 🔒 Security Notes

- Application runs as non-root user (`nextjs:nodejs`)
- Health checks enabled for monitoring
- Production environment variables set
- Minimal attack surface (only necessary files in final image)

---

**Need Help?** Check the full troubleshooting guide: [DOCKER_DEPLOYMENT_TROUBLESHOOTING.md](./DOCKER_DEPLOYMENT_TROUBLESHOOTING.md)
