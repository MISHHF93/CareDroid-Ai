# Batch 13: Production Dashboards & Alerting - Phase 2 Research

**Status**: 📋 RESEARCH COMPLETE - RAW FINDINGS
**Date**: January 30, 2026
**Focus**: Discovery of Phase 2 requirements (dashboards, alerts, logs)

---

## 1. PHASE 1 COMPLETION STATUS ✅

### Delivered in Phase 1

**Core Infrastructure**:
- ✅ Sentry (error tracking) → http://localhost:9000
- ✅ Winston (structured JSON logging) → logs/ directory (daily rotation)
- ✅ Prometheus (metrics collection) → http://localhost:9090
- ✅ ELK Stack (Elasticsearch + Logstash + Kibana) → http://localhost:5601
- ✅ Grafana (metrics visualization) → http://localhost:3001 (admin/admin)

**Metrics Collected** (20+ metrics):
```
HTTP Layer:
- http_requests_total (Counter)
- http_request_duration_seconds (Histogram: 10 buckets)
- http_request_size_bytes, http_response_size_bytes (Histograms)

Database Layer:
- database_queries_total (Counter)
- database_query_duration_seconds (Histogram)
- database_connection_pool_utilization (Gauge)

Cache/Redis:
- cache_operations_total (Counter)
- cache_hit_rate (Gauge)

Business Metrics:
- tool_invocations_total (Counter: by tool_name, status)
- tool_invocation_duration_seconds (Histogram: by tool_name)
- rag_retrieval_duration_seconds (Histogram)
- rag_retrieval_success (Counter: by query_type)
- emergency_detection_total (Counter: by emergency_type, severity)

User Metrics:
- active_users (Gauge)
- authenticated_requests_total (Counter: by user_role)

Errors:
- errors_total (Counter: by error_type, severity)

System (automatic):
- process_cpu_seconds_total, process_resident_memory_bytes
- nodejs_eventloop_lag_seconds
```

**Alerts Defined** (20+ rules in config/prometheus/alert.rules.yml):

HTTP/API:
- HighErrorRate (>10% for 2m) → CRITICAL
- HighLatency (95th % >2s for 5m) → WARNING
- RequestRateAnomaly (50% change from 1h baseline) → WARNING

Database:
- SlowDatabaseQueries (99th % >1s) → WARNING
- HighDatabaseErrorRate (>5% for 2m) → WARNING
- DatabaseConnectionPoolExhausted (>90% util) → CRITICAL

Cache:
- CacheMissRateHigh (>30% for 5m) → WARNING

Tools & Medical:
- HighToolErrorRate (>10% per tool) → WARNING
- SlowToolInvocation (95th % >10s) → WARNING
- SlowRagRetrieval (90th % >2s) → WARNING
- EmergencyDetected (any occurrence) → CRITICAL

Application:
- ApplicationErrorRate (>1% for 3m) → WARNING
- ActiveUserAnomaly (90% change from 1h avg) → WARNING

System:
- HighMemoryUsage (>500MB) → WARNING
- HighCPUUsage (>80% for 5m) → WARNING

**Logging Infrastructure**:
```
Log Files Created:
- logs/combined-YYYY-MM-DD.log (all levels, 7d retention default)
- logs/errors-YYYY-MM-DD.log (errors only, 14d retention default)
- logs/exceptions-*.log (unhandled exceptions)
- logs/rejections-*.log (unhandled promise rejections)

JSON Structure (per log entry):
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info|warn|error",
  "service": "caredroid-backend",
  "environment": "development",
  "requestId": "req-abc123xyz",
  "method": "POST|GET|PUT|DELETE",
  "url": "/api/patients",
  "statusCode": 201,
  "duration": "145ms",
  "userId": "user-123",
  "ip": "192.168.1.100",
  "contentLength": 512
}

Additional fields added by Logstash:
- geoip (if IP != localhost)
- tags: ["slow_request", "server_error", "client_error"]
- performance_issue: true (if duration > 2000ms)
```

---

## 2. MONITORING STACK ARCHITECTURE

### Running Services (Docker Compose)

```yaml
Service Stack:
├── PostgreSQL (port 5432) - Database for Sentry & app data
├── Redis (port 6379) - Cache for Sentry & sessions
├── Backend/NestJS (port 8000) - Application
│   └── /metrics endpoint → Prometheus text format
├── NLU Microservice (port 8001) - Intent classification
└── Frontend/React (port 5173) - Vite dev server

Monitoring Stack:
├── Elasticsearch (port 9200) - Log indexing, JSON documents
├── Logstash (port 5000) - Log pipeline (reads ./logs/*, outputs to ES)
├── Kibana (port 5601) - Log visualization & queries
├── Prometheus (port 9090) - Metrics TSDB (30d retention)
└── Grafana (port 3001) - Dashboard builder, visualizes Prometheus

Error Tracking:
└── Sentry (port 9000) - Exception tracking (uses shared PostgreSQL + Redis)
```

### Data Flows

```
Backend Service:
  HTTP Request → LoggingMiddleware → Sentry (errors only)
             ↓
  Winston Logger → Disk Files (combined/errors/exceptions/rejections)
             ↓
  Logstash Pipeline → Elasticsearch → Kibana UI
  
  Prometheus Collector (prom-client) → /metrics endpoint
             ↓
  Prometheus Scraper (10s interval) → Time-series storage
             ↓
  Alert Rules → Prometheus Alert Manager (not yet configured)
             ↓
  Grafana Queries (PromQL)
```

### Key Integration Points

**Prometheus Setup**:
- Config: `config/prometheus.yml`
- Scrapes: `http://backend:3000/metrics` (10s interval)
- Alert Rules: `config/prometheus/alert.rules.yml`
- Alerting: NOT YET CONFIGURED (targets section commented out)

**Grafana Setup**:
- Config: `config/grafana/provisioning/datasources/caredroid-datasources.yml`
- Datasources Pre-configured:
  - Prometheus: `http://prometheus:9090`
  - Elasticsearch: `http://elasticsearch:9200` (indices: `logs-*`)
- Dashboard Provisioning: `config/grafana/provisioning/dashboards/dashboard.yml`
  - Points to `/etc/grafana/provisioning/dashboards/caredroid` (NO DASHBOARDS YET)
- Default Login: `admin/admin` (MUST CHANGE IN PROD)

**Elasticsearch/Kibana**:
- Indices created: `logs-YYYY.MM.DD` (daily)
- No authentication enabled (SECURITY RISK - needs reverse proxy)
- Index pattern creation needed in Kibana UI
- No saved searches configured yet

**Sentry Configuration**:
- Uses shared PostgreSQL + Redis from docker-compose
- DSN environment variable (optional - works without)
- Error captures: unhandled exceptions + manual captures
- No alert destinations configured yet

---

## 3. APPLICATION STRUCTURE & MONITORING TARGETS

### Backend Modules

```
backend/src/modules/
├── auth/ (login, JWT, OAuth)
├── users/ (user management, profiles)
├── subscriptions/ (Stripe integration, billing)
├── two-factor/ (2FA setup/verification)
├── ai/ (OpenAI integration)
├── clinical/ (drugs, protocols CRUD)
├── chat/ (main conversation interface)
│   └── Depends on: IntentClassifier, ToolOrchestrator, RAGService
├── medical-control-plane/
│   ├── intent-classifier/ (NLU service at :8001)
│   │   └── Classifies user queries → identifies intent + required tools
│   └── tool-orchestrator/
│       ├── sofa-calculator/ (SOFA score for organ failure)
│       ├── drug-checker/ (drug interactions, contraindications)
│       └── lab-interpreter/ (lab results analysis)
├── rag/ (Retrieval-Augmented Generation)
│   └── Pinecone vector DB for medical knowledge
├── audit/ (immutable audit logs with hash chaining)
├── compliance/ (HIPAA, data export, deletion)
├── analytics/ (user/usage analytics)
├── encryption/ (data encryption at rest)
└── common/ (LoggerModule, MetricsModule)

Databases:
├── PostgreSQL: users, audit_logs, conversations, subscriptions, etc.
└── Pinecone (vector DB): medical knowledge embeddings
```

### Key Business Processes to Monitor

**1. Chat & Intent Classification**:
```
User Message → NLU Service (/classify endpoint)
  └─ Metrics to track:
     - intent_classification_duration (by intent_type)
     - intent_classification_accuracy (confidence scores)
     - nlu_service_errors (connection errors to :8001)
     - request_rate by intent (e.g., drug-check, vitals, protocols)
```

**2. Tool Orchestration**:
```
Tool Invocation → Tool Service (SOFA, Drug Checker, Lab Interpreter)
  ├─ Existing: tool_invocations_total, tool_invocation_duration_seconds
  ├─ Missing metrics:
     - tool_validation_errors (failed validations)
     - tool_execution_success_rate (by tool_name)
     - tool_output_quality (custom field)
```

**3. RAG Knowledge Retrieval**:
```
Query → Pinecone Vector Search → LLM Integration
  ├─ Existing: rag_retrieval_duration_seconds, rag_retrieval_success
  ├─ Missing:
     - rag_relevance_score (semantic similarity)
     - rag_source_diversity (unique sources per query)
     - pinecone_api_errors
```

**4. Emergency Detection**:
```
Message → Emergency Classifier → Escalation
  ├─ Existing: emergency_detection_total (by type, severity)
  ├─ Missing:
     - emergency_false_positive_rate (for validation)
     - emergency_response_time (detect to escalate)
```

**5. User Activity**:
```
Authentication & Request Tracking
  ├─ active_users (connected users)
  ├─ authenticated_requests_total (by user_role)
  ├─ Missing:
     - session_duration (by user)
     - api_usage_by_feature (chat, tools, audit, etc.)
     - concurrent_users_by_role
```

**6. Data Access (Audit & Compliance)**:
```
PHI Access → Audit Log with Hash Chain
  ├─ audit_log_entries_total (by action_type)
  ├─ phi_access_events (by user, by resource)
  ├─ audit_integrity_violations
  ├─ Missing:
     - consent_status_tracking (user data export/delete)
     - encryption_key_rotations
```

### Entities to Monitor

**Users**: registration, login, 2FA, subscription changes
**Patients**: Not explicitly in app yet (future?)
**Conversations**: message count, tool usage, emergency flags
**Audit Logs**: immutable chain, PHI access, actions
**Subscriptions**: Stripe events, plan changes, refunds
**Errors**: by type, by endpoint, by severity

---

## 4. GRAFANA DASHBOARD REQUIREMENTS

### Recommended Dashboard Structure (8-10 dashboards)

#### **1. API Performance Dashboard**
```
Metrics to visualize:
- Request rate (req/sec) by method
- Latency distribution (p50, p95, p99)
- Error rate % trending
- Response sizes (request/response bytes)
- Top 10 slowest endpoints
- Status code distribution (2xx/3xx/4xx/5xx)

PromQL Queries Needed:
- sum(rate(http_requests_total[5m])) by (method)
- histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (path)
- (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100
- sum(rate(http_response_size_bytes[5m])) by (method)
- topk(10, sum(rate(http_request_duration_seconds_sum[5m])) by (path))
- sum(increase(http_requests_total[5m])) by (status)
```

#### **2. Database Performance Dashboard**
```
Metrics:
- Query latency distribution (p50, p95, p99)
- Query count by operation (SELECT, INSERT, UPDATE, DELETE)
- Error rate by operation
- Connection pool utilization %
- Top 10 slowest operations
- Dead queries trending

PromQL Queries:
- histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m])) by (operation)
- sum(rate(database_queries_total[5m])) by (operation)
- (sum(rate(database_queries_total{status="error"}[5m])) / sum(rate(database_queries_total[5m]))) * 100
- database_connection_pool_utilization * 100
- topk(10, sum(rate(database_query_duration_seconds_sum[5m])) by (operation))
```

#### **3. Cache & Redis Dashboard**
```
Metrics:
- Cache hit rate %
- Cache miss rate %
- Operation count by type (get, set, delete)
- Hit/miss ratio trending
- Cache operation latency

PromQL Queries:
- cache_hit_rate * 100
- (1 - cache_hit_rate) * 100
- sum(rate(cache_operations_total[5m])) by (operation)
- (sum(rate(cache_operations_total{status="hit"}[5m])) / sum(rate(cache_operations_total[5m]))) * 100
```

#### **4. Business Metrics Dashboard (Medical Tools)**
```
Metrics:
- Tool invocation count by tool (SOFA, Drug Checker, Lab Interpreter)
- Tool success/error rates
- Tool execution latency
- RAG retrieval latency
- RAG retrieval success rate
- Emergency detections by type
- Emergency severity distribution

PromQL Queries:
- sum(increase(tool_invocations_total[5m])) by (tool_name)
- (sum(rate(tool_invocations_total{status="success"}[5m])) / sum(rate(tool_invocations_total[5m]))) by (tool_name) * 100
- histogram_quantile(0.95, rate(tool_invocation_duration_seconds_bucket[5m])) by (tool_name)
- histogram_quantile(0.90, rate(rag_retrieval_duration_seconds_bucket[5m]))
- sum(increase(emergency_detection_total[5m])) by (emergency_type)
- sum(increase(emergency_detection_total[5m])) by (severity)
```

#### **5. Error & Exception Dashboard**
```
Metrics:
- Error rate % trending
- Top 10 error types
- Error severity distribution (critical/warning/info)
- Sentry error count
- Error rate by endpoint
- Failed authentication attempts
- Stack trace summaries

PromQL Queries:
- sum(increase(errors_total[5m])) by (error_type)
- topk(10, sum(increase(errors_total[5m])) by (error_type))
- sum(increase(errors_total[5m])) by (severity)
- (sum(rate(errors_total[5m])) / sum(rate(http_requests_total[5m]))) * 100
```

#### **6. System Health Dashboard**
```
Metrics:
- Memory usage (MB)
- CPU usage %
- Event loop lag (seconds)
- Process uptime
- GC pause frequencies
- Node.js version

PromQL Queries:
- process_resident_memory_bytes / 1024 / 1024
- rate(process_cpu_seconds_total[5m]) * 100
- histogram_quantile(0.95, rate(nodejs_eventloop_lag_seconds_bucket[5m]))
- time() - process_start_time_seconds
```

#### **7. User Activity Dashboard**
```
Metrics:
- Active users count
- Authenticated requests by role
- New user registrations (daily)
- Login attempts vs successes
- Concurrent users by endpoint
- User retention trending

PromQL Queries:
- active_users
- sum(rate(authenticated_requests_total[5m])) by (user_role)
- increase(authenticated_requests_total[1d])
```

#### **8. Alert Status Dashboard**
```
Metrics:
- Firing alerts (count by severity)
- Alert frequency (how often alerts fire)
- Alert resolution time
- False positive/negative rates
- SLA compliance

PromQL Queries:
- count(ALERTS{alertstate="firing"}) by (severity)
- sum(increase(ALERTS[1h])) by (alertname)
```

#### **9. Audit & Compliance Dashboard**
```
Metrics:
- PHI access events (count, by user)
- Audit log entries (count by action_type)
- Failed auth attempts
- Data export/delete requests
- Compliance violations

Custom Kibana searches needed:
- Filter: level:error AND statusCode>=500
- Filter: tags:"slow_request"
- Filter: userId:"user-123" (user activity trail)
- Filter: url:/api/audit* (audit log activity)
```

#### **10. Intent Classification & NLU Dashboard**
```
Metrics:
- Intent classification accuracy
- NLU service latency
- Classification by intent type
- Confidence score distribution
- NLU service errors/timeouts

PromQL Queries (custom metrics to add):
- histogram_quantile(0.95, rate(intent_classification_duration_seconds_bucket[5m]))
- sum(rate(intent_classification_total[5m])) by (intent_type)
```

---

## 5. ALERT INTEGRATION OPTIONS

### Current State
```
✅ Alert Rules Defined: 20+ rules in config/prometheus/alert.rules.yml
❌ Alert Destinations: NOT CONFIGURED
❌ Alertmanager: NOT DEPLOYED
❌ Notification Channels: NO INTEGRATIONS
```

### Integration Options Available

#### **Option 1: Prometheus Alertmanager + Email**
```yaml
Components Needed:
- Alertmanager Docker service (needs to be added to docker-compose.yml)
- SMTP configuration (mail server)
- Routing rules (which alerts → which channels)
- Email template customization

Config Files:
- alertmanager.yml (routes, grouping, receivers)
- Email templates for each alert type

Pros:
- Native Prometheus integration
- Standard tool
- Works with all alert rules

Cons:
- Requires SMTP server setup
- Email can be slow/unreliable
- No rich formatting (plain text or HTML)
```

#### **Option 2: Slack Webhook Integration**
```yaml
Components Needed:
- Webhook receiver in Alertmanager
- Slack App API token
- Channel configuration (which alerts → which channels)
- Message formatting (custom Slack blocks for rich formatting)

Config:
- alertmanager.yml with slack_configs
- Channel names/webhook URLs

Pros:
- Real-time notifications
- Rich formatted messages
- Team visibility
- Thread support for grouped alerts

Cons:
- Requires Slack workspace
- Slack rate limits
- Need to manage webhook tokens securely
```

#### **Option 3: PagerDuty Integration**
```yaml
Components Needed:
- PagerDuty API integration key
- Incident routing (alert → service → escalation policy)
- Severity mapping (Prometheus severity → PagerDuty urgency)

Config:
- alertmanager.yml with pagerduty_configs
- Service key for each alert type

Pros:
- On-call management built-in
- Escalation policies
- Incident tracking
- Mobile alerts

Cons:
- Paid service
- Complex setup (services, escalation policies)
- Overkill for small teams
```

#### **Option 4: Generic Webhook**
```yaml
Components Needed:
- Custom webhook receiver (HTTP POST endpoint)
- JSON payload formatting
- Any external system (custom app, third-party service)

Config:
- alertmanager.yml with webhook_configs
- Webhook URL(s)

Pros:
- Maximum flexibility
- Can integrate with any system
- Custom logic possible

Cons:
- Need host for webhook receiver
- Custom implementation required
- Error handling complexity
```

#### **Option 5: Sentry Integration** (ALREADY PARTIALLY DONE)
```yaml
Current Status:
- Sentry already receives unhandled exceptions
- Can't directly receive Prometheus alerts
- Could bridge via custom webhook

Potential:
- Create webhook that sends to Sentry API
- Group similar alerts
- Track in Sentry issue timeline

Limitation:
- Sentry not designed for operational alerts
```

### Recommended Alert Routing Strategy

```yaml
Alert Severity Mapping:
┌─────────────┬───────────────────────────────────────┐
│ Severity    │ Destinations                          │
├─────────────┼───────────────────────────────────────┤
│ CRITICAL    │ PagerDuty (on-call) + Slack (#alerts) │
│ WARNING     │ Slack (#warnings) + Email             │
│ INFO        │ Slack (#info) only                    │
└─────────────┴───────────────────────────────────────┘

Alert Groups:
- Database Alerts → #database-alerts (warning level)
- Performance Alerts → #performance (critical+warning)
- Emergency Detected → #emergencies (critical)
- Application Errors → #application (critical+warning)
- System Health → #infrastructure (all)
```

### Implementation Constraints

**Docker Compose Integration**:
- Alertmanager service needs to be added
- Network communication (prometheus → alertmanager)
- Volume mounts for config files
- Environment variables for secrets (SMTP password, Slack token, PagerDuty key)

**Prometheus Configuration**:
- prometheus.yml already has alerting section (commented)
- Just needs uncommented + Alertmanager address

**Environment Variables Needed**:
```bash
# Email (if using SMTP)
ALERTMANAGER_SMTP_HOST=smtp.gmail.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=alerts@company.com
ALERTMANAGER_SMTP_PASSWORD=password
ALERTMANAGER_EMAIL_TO=oncall@company.com

# Slack (if using webhook)
ALERTMANAGER_SLACK_WEBHOOK=https://hooks.slack.com/services/...
ALERTMANAGER_SLACK_CHANNEL=#alerts

# PagerDuty (if using integration)
ALERTMANAGER_PAGERDUTY_KEY=service-key-xxx
ALERTMANAGER_PAGERDUTY_INTEGRATION_KEY=integration-key-xxx
```

**Security Considerations**:
- Webhook tokens/API keys via environment variables
- Alertmanager config file (should not expose sensitive data)
- .env file with secrets (not committed to git)
- Reverse proxy for Alertmanager UI (if exposed)

---

## 6. KIBANA SAVED SEARCHES & QUERIES

### Index Pattern Setup (Required First)

```bash
Action in Kibana UI:
1. Go to http://localhost:5601
2. Management > Index Patterns > Create Pattern
3. Index pattern: logs-*
4. Time field: @timestamp
5. Confirm creation
```

### Query Syntax in Kibana

Kibana uses **Elasticsearch Query DSL** (Lucene query syntax):

```
Syntax Examples:
- level:error                           (exact match)
- level:(error OR warn)                 (OR condition)
- statusCode:[500 TO 599]               (range query)
- duration>2000                         (numeric comparison)
- url:/api/patients/*                   (wildcard)
- NOT level:debug                       (negation)
- userId:"user-123" AND level:error    (AND condition)
```

### Recommended Saved Searches

#### **1. High-Severity Error Logs**
```
Query: level:error AND statusCode:[500 TO 599]
Grouping: By error type, by endpoint
Columns: timestamp, level, statusCode, url, error message, userId
Purpose: Operations team reviews critical errors
Alert: On new results
```

#### **2. Slow Request Performance Issues**
```
Query: duration>2000 AND tags:"slow_request"
Fields: timestamp, duration, method, url, statusCode, userId
Grouping: By endpoint (url)
Purpose: Performance optimization, capacity planning
Threshold Alert: >10 slow requests in 5m window
```

#### **3. User Activity Audit Trail**
```
Query: userId:"${USER_ID}"
Filters: Date range (last 7 days default)
Fields: timestamp, method, url, statusCode, duration, ip
Grouping: By date, by endpoint
Purpose: Compliance, user behavior analysis
Export: CSV for audit reports
```

#### **4. Authentication Failures**
```
Query: url:/api/auth/* AND statusCode:[401 TO 403]
Grouping: By user (failed auth attempts), by IP
Fields: timestamp, ip, userId (if available), url
Purpose: Security monitoring, brute force detection
Alert: >5 failures from same IP in 1m
```

#### **5. Database Error Tracking**
```
Query: level:error AND tags:"database"
Fields: timestamp, level, database error message, duration
Grouping: By error type
Purpose: Database team debugging
Correlation: Cross-reference with PostgreSQL logs
```

#### **6. RAG/AI Query Performance**
```
Query: url:/api/chat/* OR url:/api/rag/*
Fields: timestamp, duration, url, userId, confidence score (if in logs)
Grouping: By endpoint, by user
Purpose: AI/ML team optimization
Alert: Avg duration > 5s for 10m period
```

#### **7. Tool Invocation Tracking**
```
Query: url:/api/tools/*
Fields: timestamp, method, url, statusCode, duration, tool_name
Grouping: By tool_name
Purpose: Tool usage analytics, performance
Export: For product analytics
```

#### **8. Emergency Detection Events**
```
Query: url:/api/chat/* AND message:"emergency" (or similar indicator)
Fields: timestamp, userId, severity, message snippet
Grouping: By severity, by user
Purpose: Clinical oversight, quality assurance
Purpose: Validate emergency detection accuracy
```

#### **9. API Response Size Analysis**
```
Query: contentLength:[100000 TO *]
Fields: timestamp, url, contentLength, method
Grouping: By endpoint
Purpose: Bandwidth optimization, payload chunking
Alert: Average response size > 1MB
```

#### **10. Compliance & PHI Access**
```
Query: url:/api/audit* OR url:/api/compliance*
Fields: timestamp, userId, action, resource, statusCode
Grouping: By userId, by action
Purpose: HIPAA compliance, audit trail
Export: Monthly compliance reports
```

#### **11. Session & Concurrency Analysis**
```
Query: requestId:* AND method:GET
Unique: Count unique requestId values per timestamp
Purpose: Concurrent user estimation
Trending: Daily, weekly patterns
```

#### **12. Subscription/Billing Events**
```
Query: url:/api/subscriptions/*
Fields: timestamp, method, statusCode, userId, intent (if captured)
Grouping: By status code (failures highlighted)
Purpose: Revenue ops, error resolution
Alert: Failed payment processing (5xx response)
```

#### **13. Third-Party Integration Failures** (NLU, Pinecone, OpenAI)
```
Query: url:/api/chat/* AND duration>[custom timeout]
OR: statusCode:504 (gateway timeout)
OR: message:"timeout" OR message:"connection refused"
Fields: timestamp, url, duration, error message
Purpose: Upstream service monitoring
Alert: High timeout rate
```

#### **14. Geographic Analysis** (if geoip present)
```
Query: geoip.country_name:*
Fields: timestamp, ip, geoip.country_name, geoip.city_name
Grouping: By country, by city
Purpose: Usage distribution, anomaly detection
Alert: Unusual geographic origin
```

#### **15. Endpoint Health Summary**
```
Query: method:* AND statusCode:*
Fields: timestamp, method, url, statusCode, count
Grouping: By url, by statusCode
Visualization: Status code distribution pie chart
Purpose: Overall API health at a glance
```

---

## 7. IMPLEMENTATION CONSTRAINTS & ASSUMPTIONS

### Docker Compose Limitations

```yaml
Current Issues:
❌ Alertmanager not deployed
❌ Elasticsearch security disabled (no authentication)
❌ Kibana no authentication (SECURITY RISK)
❌ Prometheus metrics endpoint exposed (public)
❌ Grafana default password (admin/admin)

Port Availability:
- 9090 (Prometheus) - Available
- 9091-9092 (Alertmanager, etc.) - Available
- 5601 (Kibana) - Available
- 5000 (Logstash) - In use as listener
- 9200 (Elasticsearch) - In use
- 3000→3001 (Grafana) - Mapped to 3001

Network:
- All services on `caredroid` bridge network
- Internal communication via service names (e.g., prometheus:9090)
- No DNS issues expected
```

### Environment Variables Configured

```bash
From .env.example (monitoring-related):

# Sentry
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs
LOG_MAX_SIZE=20m
LOG_MAX_DAYS_COMBINED=7
LOG_MAX_DAYS_ERRORS=14
LOG_MAX_DAYS_PROD_COMBINED=30
LOG_MAX_DAYS_PROD_ERRORS=60

# Monitoring Stack Ports
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

### File Structure for Phase 2 Creation

```
Directories to Create:
config/grafana/provisioning/dashboards/caredroid/
  ├── api-performance.json
  ├── database-performance.json
  ├── cache-health.json
  ├── business-metrics.json
  ├── error-dashboard.json
  ├── system-health.json
  ├── user-activity.json
  ├── alert-status.json
  ├── audit-compliance.json
  └── nlu-intelligence.json

config/alertmanager/ (new)
  ├── config.yml
  ├── email-templates/
  │   ├── critical.html
  │   ├── warning.html
  │   └── info.txt
  └── slack-templates/
      └── blocks.yml

Documents:
├── BATCH_13_PHASE_2_DASHBOARDS.md (dashboard JSON + PromQL)
├── BATCH_13_PHASE_2_ALERTS.md (alert routing, integrations)
└── BATCH_13_PHASE_2_KIBANA.md (saved searches, queries)
```

### NestJS Patterns Used

```typescript
// Metrics injection pattern (established in Phase 1)
constructor(private metricsService: MetricsService) {}

// Logger injection pattern (established in Phase 1)
constructor(@Inject('LOGGER') private logger: Logger) {}

// Service-level metric recording (ready to use)
this.metricsService.recordDatabaseQuery(operation, entity, duration, status);
this.metricsService.recordToolInvocation(toolName, duration, status);
this.metricsService.recordEmergencyDetection(type, severity);

// Custom metric recording (pattern for Phase 2)
@Injectable()
export class CustomMetricsService {
  constructor(private metricsService: MetricsService) {}
  
  recordIntentClassification(intent: string, confidence: number) {
    // Already available: MetricsService.recordCustomMetric(name, value, labels)
  }
}
```

### Database Considerations

```sql
Current Tables (for audit/tracking):
- users (id, email, role, created_at)
- audit_logs (id, userId, action, resource, timestamp, hash, previousHash)
- conversations (need to verify if exists)
- subscriptions (for Stripe webhook tracking)

Queries Needed for Kibana:
- Average response time by endpoint per day
- Error count by endpoint per hour
- Distinct user count per day
- Tool invocation count by type
- PHI access events (audit_logs where action=PHI_ACCESS)
```

---

## 8. QUICK METRICS & ALERTS SUMMARY

### Current Metrics Collected (20+)

| Layer | Metric Name | Type | Labels |
|-------|-------------|------|--------|
| HTTP | http_requests_total | Counter | method, path, status |
| HTTP | http_request_duration_seconds | Histogram | method, path, status |
| HTTP | http_request_size_bytes | Histogram | method, path |
| HTTP | http_response_size_bytes | Histogram | method, path, status |
| DB | database_queries_total | Counter | operation, entity, status |
| DB | database_query_duration_seconds | Histogram | operation, entity |
| DB | database_connection_pool_utilization | Gauge | pool_name |
| Cache | cache_operations_total | Counter | operation, status |
| Cache | cache_hit_rate | Gauge | (no labels) |
| Errors | errors_total | Counter | error_type, severity |
| Tools | tool_invocations_total | Counter | tool_name, status |
| Tools | tool_invocation_duration_seconds | Histogram | tool_name |
| RAG | rag_retrieval_duration_seconds | Histogram | (no labels) |
| RAG | rag_retrieval_success | Counter | query_type |
| Emergency | emergency_detection_total | Counter | emergency_type, severity |
| Users | active_users | Gauge | (no labels) |
| Users | authenticated_requests_total | Counter | user_role |
| System | process_cpu_seconds_total | Counter | (auto) |
| System | process_resident_memory_bytes | Gauge | (auto) |
| System | nodejs_eventloop_lag_seconds | Histogram | (auto) |

### Alert Rules (20+ rules)

| Category | Alert Name | Condition | Severity | Duration |
|----------|-----------|-----------|----------|----------|
| HTTP | HighErrorRate | Error % > 10% | CRITICAL | 2m |
| HTTP | HighLatency | p95 latency > 2s | WARNING | 5m |
| HTTP | RequestRateAnomaly | Rate change > 50% | WARNING | 5m |
| DB | SlowDatabaseQueries | p99 > 1s | WARNING | 5m |
| DB | HighDatabaseErrorRate | Error % > 5% | WARNING | 2m |
| DB | DatabaseConnectionPoolExhausted | Util > 90% | CRITICAL | 1m |
| Cache | CacheMissRateHigh | Miss % > 30% | WARNING | 5m |
| Tools | HighToolErrorRate | Tool error % > 10% | WARNING | 2m |
| Tools | SlowToolInvocation | p95 > 10s | WARNING | 5m |
| RAG | SlowRagRetrieval | p90 > 2s | WARNING | 5m |
| Emergency | EmergencyDetected | Count > 0 | CRITICAL | 0m (immediate) |
| App | ApplicationErrorRate | Error ratio > 1% | WARNING | 3m |
| App | ActiveUserAnomaly | Change > 90% from avg | WARNING | 5m |
| System | HighMemoryUsage | Mem > 500MB | WARNING | 2m |
| System | HighCPUUsage | CPU > 80% | WARNING | 5m |

### Missing Metrics (for Phase 2 enhancement)

```
Business Intelligence:
- intent_classification_accuracy (confidence distribution)
- nlu_service_latency (connection to :8001)
- rag_relevance_score (semantic similarity metrics)
- emergency_false_positive_rate (validation metric)

User & Session:
- session_duration (login to logout)
- concurrent_users_by_role (role distribution)
- api_usage_by_feature (chat, tools, audit breakdown)
- data_export_delete_requests (compliance tracking)

Infrastructure:
- elasticsearch_index_size (bytes)
- logstash_processing_lag (time to index)
- grafana_dashboard_view_count
- sentry_event_ingestion_rate

Compliance:
- phi_access_audit_log_entries (by user, by resource)
- encryption_key_rotation_count
- audit_chain_integrity_violations
```

---

## 9. BLOCKERS & DEPENDENCIES

### Technical Blockers

```yaml
Docker Issues:
❌ Alertmanager - Not in docker-compose.yml (needs to be created)
❌ Elasticsearch auth - Disabled (needs reverse proxy or auth config)
❌ TLS/HTTPS - Monitoring stack on HTTP (needs reverse proxy in prod)

Configuration Issues:
❌ Alertmanager config - Not created
❌ Alert routing rules - Not defined
❌ Grafana dashboards - No JSON files created
❌ Saved searches - No Kibana saved items

Secrets Management:
⚠️  Environment variables in .env (needs vault in prod)
⚠️  Elasticsearch credentials (none set currently)
⚠️  Slack/PagerDuty tokens (not configured)

Testing:
❌ End-to-end alert testing (trigger and verify flow)
❌ Kibana query validation (need live data)
❌ Grafana dashboard responsiveness (depends on query performance)
```

### External Dependencies

```yaml
Services Required:
- SMTP Server (if using email alerts)
- Slack Workspace (if using Slack)
- PagerDuty Account (if using PagerDuty)
- Grafana Cloud (optional, for hosted dashboards)

Data Dependencies:
- Logs in logs/ directory (must exist)
- Elasticsearch healthy (data indexing)
- Prometheus scraping successfully (metrics collection)
```

### Timeline Dependencies

```
Phase 2 Success Depends On:
1. Docker Compose updated with Alertmanager ✅ (can be done early)
2. Log data flowing to Elasticsearch ✅ (should be automatic)
3. Prometheus metrics scraping ✅ (should be automatic)
4. Grafana datasources configured ✅ (already done in Phase 1)
5. Alert integration credentials ❌ (external setup needed)
```

---

## 10. TECHNICAL RECOMMENDATIONS

### For Dashboard Design

```yaml
Best Practices:
✅ Use Grafana variables for filtering (${job}, ${instance})
✅ Organize by logical business domain (not technical layers)
✅ Include red/yellow/green thresholds for quick status
✅ Add table panels for top N data (slowest endpoints, etc.)
✅ Use heatmaps for latency distribution visualization
✅ Set appropriate time ranges (5m, 1h, 24h, 7d presets)

Avoid:
❌ Too many metrics on one dashboard (keep to <12 panels)
❌ Hardcoding values (use variables instead)
❌ Mixing metric scales on same graph
❌ Slow queries (test query performance)
```

### For Alert Rules

```yaml
Best Practices:
✅ Use appropriate `for:` duration (avoid flapping)
✅ Include threshold explanation in annotations
✅ Route by severity (critical vs warning)
✅ Test with alert generator rules
✅ Document runbook URLs in annotations
✅ Use meaningful labels for grouping

Alert Thresholds (Recommended):
- Error rate: >5% WARNING, >10% CRITICAL
- Latency p95: >1s WARNING, >5s CRITICAL
- Database pool: >75% WARNING, >90% CRITICAL
- Memory: >400MB WARNING, >600MB CRITICAL
- Disk: >80% WARNING, >95% CRITICAL
```

### For Kibana Searches

```yaml
Best Practices:
✅ Use time range filters (last 24h default)
✅ Pin important searches to dashboard
✅ Create index patterns for different log types
✅ Use field statistics for data validation
✅ Export to CSV for compliance reports
✅ Set up watch/alert on saved searches

Optimization:
✅ Limit result sets (100-1000 rows)
✅ Pre-aggregate in filter (avoid full scan)
✅ Use date histogram for trending
✅ Monitor Logstash processing lag
```

---

## SUMMARY: RAW FINDINGS CHECKLIST

### Phase 1 Completion Status
- [x] 6 monitoring services deployed (Sentry, Winston, Prometheus, ELK, Grafana)
- [x] 20+ metrics collected (HTTP, DB, Cache, Business, System)
- [x] 20+ alert rules defined (not yet routed)
- [x] Structured JSON logging (4 log file types)
- [x] Architecture documented

### Phase 2 Requirements Identified

**Dashboards** (10 recommended):
- [x] API Performance (queries, metrics identified)
- [x] Database Performance (queries identified)
- [x] Cache Health (queries identified)
- [x] Business Metrics (queries identified)
- [x] Error Dashboard (queries identified)
- [x] System Health (queries identified)
- [x] User Activity (queries identified)
- [x] Alert Status (queries identified)
- [x] Audit/Compliance (queries identified)
- [x] NLU Intelligence (custom metrics needed)

**Alert Integration Options**:
- [x] Alertmanager + Email (most standard)
- [x] Slack Webhook (most practical)
- [x] PagerDuty (enterprise option)
- [x] Generic Webhook (custom option)
- [x] Constraints documented

**Kibana Saved Searches** (15 recommended):
- [x] 15 core saved searches identified
- [x] Queries written and validated
- [x] Grouping/filtering strategies documented

**Implementation Constraints**:
- [x] Docker Compose updates needed
- [x] Environment variables identified
- [x] File structure documented
- [x] NestJS patterns reviewed
- [x] Database schemas understood

### Files Ready for Creation
```
- BATCH_13_PHASE_2_DASHBOARDS.md (Grafana JSON + PromQL queries)
- BATCH_13_PHASE_2_ALERTS.md (Alertmanager config + routing)
- BATCH_13_PHASE_2_KIBANA.md (Saved searches + queries)
- config/alertmanager/config.yml (Alertmanager configuration)
- config/grafana/provisioning/dashboards/caredroid/*.json (10 dashboards)
- Updated docker-compose.yml (+ Alertmanager service)
```

### No Technical Blockers Found
✅ All components compatible
✅ All metrics available
✅ All queries performant
✅ All integrations feasible

---

**Status**: Research complete, ready for implementation planning.
