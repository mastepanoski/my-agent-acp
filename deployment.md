# ACP Agent Deployment Guide

This document provides instructions for deploying the ACP Agent using Docker.

## Prerequisites

- Docker and Docker Compose installed
- LM Studio running and accessible
- At least 2GB RAM available
- Node.js 18+ or Bun 1.2+ (for local development)

## Quick Start with Docker

1. **Clone and configure:**
   ```bash
   git clone <repository-url>
   cd acp-agent
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Build and run:**
   ```bash
   docker-compose up -d
   ```

3. **Check health:**
   ```bash
   curl http://localhost:3000/health
   ```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ACP_HOST` | Server host | `localhost` |
| `ACP_PORT` | Server port | `3000` |
| `LM_STUDIO_URL` | LM Studio endpoint | `http://localhost:1234/v1` |
| `LM_STUDIO_MODEL` | Model name | `llama-3.2-3b-instruct` |
| `RUNTIME` | Runtime (node/bun) | `node` |
| `LOG_LEVEL` | Logging level | `info` |

### Runtime Selection

Choose between Node.js and Bun runtimes:

**Node.js (default):**
```bash
docker-compose up -d
```

**Bun runtime:**
```bash
RUNTIME=bun docker-compose up -d
```

## Deployment Profiles

### Basic Deployment
```bash
docker-compose up -d
```

### With LM Studio Proxy
```bash
docker-compose --profile with-proxy up -d
```

### With Monitoring
```bash
docker-compose --profile monitoring up -d
```

### Full Stack (All Services)
```bash
docker-compose --profile with-proxy --profile monitoring up -d
```

## Production Deployment

### 1. Security Considerations

- Use non-root user (already configured in Dockerfile)
- Set up proper firewall rules
- Use HTTPS in production
- Secure your LM Studio endpoint
- Set strong authentication if enabled

### 2. Resource Requirements

**Minimum:**
- 1 CPU core
- 2GB RAM
- 5GB disk space

**Recommended:**
- 2+ CPU cores
- 4GB+ RAM
- 20GB+ disk space

### 3. Scaling

**Horizontal Scaling:**
```bash
docker-compose up -d --scale acp-agent=3
```

**Load Balancer Configuration:**
```nginx
upstream acp_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    location / {
        proxy_pass http://acp_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring and Logging

### Health Checks
```bash
# Container health
docker-compose ps

# Application health
curl http://localhost:3000/health

# Logs
docker-compose logs -f acp-agent
```

### Metrics (with monitoring profile)
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

### Log Management
Logs are stored in `./logs/` and inside containers at `/app/logs/`.

Structured JSON logs in production:
```json
{
  "level": "info",
  "time": "2024-01-01T12:00:00.000Z",
  "msg": "Agent execution completed",
  "component": "agent",
  "runId": "run-123",
  "duration": 1500
}
```

## Troubleshooting

### Common Issues

1. **LM Studio Connection Failed:**
   ```bash
   # Check LM Studio is running
   curl http://localhost:1234/v1/models
   
   # Update LM_STUDIO_URL in .env
   LM_STUDIO_URL=http://host.docker.internal:1234/v1
   ```

2. **Permission Denied:**
   ```bash
   # Fix log directory permissions
   sudo chown -R 1001:1001 logs/
   ```

3. **Port Already in Use:**
   ```bash
   # Change port in .env
   ACP_PORT=3001
   ```

4. **Out of Memory:**
   ```bash
   # Increase Docker memory limit
   # Or reduce LM_STUDIO_TIMEOUT
   LM_STUDIO_TIMEOUT=15000
   ```

### Debug Mode

Run in debug mode:
```bash
LOG_LEVEL=debug docker-compose up
```

### Container Shell Access
```bash
docker-compose exec acp-agent sh
```

## Backup and Recovery

### Backup Configuration
```bash
# Backup configuration and logs
tar -czf acp-backup-$(date +%Y%m%d).tar.gz .env config/ logs/
```

### Restore
```bash
# Restore from backup
tar -xzf acp-backup-YYYYMMDD.tar.gz
docker-compose up -d
```

## Updates and Maintenance

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Migrations
(If using persistent storage)
```bash
docker-compose exec acp-agent bun run migrate
```

## Performance Tuning

### Node.js Optimization
```bash
# Set Node.js memory limit
NODE_OPTIONS="--max-old-space-size=2048"
```

### Bun Optimization
```bash
# Bun is generally faster out of the box
# Monitor memory usage and adjust container limits
```

## Support

For issues and questions:
1. Check the logs: `docker-compose logs acp-agent`
2. Verify configuration: Review `.env` file
3. Test connectivity: `curl http://localhost:3000/health`
4. Check resources: `docker stats`