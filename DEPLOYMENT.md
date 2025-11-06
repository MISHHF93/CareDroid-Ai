# Production Deployment Guide

## Prerequisites

- Docker & Docker Compose installed
- PostgreSQL 14+
- Redis 7+
- Node.js 18+
- SSL certificates
- Domain name configured

## Quick Start

### 1. Environment Setup

```bash
# Copy and configure environment variables
cp backend/.env.production.template backend/.env
nano backend/.env  # Fill in production values
```

### 2. Database Setup

```bash
# Start PostgreSQL
docker-compose -f docker-compose.prod.yml up -d postgres

# Run migrations
cd backend
npm run typeorm migration:run
```

### 3. Build Application

```bash
# Build backend
cd backend
npm ci --only=production
npm run build

# Build frontend
cd ..
npm ci
npm run build
```

### 4. Start Services

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## SSL Configuration

### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d api.caredroid.com -d app.caredroid.com

# Copy certificates
sudo cp /etc/letsencrypt/live/api.caredroid.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/api.caredroid.com/privkey.pem ./nginx/ssl/

# Set up auto-renewal
sudo certbot renew --dry-run
```

## Monitoring Setup

### Sentry (Error Tracking)

1. Create Sentry project at https://sentry.io
2. Copy DSN to `.env`
3. Errors will be automatically reported

### DataDog (Performance Monitoring)

1. Sign up at https://www.datadoghq.com
2. Install DataDog agent
3. Configure API keys in `.env`

## Backup Strategy

### Automated Database Backups

```bash
# Backup script runs daily at 2 AM
# Configure in docker-compose.prod.yml

# Manual backup
docker exec caredroid-postgres pg_dump -U caredroid caredroid_production > backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql s3://caredroid-backups/
```

### Restore from Backup

```bash
# Download from S3
aws s3 cp s3://caredroid-backups/backup_20250101.sql ./

# Restore
docker exec -i caredroid-postgres psql -U caredroid caredroid_production < backup_20250101.sql
```

## Disaster Recovery

### Database Failure

1. Stop backend services
2. Restore database from latest backup
3. Verify data integrity
4. Restart services

### Application Failure

1. Check logs: `docker-compose logs -f backend`
2. Rollback to previous version if needed
3. Restart services: `docker-compose restart backend`

### Complete System Failure

1. Provision new server
2. Install Docker & dependencies
3. Clone repository
4. Restore database from S3
5. Configure `.env` with production values
6. Start services

## Security Hardening

### Firewall Rules

```bash
# Allow SSH, HTTP, HTTPS only
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Database Security

```bash
# Restrict PostgreSQL to localhost
# Edit postgresql.conf
listen_addresses = 'localhost'

# Use strong passwords (32+ characters)
# Rotate credentials quarterly
```

### Application Security

- [ ] Enable HTTPS only
- [ ] Configure CSP headers
- [ ] Enable rate limiting
- [ ] Set up WAF (Cloudflare)
- [ ] Regular security audits
- [ ] Dependency updates weekly

## Health Checks

### Application

```bash
# Backend health
curl https://api.caredroid.com/health

# Database health
docker exec caredroid-postgres pg_isready

# Redis health
docker exec caredroid-redis redis-cli ping
```

### Monitoring Endpoints

- `/health` - Application health
- `/metrics` - Prometheus metrics
- `/api/docs` - Swagger documentation

## Scaling

### Horizontal Scaling

```bash
# Scale backend to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Add load balancer (nginx configuration)
```

### Vertical Scaling

```bash
# Increase resources in docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Verify environment variables
docker exec caredroid-backend env

# Check database connection
docker exec caredroid-backend npm run typeorm -- query "SELECT 1"
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Restart services
docker-compose restart

# Clear Redis cache
docker exec caredroid-redis redis-cli FLUSHALL
```

### Slow Performance

- Check database query performance
- Enable Redis caching
- Optimize database indexes
- Scale horizontally

## Maintenance

### Regular Tasks

- [ ] Weekly: Update dependencies
- [ ] Weekly: Review error logs
- [ ] Monthly: Rotate credentials
- [ ] Monthly: Review audit logs
- [ ] Quarterly: Security audit
- [ ] Quarterly: Performance review

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose -f docker-compose.prod.yml build

# Zero-downtime deployment
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
```

## Support

- Documentation: https://docs.caredroid.com
- Status: https://status.caredroid.com
- Email: support@caredroid.com
