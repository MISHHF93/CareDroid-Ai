# Batch 13 Phase 1: Monitoring Implementation - Quick Reference

## 🚀 Commands to Start Development

```bash
# 1. Install dependencies
cd backend && npm install

# 2. Create logs directory
mkdir -p logs

# 3. Start Docker Compose (all monitoring services)
docker-compose up -d

# 4. Start backend in development mode
cd backend && npm run start:dev

# 5. Access URLs:
# - Backend API:        http://localhost:8000/api
# - Metrics:            http://localhost:8000/metrics
# - Grafana:            http://localhost:3001          (admin/admin)
# - Kibana Logs:        http://localhost:5601
# - Prometheus:         http://localhost:9090
# - Sentry Errors:      http://localhost:9000
```

## 📊 Monitoring Stack

| Service | Container | Port | Purpose | UI Login |
|---------|-----------|------|---------|----------|
| Prometheus | caredroid-prometheus | 9090 | Metrics storage & queries | No auth |
| Grafana | caredroid-grafana | 3001 | Metrics visualization | admin/admin |
| Elasticsearch | caredroid-elasticsearch | 9200 | Log indexing | No auth |
| Logstash | caredroid-logstash | 5000 | Log processing | No UI |
| Kibana | caredroid-kibana | 5601 | Log visualization | No auth |
| Sentry | caredroid-sentry | 9000 | Error tracking | Auto-create user |

## 📝 Common Tasks

### View Metrics
```bash
# In browser: http://localhost:9090
# Query HTTP requests:
sum(rate(http_requests_total[5m])) by (method)

# Query latency (95th percentile):
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Query database errors:
sum(rate(database_queries_total{status="error"}[5m])) by (operation)
```

### View Logs in Kibana
1. Go to http://localhost:5601
2. Click "Discover" 
3. Create index pattern: `logs-*`
4. Search logs:
   ```
   # High error rate
   level:error AND statusCode>=500

   # Slow requests
   duration>2000

   # Specific user
   userId:"user-123"
   ```

### Create Grafana Dashboard
1. Go to http://localhost:3001 (admin/admin)
2. Click "+" → "Dashboard" → "Add a new panel"
3. Select "Prometheus" as datasource
4. Write PromQL query:
   ```
   rate(http_requests_total{path="/api/patients"}[5m])
   ```
5. Save dashboard

### Monitor Errors with Sentry
1. Go to http://localhost:9000
2. Create account (or login with default if configured)
3. Errors will auto-populate as backend throws exceptions
4. Create alerts: Settings → Alerts → New Alert

## 🔧 Metrics Injection in Services

### In NestJS Service

```typescript
import { Injectable } from '@nestjs/common';
import { MetricsService } from './modules/metrics/metrics.service';

@Injectable()
export class PatientService {
  constructor(private metricsService: MetricsService) {}

  async getPatient(id: string) {
    const start = Date.now();
    try {
      const patient = await this.db.patients.findOne(id);
      
      this.metricsService.recordDatabaseQuery(
        'SELECT',
        'patients',
        Date.now() - start,
        'success'
      );
      
      return patient;
    } catch (error) {
      this.metricsService.recordDatabaseQuery(
        'SELECT',
        'patients',
        Date.now() - start,
        'error'
      );
      throw error;
    }
  }

  async invokeClinicalTool(toolName: string, input: any) {
    const start = Date.now();
    try {
      const result = await this.toolOrchestrator.invoke(toolName, input);
      
      this.metricsService.recordToolInvocation(
        toolName,
        Date.now() - start,
        'success'
      );
      
      return result;
    } catch (error) {
      this.metricsService.recordToolInvocation(
        toolName,
        Date.now() - start,
        'error'
      );
      throw error;
    }
  }
}
```

## 🐛 Debugging

### Check Container Status
```bash
docker-compose ps
docker-compose logs -f prometheus
docker-compose logs -f logstash
docker-compose logs -f backend
```

### Verify Connections
```bash
# Check Prometheus can scrape backend
curl http://localhost:9090/api/v1/query?query=http_requests_total

# Check Elasticsearch is healthy
curl http://localhost:9200/_health

# Check Logstash is processing logs
docker exec caredroid-logstash curl localhost:9600/_node/stats
```

### Manual Log Inspection
```bash
# View recent logs
tail -f logs/combined-$(date +%Y-%m-%d).log | jq

# View errors only
tail -f logs/errors-$(date +%Y-%m-%d).log | jq

# Count log entries
wc -l logs/combined-*.log
```

## 🚨 Alert Thresholds

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | >10% errors for 2min | CRITICAL | Page oncall |
| High Latency | 95th percentile >2s | WARNING | Investigate |
| DB Connection Pool | >90% utilization | CRITICAL | Scale DB |
| Emergency Detected | Any emergency condition | CRITICAL | Immediate response |
| Tool Errors | >10% errors on tool | WARNING | Check tool logs |

## 📦 Dependencies Added

```json
{
  "prom-client": "^15.1.3"
}
```

Also includes (already installed):
- `winston`: "^3.11.0" - Logging framework
- `winston-daily-rotate-file`: "^4.7.1" - Log rotation
- `@sentry/node`: "^7.91.0" - Error tracking
- `helmet`: "^7.1.0" - Security headers
- `@nestjs/common`: "^10.0.0" - NestJS framework

## ✅ Phase 1 Status

- ✅ Sentry error tracking (local instance in docker-compose)
- ✅ Winston structured logging (JSON to daily rotated files)
- ✅ HTTP middleware logging (request/response tracking)
- ✅ Prometheus metrics service (8+ metrics)
- ✅ Docker Compose monitoring stack (6 services)
- ✅ Logstash pipeline (log ingestion to Elasticsearch)
- ✅ Grafana datasource configuration
- ✅ Prometheus alert rules (20+ rules)
- ✅ Environment variables for monitoring

## 📋 Next: Phase 2 & 3

**Phase 2**: Production dashboards, alerting integrations, Kibana saved searches

**Phase 3**: AWS infrastructure templates, CloudWatch, Terraform modules

---

**Total Time for Phase 1**: ~3-4 hours
**Lines of Code Generated**: ~2000+ lines (configs + services + middleware)
**Services Added**: 6 (Elasticsearch, Logstash, Kibana, Prometheus, Grafana, Sentry)
