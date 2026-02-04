# Deployment Guide

This directory contains all deployment configurations and scripts for CareDroid-AI.

## Directory Structure

```
deployment/
├── docker/             # Docker and containerization
│   ├── docker-compose.yml        # Multi-service orchestration
│   ├── Dockerfile.android        # Android build container
│   └── docker-android-emulator.sh # Android emulator in Docker
└── android/           # Android deployment
    ├── build-android-apk.sh           # Main APK build script
    ├── build-android.ps1              # Windows build script
    ├── setup-android-sdk.sh           # SDK setup
    ├── install-android-sdk-simple.sh  # Simplified SDK install
    ├── cleanup-hybrid-files.sh        # Clean build artifacts
    └── package.android.json           # Android-specific deps
```

## Docker Deployment

### Quick Start

```bash
cd deployment/docker
docker-compose up -d
```

### Services

The docker-compose setup includes:
- **Backend** - NestJS API server
- **PostgreSQL** - Primary database
- **Redis** - Cache and session store
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards
- **Logstash** - Log aggregation
- **Kibana** - Log visualization

### Configuration

Environment variables can be set in `.env` or passed directly:

```bash
POSTGRES_PASSWORD=secure_password \
REDIS_PASSWORD=redis_password \
docker-compose up -d
```

### Scaling

Scale specific services:
```bash
docker-compose up -d --scale backend=3
```

## Android Deployment

### Prerequisites

1. **Java Development Kit (JDK) 17**
2. **Android SDK** (installed via script)
3. **Gradle** (included in project)

### Setup Android SDK

```bash
cd deployment/android
./setup-android-sdk.sh
```

Or for a simpler installation:
```bash
./install-android-sdk-simple.sh
```

### Build APK

**Debug Build:**
```bash
./build-android-apk.sh debug
```

**Release Build:**
```bash
./build-android-apk.sh release
```

**Windows (PowerShell):**
```powershell
.\build-android.ps1 -BuildType Debug
.\build-android.ps1 -BuildType Release
```

### Signing Configuration

For release builds, configure signing in `android/gradle.properties`:

```properties
CAREDROID_RELEASE_STORE_FILE=/path/to/keystore.jks
CAREDROID_RELEASE_KEY_ALIAS=caredroid
CAREDROID_RELEASE_STORE_PASSWORD=***
CAREDROID_RELEASE_KEY_PASSWORD=***
```

Or use GitHub Secrets for CI/CD builds.

### Clean Build

Remove all build artifacts:
```bash
./cleanup-hybrid-files.sh
```

## Production Deployment

### Backend Deployment

1. **Build Docker image:**
   ```bash
   cd backend
   docker build -t caredroid-backend:latest .
   ```

2. **Push to registry:**
   ```bash
   docker tag caredroid-backend:latest yourdockerhub/caredroid-backend:latest
   docker push yourdockerhub/caredroid-backend:latest
   ```

3. **Deploy to server:**
   ```bash
   ssh production-server
   cd /opt/caredroid
   docker-compose -f deployment/docker/docker-compose.yml pull
   docker-compose -f deployment/docker/docker-compose.yml up -d
   ```

### Frontend Deployment

Frontend is served via CDN or static hosting:

1. **Build production assets:**
   ```bash
   npm run build
   ```

2. **Deploy to CDN/S3:**
   ```bash
   aws s3 sync dist/ s3://caredroid-frontend/
   aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
   ```

### Database Migration

Run migrations on production:

```bash
cd backend
npm run migration:run
```

## Monitoring

### Prometheus Metrics

Access at: `http://your-server:9090`

Key metrics:
- API response times
- Database query performance
- System resource usage
- Custom business metrics

### Grafana Dashboards

Access at: `http://your-server:3001`

Default credentials: `admin/admin` (change immediately)

Import pre-built dashboards from `config/grafana/dashboards/`

### Logs

View logs with Kibana: `http://your-server:5601`

Or via command line:
```bash
docker-compose logs -f backend
docker-compose logs -f postgres
```

## Health Checks

### Backend Health
```bash
curl http://your-server:3000/health
```

### Database Connection
```bash
curl http://your-server:3000/health/db
```

### Full System Status
```bash
curl http://your-server:3000/health/detailed
```

## Rollback Procedures

### Rollback Backend
```bash
docker-compose down backend
docker tag caredroid-backend:previous caredroid-backend:latest
docker-compose up -d backend
```

### Rollback Database Migration
```bash
cd backend
npm run migration:revert
```

## Security Considerations

1. **Never commit secrets** - Use environment variables
2. **Use strong passwords** - For all services
3. **Enable TLS** - For all public endpoints
4. **Regular updates** - Keep dependencies current
5. **Backup regularly** - Automated database backups
6. **Monitor logs** - Set up alerts for suspicious activity

## Backup and Restore

### Database Backup
```bash
docker-compose exec postgres pg_dump -U postgres caredroid > backup.sql
```

### Database Restore
```bash
docker-compose exec -T postgres psql -U postgres caredroid < backup.sql
```

### Full System Backup
```bash
./scripts/backup-system.sh
```

## CI/CD Integration

Automated deployments via GitHub Actions:
- `.github/workflows/ci-cd.yml` - Main deployment pipeline
- `.github/workflows/android-build.yml` - Android builds
- `.github/workflows/release.yml` - Release automation

## Troubleshooting

### Docker Issues
```bash
# Reset everything
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Android Build Issues
```bash
# Clean Gradle cache
cd android
./gradlew clean
./gradlew build --refresh-dependencies
```

### Port Conflicts
Check what's using ports:
```bash
lsof -i :3000  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

## Support

For deployment issues:
1. Check logs first: `docker-compose logs`
2. Verify environment variables
3. Check disk space: `df -h`
4. Review documentation in this directory
5. Contact DevOps team

---

Last updated: February 2026
