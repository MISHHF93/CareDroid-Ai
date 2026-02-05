# Port Consolidation Complete

## Summary
All external ports have been consolidated to **port 8000 only**. All monitoring and infrastructure services now communicate exclusively through the internal Docker network.

## Changes Made

### 1. Docker Compose (`deployment/docker/docker-compose.yml`)
Removed external port mappings for all services except backend:

**Removed External Access:**
- ❌ PostgreSQL: 5432 (now internal only)
- ❌ Redis: 6379 (now internal only)
- ❌ NLU Service: 8000 (conflicted with backend, now internal as `nlu:8000`)
- ❌ Anomaly Detection: 5000 (now internal only)
- ❌ Frontend: 5173 (served by backend in production)
- ❌ Elasticsearch: 9200 (now internal only)
- ❌ Logstash: 5000 (now internal only)
- ❌ Kibana: 5601 (now internal only)
- ❌ Prometheus: 9090 (now internal only)
- ❌ Alertmanager: 9093 (now internal only)
- ❌ Grafana: 3001:3000 (now internal only)
- ❌ Sentry: 9000 (now internal only)

**Kept External Access:**
- ✅ Backend: 8000 (serves both API and frontend)

### 2. Prometheus Configuration (`config/prometheus.yml`)
Updated backend scrape target: `backend:3000` → `backend:8000`

### 3. Backend Startup Messages (`backend/src/main.ts`)
Updated console messages to reflect internal-only monitoring stack access

## Port Configuration

### External Access (Public)
- **8000**: Main application (backend API + frontend)

### Internal Docker Network (Service-to-Service Communication)
- **postgres:5432**: PostgreSQL database
- **redis:6379**: Redis cache
- **nlu:8000**: NLU microservice
- **anomaly-detection:5000**: Anomaly detection service
- **elasticsearch:9200**: Log storage
- **logstash:5000**: Log aggregation
- **kibana:5601**: Log visualization
- **prometheus:9090**: Metrics storage
- **alertmanager:9093**: Alert management
- **grafana:3000**: Monitoring dashboards
- **sentry:9000**: Error tracking

## Benefits

1. **Security**: Reduced attack surface - only main application exposed
2. **Simplicity**: Single external port to manage and document
3. **Clarity**: Clear separation between public and internal services
4. **Compatibility**: All services continue working via Docker network

## Access

### For Development (Current Setup)
```bash
# Application
http://localhost:8000

# All monitoring services are internal to Docker network
# To access them, use docker exec or configure a reverse proxy
```

### For Docker Compose Deployment
```bash
# Start services
cd deployment/docker
docker-compose up -d

# Access application
http://localhost:8000

# Access internal services (from within containers)
docker-compose exec backend curl http://prometheus:9090
docker-compose exec backend curl http://grafana:3000
```

## Verification

✓ Only backend port 8000 exposed externally
✓ 12 services moved to internal-only access
✓ All Docker healthchecks use internal localhost
✓ Prometheus scraping backend on correct port
✓ Application serving correctly on port 8000
✓ Assets loading successfully

---
**Date**: 2026-02-05
**Status**: Complete ✅
