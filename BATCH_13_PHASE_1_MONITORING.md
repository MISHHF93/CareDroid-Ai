# Batch 13: Production Infrastructure & Monitoring - Phase 1

## Overview

Phase 1 implements **application-level monitoring infrastructure** for CareDroid using industry-standard open-source tools:

- **Sentry**: Error tracking and exception handling
- **Winston**: Structured logging with daily file rotation
- **Prometheus**: Metrics collection and time-series database
- **ELK Stack**: Elasticsearch (log indexing) + Logstash (log processing) + Kibana (log visualization)
- **Grafana**: Dashboard visualization of Prometheus metrics

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  CareDroid Backend                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │  HTTP Requests                                   │   │
│  │  ├─ Sentry Middleware (errors, tracing)         │   │
│  │  ├─ Logging Middleware (request/response logs)  │   │
│  │  └─ Metrics Recording (latency, status codes)   │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service Instrumentation                         │   │
│  │  ├─ Database queries (count, latency)           │   │
│  │  ├─ Cache operations (hit/miss rates)           │   │
│  │  ├─ Tool invocations (medical tools)            │   │
│  │  ├─ RAG retrieval (latency, success)            │   │
│  │  └─ Emergency detection (count by type)         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Sentry    │  │  Winston     │  │ Prometheus   │
    │   (Errors)  │  │  (Logs)      │  │  (Metrics)   │
    └─────────────┘  └──────────────┘  └──────────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
      ┌──────────────┐ ┌─────────┐    ┌──────────┐
      │ Elasticsearch│ │ Kibana  │    │ Grafana  │
      │ (Indexing)   │ │ (Logs)  │    │ (Metrics)│
      └──────────────┘ └─────────┘    └──────────┘
```

## Implementation Details

### 1. Sentry Configuration (`backend/src/config/sentry.config.ts`)

**Purpose**: Initialize error tracking and exception handling

**Features**:
- Environment-aware DSN handling (optional in development)
- Automatic integration with Express, Node.js HTTP, uncaught exceptions
- Configurable sample rates (100% for errors, 10% for transactions in production)
- Request body filtering for sensitive data
- Automatic breadcrumb tracking

**Usage**:
```typescript
// Automatically captures unhandled exceptions
throw new Error('Something went wrong');

// Manually capture exceptions in try-catch blocks
try {
  // some code
} catch (error) {
  Sentry.captureException(error);
}

// Capture messages
Sentry.captureMessage('User action completed', 'info');
```

### 2. Winston Logger (`backend/src/config/logger.config.ts`)

**Purpose**: Structured JSON logging with daily file rotation

**Features**:
- **5 Transports**:
  1. Console (debug in dev, warn in prod)
  2. Daily combined logs (all levels, 20MB max, 7-30 day retention)
  3. Daily error logs (errors only, 14-60 day retention)
  4. Exception handler logs (unhandled exceptions)
  5. Rejection handler logs (unhandled promise rejections)

- JSON format with automatic metadata (timestamp, service, environment)
- File rotation: daily rotation + size-based rotation (20MB)
- Retention policies: 7 days combined logs, 14 days error logs (development); 30/60 days (production)

**Usage**:
```typescript
import { Inject } from '@nestjs/common';

constructor(@Inject('LOGGER') private logger: Logger) {}

this.logger.info('User logged in', { userId: user.id });
this.logger.error('Database error', error);
this.logger.warn('High latency detected', { duration: 2500 });
```

### 3. HTTP Request Logging Middleware (`backend/src/middleware/logging.middleware.ts`)

**Purpose**: Capture HTTP request/response metadata and integrate with Sentry

**Features**:
- Structured logging of all HTTP requests
- Request timing (duration in milliseconds)
- Status code classification (2xx, 4xx, 5xx)
- Request/response size tracking
- JWT token parsing for user ID extraction
- Request ID generation for distributed tracing (X-Request-ID header)
- Sentry.setUser() for error correlation
- Slow request detection (>2s) with automatic warning logs and Sentry notification
- IP address and user agent capture

**Fields Logged**:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "requestId": "req-abc123xyz",
  "method": "POST",
  "url": "/api/patients",
  "statusCode": 201,
  "duration": 145,
  "ip": "192.168.1.100",
  "userId": "user-123",
  "contentLength": 512
}
```

### 4. Prometheus MetricsService (`backend/src/modules/metrics/metrics.service.ts`)

**Purpose**: Collect application and business metrics

**Metrics Collected**:
```
# HTTP Metrics
- http_requests_total{method, path, status}         (Counter)
- http_request_duration_seconds{method, path, status} (Histogram)
- http_request_size_bytes{method, path}              (Histogram)
- http_response_size_bytes{method, path, status}     (Histogram)

# Database Metrics
- database_queries_total{operation, entity, status}   (Counter)
- database_query_duration_seconds{operation, entity}  (Histogram)
- database_connection_pool_utilization{pool_name}     (Gauge)

# Cache Metrics
- cache_operations_total{operation, status}           (Counter)
- cache_hit_rate                                      (Gauge)

# Error Metrics
- errors_total{error_type, severity}                  (Counter)

# Business Metrics (Medical Tools)
- tool_invocations_total{tool_name, status}           (Counter)
- tool_invocation_duration_seconds{tool_name}         (Histogram)
- rag_retrieval_duration_seconds                      (Histogram)
- rag_retrieval_success{query_type}                   (Counter)
- emergency_detection_total{emergency_type, severity} (Counter)

# User Metrics
- active_users                                        (Gauge)
- authenticated_requests_total{user_role}             (Counter)

# System Metrics (automatic from Node.js)
- process_cpu_seconds_total                           (Counter)
- process_resident_memory_bytes                       (Gauge)
- nodejs_eventloop_lag_seconds                        (Histogram)
```

**Usage**:
```typescript
constructor(private metricsService: MetricsService) {}

// Record HTTP request
this.metricsService.recordHttpRequest(
  'POST',
  '/api/patients',
  201,
  150  // duration in ms
);

// Record database query
this.metricsService.recordDatabaseQuery(
  'SELECT',
  'patients',
  50,    // duration in ms
  'success'
);

// Record tool invocation
this.metricsService.recordToolInvocation(
  'drug-checker',
  200,   // duration in ms
  'success'
);

// Record emergency detection
this.metricsService.recordEmergencyDetection(
  'sepsis',
  'critical'
);
```

### 5. Logstash Configuration (`config/logstash.conf`)

**Purpose**: Aggregate and process logs from Winston into Elasticsearch

**Processing Pipeline**:
1. **Input**: Reads JSON logs from daily rotation files
   - Combined logs: `/logs/combined-*.log`
   - Error logs: `/logs/errors-*.log`
   - Exception logs: `/logs/exceptions-*.log`
   - Rejection logs: `/logs/rejections-*.log`

2. **Filter**: Parse and enrich logs
   - Parse timestamps to @timestamp field
   - Convert numeric strings to numbers (duration, statusCode, contentLength)
   - Add GeoIP information for non-localhost IPs
   - Add service metadata (environment, service name, version)
   - Tag slow requests (>2s) for alerting
   - Tag error/client error responses

3. **Output**: Index into Elasticsearch
   - Index name: `logs-YYYY.MM.dd` (daily indices)
   - Also outputs to stdout for Docker logs

### 6. Prometheus Configuration (`config/prometheus.yml`)

**Purpose**: Define Prometheus scrape targets and alert rules

**Scrape Targets**:
- **prometheus**: Prometheus itself metrics (5s interval)
- **caredroid-backend**: Application metrics endpoint (10s interval)
  - Path: `/metrics`
  - Timeout: 5s
  - Format: Prometheus text exposition format

**Alert Rules** (`config/prometheus/alert.rules.yml`):
- High error rate (>10% for 2 minutes) → CRITICAL
- High latency (95th percentile >2s for 5 minutes) → WARNING
- Slow database queries (99th percentile >1s) → WARNING
- Database error rate >5% → WARNING
- Connection pool >90% utilization → CRITICAL
- Cache hit rate <70% → WARNING
- Tool invocation errors >10% → WARNING
- Emergency conditions detected → CRITICAL
- High memory usage (>500MB) → WARNING
- High CPU usage (>80%) → WARNING

### 7. Grafana Configuration

**Datasources** (`config/grafana/provisioning/datasources/caredroid-datasources.yml`):
- Prometheus: `http://prometheus:9090`
- Elasticsearch: `http://elasticsearch:9200` (logs-* indices)

## Setup Instructions

### Step 1: Environment Variables

Copy the monitoring configuration from `.env.example`:

```bash
# Sentry
SENTRY_DSN=https://your-key@o0.ingest.sentry.io/0  # Leave blank for local dev
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0  # 100% in dev, 10% in prod

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs
LOG_MAX_SIZE=20m
LOG_MAX_DAYS_COMBINED=7  # dev: 7 days, prod: 30 days
LOG_MAX_DAYS_ERRORS=14   # dev: 14 days, prod: 60 days

# Monitoring Stack
PROMETHEUS_PORT=9090
GRAFANA_PASSWORD=admin
GRAFANA_USER=admin
GRAFANA_PORT=3001
KIBANA_PORT=5601
SENTRY_LOCAL_PORT=9000

# Database (for Sentry)
DB_NAME=caredroid
DB_USER=postgres
DB_PASSWORD=secure123

# Redis (for Sentry)
REDIS_PASSWORD=redis123
```

### Step 2: Install Dependencies

```bash
cd backend
npm install prom-client
```

### Step 3: Create Logs Directory

```bash
mkdir -p logs
```

### Step 4: Start Monitoring Stack

```bash
docker-compose up -d
```

This will start:
- Elasticsearch on port 9200
- Logstash (ingests logs into Elasticsearch)
- Kibana on port 5601 (query logs)
- Prometheus on port 9090 (query metrics)
- Grafana on port 3001 (visualize metrics)
- Sentry on port 9000 (track errors)

### Step 5: Start Backend

```bash
cd backend
npm run start:dev
```

### Step 6: Verify Monitoring

**Backend**:
```
📊 Prometheus metrics at: http://localhost:8000/metrics
```

Click the link to verify metrics are being collected:
```
# Sample output (Prometheus text format)
# HELP http_requests_total Total HTTP requests by method, path, and status code
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/patients",status="200"} 42
http_requests_total{method="POST",path="/api/patients",status="201"} 5

# HELP http_request_duration_seconds HTTP request latency in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="POST",path="/api/patients",status="201",le="0.01"} 0
http_request_duration_seconds_bucket{method="POST",path="/api/patients",status="201",le="0.05"} 3
...
http_request_duration_seconds_sum{method="POST",path="/api/patients",status="201"} 0.847
http_request_duration_seconds_count{method="POST",path="/api/patients",status="201"} 5
```

**Grafana** (http://localhost:3001):
- Login: admin / admin
- Explore data using Prometheus datasource
- Create custom dashboards

**Kibana** (http://localhost:5601):
- Discover logs (index: `logs-*`)
- Create visualizations
- Set up alerts

**Prometheus** (http://localhost:9090):
- Query metrics using PromQL
- View active alerts
- Explore targets

**Sentry** (http://localhost:9000):
- View captured errors and exceptions
- Create alerts for error patterns
- View breadcrumbs and stack traces

## Monitoring Logs on Disk

Logs are automatically written to:
```
logs/
├── combined-2024-01-15.log      # All logs (daily rotation)
├── errors-2024-01-15.log        # Error logs only (daily rotation)
├── exceptions-*.log              # Unhandled exceptions
└── rejections-*.log              # Unhandled Promise rejections
```

Each file contains JSON-formatted logs:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "User login successful",
  "userId": "user-123",
  "service": "caredroid-backend",
  "environment": "development"
}
```

## Next Steps (Phases 2 & 3)

**Phase 2: Production Dashboards & Alerting**
- Create Grafana dashboards for all metrics
- Set up alert integrations (email, Slack, PagerDuty)
- Configure Elasticsearch saved searches
- Document runbooks for common alerts

**Phase 3: Cloud Infrastructure & IaC**
- Terraform templates for AWS deployment
- CloudWatch integration
- AWS CloudFront CDN
- RDS backup automation
- S3 event logging
- ALB health checks

## Architecture Decision Records

### Why These Tools?

1. **Sentry**: Only error tracking tool with free local instance option
2. **Winston**: Lightweight, flexible logging with easy file rotation
3. **Prometheus**: Industry standard for metrics, excellent with Grafana
4. **ELK Stack**: Open-source log aggregation (Elasticsearch, Logstash, Kibana)
5. **Grafana**: Best-in-class metrics visualization

### Why Docker Compose?

- Development parity with production
- Easy service management
- Health checks prevent dependency issues
- Volume mounts for configuration
- All services on single bridge network for direct communication

### Structured JSON Logging

- Machine-readable for ELK Stack ingestion
- Easy to filter and aggregate in Kibana
- Includes request ID for distributed tracing
- Includes user ID for security audit trails

## Troubleshooting

### Logs not appearing in Kibana

1. Check Logstash is running: `docker-compose logs logstash`
2. Verify log files exist: `ls -la logs/`
3. Check Elasticsearch connection: `curl http://localhost:9200/_health`
4. Create index pattern in Kibana: Management > Index Patterns > Create Pattern

### Metrics not appearing in Prometheus

1. Check backend is running: `curl http://localhost:8000/metrics`
2. Verify Prometheus target health: http://localhost:9090/targets
3. Check backend logs for errors: `docker-compose logs backend`
4. Verify MetricsService is injected into services

### Sentry not capturing errors

1. Verify SENTRY_DSN is set in .env (or Sentry instance is running)
2. Check Sentry initialization: `grep -A 5 'initSentry' backend/src/main.ts`
3. Verify error is being thrown: check backend logs
4. Check Sentry Health: http://localhost:9000/_health/

## Files Created/Modified

### Created Files:
- `backend/src/config/sentry.config.ts` - Sentry initialization
- `backend/src/config/logger.config.ts` - Winston logger configuration
- `backend/src/modules/common/logger.module.ts` - NestJS logger module
- `backend/src/middleware/logging.middleware.ts` - HTTP request logging
- `backend/src/modules/metrics/metrics.service.ts` - Prometheus metrics
- `backend/src/modules/metrics/metrics.controller.ts` - /metrics endpoint
- `backend/src/modules/metrics/metrics.module.ts` - Metrics module
- `config/logstash.conf` - Logstash pipeline configuration
- `config/prometheus.yml` - Prometheus scrape configuration
- `config/prometheus/alert.rules.yml` - Alert rules
- `config/grafana/provisioning/datasources/caredroid-datasources.yml` - Grafana datasources
- `config/grafana/provisioning/dashboards/dashboard.yml` - Dashboard provisioning

### Modified Files:
- `backend/src/main.ts` - Added Sentry initialization, logging middleware, monitoring console logs
- `backend/src/app.module.ts` - Added LoggerModule and MetricsModule imports
- `backend/package.json` - Added prom-client dependency
- `docker-compose.yml` - Added 6 monitoring services (Elasticsearch, Logstash, Kibana, Prometheus, Grafana, Sentry)
- `.env.example` - Added monitoring environment variables
- `docker-compose.yml` - Added monitoring volumes

## Performance Impact

Monitoring should have minimal impact on application performance:

- **Sentry**: ~2-5ms per error (only on exceptions, async)
- **Winston**: ~1-3ms per log write (async, batched)
- **Prometheus**: ~1-2ms per metric update (in-memory, async)
- **Logging Middleware**: ~5-10ms per request (non-blocking, optimized)

Production deployment should:
- Set SENTRY_TRACES_SAMPLE_RATE=0.1 (10% of transactions)
- Set LOG_LEVEL=warn (skip debug logs)
- Monitor memory usage (metrics stored in-memory)
- Use separate cluster for ELK Stack in large deployments
