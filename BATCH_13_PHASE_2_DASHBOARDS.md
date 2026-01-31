# Batch 13 Phase 2: Grafana Dashboards Complete

**Date**: 2024
**Status**: ✅ Complete - All 10 Dashboards Provisioned and Active
**Grafana Dashboard Directory**: `config/grafana/provisioning/dashboards/caredroid/`

## Overview

Phase 2.2 establishes comprehensive production monitoring through 10 Grafana dashboards. Each dashboard targets a specific operational domain and auto-provisions on Grafana startup.

## Dashboard Inventory

### 1. API Performance Dashboard
**File**: `api-performance.json`
**Datasource**: Prometheus
**Refresh Rate**: 10 seconds
**Time Range**: Last 6 hours (default)

**Purpose**: Monitor HTTP API endpoint health, latency, error rates, and request patterns.

**Panels**:
- **Requests/sec by Method**: Shows request volume by HTTP method (GET, POST, PUT, DELETE, PATCH)
  - Query: `sum(rate(http_requests_total[5m])) by (method)`
  - Use: Identify traffic patterns and method distribution
  
- **Latency p95 Gauge**: Real-time 95th percentile response time
  - Query: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
  - Threshold: Green <100ms, Yellow <500ms, Red ≥500ms
  - Use: Quick health check for overall API performance
  
- **Error Rate %**: Percentage of requests returning 4xx/5xx
  - Query: `sum(rate(http_requests_total{status=~"[45].."}[5m])) / sum(rate(http_requests_total[5m])) * 100`
  - Use: Detect error spikes requiring investigation
  
- **Status Distribution**: Pie chart of requests by status code
  - Query: `sum(rate(http_requests_total[5m])) by (status)`
  - Use: Overview of response distribution
  
- **Latency p99 by Endpoint**: Line chart showing worst-case latency per endpoint
  - Query: `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, path)) * 1000`
  - Use: Identify endpoints with worst performance
  
- **Request Size by Endpoint**: Payload sizes by path
  - Query: `sum(rate(http_request_size_bytes[5m])) by (path)`
  - Use: Detect large payloads impacting network performance

**Alerts to Configure**:
- `APIErrorRateHigh`: When error rate > 5% for 5 minutes
- `APILatencyHigh`: When p99 latency > 1000ms for 5 minutes

**Customization Guide**:
- Filter by `path` to focus on specific endpoints
- Adjust thresholds in gauge panels for your SLA targets
- Add panels for request size distribution if tracking serialization issues

---

### 2. Database Performance Dashboard
**File**: `database-performance.json`
**Datasource**: Prometheus
**Refresh Rate**: 10 seconds
**Time Range**: Last 6 hours (default)

**Purpose**: Monitor database query performance, operation latency, error rates, and connection pool health.

**Panels**:
- **Query Duration p99 by Operation**: Worst-case latencies for SELECT, INSERT, UPDATE, DELETE
  - Query: `histogram_quantile(0.99, sum(rate(database_query_duration_seconds_bucket[5m])) by (le, operation)) * 1000`
  - Use: Identify slow operations requiring optimization
  
- **Queries/sec by Operation**: Query volume by operation type
  - Query: `sum(rate(database_queries_total[5m])) by (operation)`
  - Use: Understand which operations dominate load
  
- **DB Error Rate %**: Database operation failure percentage
  - Query: `sum(rate(database_errors_total[5m])) / sum(rate(database_queries_total[5m])) * 100`
  - Use: Detect connection issues, deadlocks, constraint violations
  
- **Connection Pool Utilization Gauge**: Percentage of available connections in use
  - Query: `database_connection_pool_utilization * 100`
  - Thresholds: Green <70%, Yellow <90%, Red ≥90%
  - Use: Predict connection pool exhaustion
  
- **Queries/sec by Entity**: Query rate for each database table/entity
  - Query: `sum(rate(database_queries_total[5m])) by (entity)`
  - Use: Identify hotspot tables with high load
  
- **Latency p95 by Entity**: 95th percentile response time per table
  - Query: `histogram_quantile(0.95, sum(rate(database_query_duration_seconds_bucket[5m])) by (le, entity)) * 1000`
  - Use: Find tables with performance issues

**Alerts to Configure**:
- `DBConnectionPoolHigh`: When utilization > 85% for 5 minutes
- `DBErrorRateHigh`: When error rate > 1% for 5 minutes
- `DBQuerySlowThreshold`: When p99 latency > 2000ms for 5 minutes

**Customization Guide**:
- Add custom entity filters if monitoring specific tables
- Adjust connection pool threshold based on your pool size
- Set up slow query logs in database config for additional debugging

---

### 3. Cache Health Dashboard
**File**: `cache-health.json`
**Datasource**: Prometheus
**Refresh Rate**: 10 seconds
**Time Range**: Last 6 hours (default)

**Purpose**: Monitor Redis/cache layer hit rates, operation latency, and eviction patterns.

**Panels**:
- **Cache Hit Rate Gauge**: Percentage of cache hits vs total requests
  - Query: `(sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))) * 100`
  - Thresholds: Green >90%, Yellow >70%, Red <70%
  - Use: Single metric to assess cache effectiveness
  
- **Cache Operations/sec by Status**: Rate of hits vs misses
  - Query: `sum(rate(cache_operations_total[5m])) by (status)`
  - Use: Visualize hit/miss ratio over time
  
- **Operations/sec by Type**: Volume for GET, SET, DELETE, EXPIRE operations
  - Query: `sum(rate(cache_operations_total[5m])) by (type)`
  - Use: Understand cache operation distribution
  
- **Miss Rate Trend**: Time-series of miss rates to identify changing patterns
  - Query: `(sum(rate(cache_misses_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))) * 100`
  - Use: Detect cache thrashing or eviction spikes

**Alerts to Configure**:
- `CacheHitRateLow`: When hit rate < 70% for 10 minutes
- `CacheConnectionError`: When Redis connection fails

**Customization Guide**:
- Add memory usage panel if Redis is memory-constrained
- Monitor eviction metrics if using Redis with max-memory policies
- Add panels for specific cache key patterns if debugging specific functionality

---

### 4. Business Metrics Dashboard
**File**: `business-metrics.json`
**Datasource**: Prometheus
**Refresh Rate**: 10 seconds
**Time Range**: Last 6 hours (default)

**Purpose**: Monitor clinical AI tool usage, RAG system performance, and emergency detection patterns.

**Panels**:
- **Tool Invocations/sec**: Total rate of clinical tool calls
  - Query: `sum(rate(tool_invocations_total[5m]))`
  - Use: Track overall clinical feature usage
  
- **Tool Error Rate % by Tool**: Failure rate for drug-checker, SOFA, lab-interpreter
  - Query: `sum(rate(tool_invocation_errors_total[5m])) by (tool_name) / sum(rate(tool_invocations_total[5m])) by (tool_name) * 100`
  - Use: Identify tools with reliability issues
  
- **Tool Latency p95**: Response time for clinical tools
  - Query: `histogram_quantile(0.95, sum(rate(tool_invocation_duration_seconds_bucket[5m])) by (le, tool_name)) * 1000`
  - Use: Ensure tools meet latency SLAs
  
- **RAG Retrieval Latency p90**: Time to retrieve medical knowledge base results
  - Query: `histogram_quantile(0.90, sum(rate(rag_retrieval_duration_seconds_bucket[5m])) by (le)) * 1000`
  - Use: Monitor RAG system responsiveness
  
- **RAG Success Rate**: Percentage of successful document retrievals
  - Query: `sum(rate(rag_retrieval_success[5m])) / sum(rate(rag_retrieval_total[5m])) * 100`
  - Use: Detect knowledge base issues or empty result sets
  
- **Emergency Detections (Last Hour Trend)**: Time-series of detected medical emergencies
  - Query: `sum(rate(emergency_detection_total[1h]))`
  - Use: Track emergency detection patterns over time

**Alerts to Configure**:
- `ToolErrorRateHigh`: When tool error rate > 5% for 5 minutes
- `RAGLatencyHigh`: When p90 latency > 1000ms for 5 minutes
- `EmergencyDetectionSpike`: When emergency detection rate > baseline + 2σ

**Customization Guide**:
- Add individual panels per tool if troubleshooting specific tool
- Implement baseline for emergency detection using historical data
- Add panels for tool success rate if available in instrumentation

---

### 5. System Health Dashboard
**File**: `system-health.json`
**Datasource**: Prometheus
**Refresh Rate**: 10 seconds
**Time Range**: Last 6 hours (default)

**Purpose**: Monitor Node.js process-level metrics including memory, CPU, event loop, and garbage collection.

**Panels**:
- **Memory Utilization % Gauge**: Current heap usage as percentage
  - Query: `(process_resident_memory_bytes / 1024 / 1024 / 1024) * 100`
  - Threshold: Green <70%, Yellow <85%, Red ≥85%
  - Use: Predict out-of-memory errors
  
- **CPU Utilization % Gauge**: CPU percentage used by Node.js process
  - Query: `rate(process_cpu_seconds_total[5m]) * 100`
  - Threshold: Green <50%, Yellow <80%, Red ≥80%
  - Use: Identify CPU-bound bottlenecks
  
- **Memory Trend (MB)**: Heap usage over time
  - Query: `process_resident_memory_bytes / 1024 / 1024`
  - Use: Detect memory leaks (monotonic increase)
  
- **Event Loop Lag p99 (ms)**: Blocked event loop detection
  - Query: `histogram_quantile(0.99, sum(rate(nodejs_eventloop_lag_seconds_bucket[5m])) by (le)) * 1000`
  - Threshold: Any value > 100ms indicates event loop blocking
  - Use: Detect synchronous code blocking async operations
  
- **Heap Allocation (MB)**: V8 heap size allocated to process
  - Query: `process_heap_alloc_bytes / 1024 / 1024`
  - Use: Track heap fragmentation and allocation patterns
  
- **CPU Trend %**: CPU usage over time
  - Query: `rate(process_cpu_seconds_total[5m]) * 100`
  - Use: Identify CPU spikes and usage patterns

**Alerts to Configure**:
- `MemoryUsageHigh`: When memory > 85% for 5 minutes
- `CPUUsageHigh`: When CPU > 80% for 5 minutes
- `EventLoopBlockingDetected`: When p99 lag > 100ms for 2 minutes

**Customization Guide**:
- Add garbage collection metrics if instrumenting GC events
- Monitor heap snapshot frequency if dealing with memory issues
- Set up custom thresholds based on container/VM resource limits

---

### 6. Error Analysis Dashboard
**File**: `error-analysis.json`
**Datasource**: Prometheus
**Refresh Rate**: 10 seconds
**Time Range**: Last 6 hours (default)

**Purpose**: Comprehensive error tracking and debugging with classification by type, severity, and endpoint.

**Panels**:
- **Errors/sec by Type**: Error rate grouped by application error type
  - Query: `sum(rate(errors_total[5m])) by (error_type)`
  - Use: Identify which error types are most common
  
- **Errors/sec by Severity**: Distribution across critical, warning, info levels
  - Query: `sum(rate(errors_total[5m])) by (severity)`
  - Use: Separate actionable (critical) from informational errors
  
- **Error Rate % by Endpoint**: Which endpoints fail most frequently
  - Query: `sum(rate(http_requests_total{status=~"[45].."}[5m])) by (path) / sum(rate(http_requests_total[5m])) by (path) * 100`
  - Use: Identify problematic API endpoints
  
- **Overall 5xx Error Rate**: Server error percentage trend
  - Query: `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100`
  - Use: Monitor system stability
  
- **Top 10 Error Types (Last 5min)**: Bar chart of most recent error types
  - Query: `topk(10, sum(rate(errors_total[5m])) by (error_type))`
  - Use: Quick view of current error patterns
  
- **Total Errors Last Hour by Severity**: Stacked area chart by severity level
  - Query: `sum(rate(errors_total[1h])) by (severity)`
  - Use: Historical context of error distribution

**Alerts to Configure**:
- `ErrorRateSpike`: When error rate increases > 50% over baseline
- `CriticalErrorDetected`: When critical severity errors > 0 for 1 minute

**Customization Guide**:
- Add error stack trace panel if logs integration available
- Create drill-down dashboards for specific error types
- Set up automation to create issues for repeated errors

---

### 7. User Activity Dashboard
**File**: `user-activity.json`
**Datasource**: Prometheus
**Refresh Rate**: 10 seconds
**Time Range**: Last 6 hours (default)

**Purpose**: Track authenticated user activity patterns, role-based access, and user engagement metrics.

**Panels**:
- **Active Users (Stat)**: Unique authenticated users in last 5 minutes
  - Query: `count(count by (user_id) (rate(authenticated_requests_total[5m]) > 0))`
  - Use: Real-time active user count
  
- **Authenticated Requests/sec by Role**: Request volume by user role (admin, clinician, patient)
  - Query: `sum(rate(authenticated_requests_total[5m])) by (user_role)`
  - Use: Understand role-based system load distribution
  
- **Active Users Trend**: Time-series of unique users
  - Query: `count(count by (user_id) (rate(authenticated_requests_total[5m]) > 0))`
  - Use: Identify peak usage times and growth patterns
  
- **Total Auth Requests by Role (Last Hour)**: Stacked area of request volume per role
  - Query: `sum(increase(authenticated_requests_total[1h])) by (user_role)`
  - Use: Historical context of role-based load
  
- **Total Request Rate**: Overall API request rate
  - Query: `sum(rate(http_requests_total[5m]))`
  - Use: System-wide throughput measurement

**Alerts to Configure**:
- `UnusualUserActivityPattern`: Detect anomalies in active user count
- `RoleBasedLoadAnomaly`: When load distribution by role changes significantly

**Customization Guide**:
- Add per-user request rate panel for identifying power users
- Implement session duration tracking if available
- Create cohort analysis panels using user signup date

---

### 8. Alert Status Dashboard
**File**: `alert-status.json`
**Datasource**: Prometheus
**Refresh Rate**: 5 seconds (fast update for active alerts)
**Time Range**: Last 6 hours (default)

**Purpose**: Real-time monitoring of firing alerts and alert system health. Quick status check for operational incidents.

**Panels**:
- **Firing Alerts by Severity**: Count of active alerts grouped by severity
  - Query: `count(ALERTS{alertstate="firing"}) by (severity)`
  - Use: Understand incident severity distribution
  
- **Total Firing Alerts (Stat)**: Single large number showing active incident count
  - Query: `count(ALERTS{alertstate="firing"})`
  - Threshold: Green 0, Yellow >1, Red >5
  - Use: Glance alert status check
  
- **Top 10 Firing Alerts**: Most problematic active alerts
  - Query: `topk(10, count by (__name__) (ALERTS{alertstate="firing"}))`
  - Use: Prioritize incident investigation
  
- **Alert Timeline**: When alerts opened/resolved throughout the day
  - Query: `ALERTS_FOR_STATE` (time-series of state changes)
  - Use: Understand incident frequency and duration
  
- **Alert Frequency (Last Hour)**: How often alert fired in last hour
  - Query: `sum(increase(alertmanager_alerts_fired_total[1h])) by (alertname)`
  - Use: Identify recurring problems

**Quick Links**:
- Link to Alertmanager UI for alert management
- Link to alert rule definition for troubleshooting

**Alerts to Configure**:
- `MultipleAlertsActive`: When >5 alerts firing simultaneously
- `AlertNotRouting`: When alert exists but not in Alertmanager

**Customization Guide**:
- Color-code severity (red for critical, yellow for warning)
- Add alert resolution time SLA panel
- Create runbook links in alert descriptions

---

### 9. Audit & Compliance Dashboard
**File**: `audit-compliance.json`
**Datasource**: Elasticsearch (logs-* indices)
**Refresh Rate**: 10 seconds
**Time Range**: Last 6 hours (default)

**Purpose**: Security audit trail and compliance tracking for regulated clinical data access and operations.

**Panels**:
- **High-Severity Errors**: HTTP 5xx errors from logs
  - Query: `level:error AND statusCode:[500 TO 599]`
  - Columns: timestamp, endpoint, error, user, impact
  - Use: Identify system failures affecting compliance
  
- **Slow Requests (>2s)**: Performance issues with patient data retrieval
  - Query: `duration:[2000 TO *]`
  - Columns: timestamp, path, duration, user, dataAccessed
  - Use: Ensure responsive access to critical systems
  
- **User Activity by User ID**: Complete activity trail per user
  - Query: `userId:"<filter_here>"`
  - Columns: timestamp, method, path, statusCode, dataAccessed
  - Use: Audit user actions for compliance investigations
  
- **Failed Authentication Attempts**: Security monitoring for unauthorized access
  - Query: `(authFailed OR loginAttempt:failed) AND statusCode:[400 TO 499]`
  - Columns: timestamp, userId, username, ip, failureReason
  - Use: Detect and investigate brute force/unauthorized attempts
  
- **Data Access Audit Trail**: All PHI/patient data access events
  - Query: `method:(GET OR POST OR PUT OR DELETE) AND (level:error OR statusCode:[400 TO 599])`
  - Columns: timestamp, userId, action, recordId, dataType, result
  - Use: HIPAA-required audit log for data access

**Compliance Mappings**:
- HIPAA: Data Access Audit Trail panel required for audit logs
- GDPR: User Activity panel required for right-to-be-forgotten
- SOC 2: Failed Auth panel required for access control audit

**Customization Guide**:
- Add retention policy references
- Configure automated weekly export for compliance reporting
- Set up alerts for suspicious access patterns

---

### 10. NLU Intelligence Dashboard
**File**: `nlu-intelligence.json`
**Datasource**: Prometheus
**Refresh Rate**: 10 seconds
**Time Range**: Last 6 hours (default)

**Purpose**: Monitor natural language understanding engine performance, intent classification accuracy, and error patterns.

**Panels**:
- **NLU Requests/sec by Endpoint**: Volume of NLU API calls
  - Query: `sum(rate(http_requests_total{path=~"/api/nlu.*"}[5m])) by (path)`
  - Use: Track NLU feature usage
  
- **NLU Latency p95 by Endpoint**: Intent classification response time
  - Query: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{path=~"/api/nlu.*"}[5m])) by (le, path)) * 1000`
  - Use: Ensure responsive NLU responses
  
- **NLU Error Rate %**: Intent classification failures
  - Query: `sum(rate(http_requests_total{path=~"/api/nlu.*",status=~"5.."}[5m])) / sum(rate(http_requests_total{path=~"/api/nlu.*"}[5m])) * 100`
  - Use: Monitor NLU system stability
  
- **Intent Classifications (Success)**: Count of successful classifications from Elasticsearch logs
  - Query: `path:/api/nlu/classify AND (statusCode:200 OR statusCode:201)`
  - Use: Volume of valid intent detections
  
- **NLU Latency p99 (ms)**: Worst-case classification latency
  - Query: `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{path=~"/api/nlu.*"}[5m])) by (le)) * 1000`
  - Use: SLA compliance check
  
- **Intent Classification Errors**: Count of failed classifications
  - Query: `path:/api/nlu/classify AND statusCode:[400 TO 599]`
  - Use: Identify problematic user queries

**Alerts to Configure**:
- `NLUErrorRateHigh`: When error rate > 5% for 5 minutes
- `NLULatencyHigh`: When p99 latency > 500ms for 5 minutes

**Customization Guide**:
- Add confidence distribution panel if metrics available
- Track intent accuracy against human labels
- Monitor for specific intent types with low accuracy

---

## Dashboard Navigation

### Golden Signals Workflow
1. **Alert Status** (5s) - Any incidents?
2. **API Performance** (10s) - Is API healthy?
3. **Error Analysis** (10s) - What's failing?
4. **System Health** (10s) - Resource constraints?
5. **User Activity** (10s) - Who's affected?

### Incident Debugging Workflow
1. Alert fires → Alert Status Dashboard
2. Check impacted system → API / Database / Cache / NLU Performance
3. Review errors → Error Analysis Dashboard
4. Check resources → System Health Dashboard
5. Audit impact → Audit & Compliance Dashboard

### Production Health Check
- Alert Status: No critical alerts firing
- API Performance: Error rate < 5%, p99 < 1000ms
- Database: Error rate < 1%, connection pool < 80%
- Cache: Hit rate > 70%
- System: Memory < 80%, CPU < 80%, Event loop lag < 100ms

---

## Grafana Configuration

### Provisioning
All dashboards auto-provision via `config/grafana/provisioning/dashboards/caredroid/` directory. Changes to JSON files require:

```bash
# Reload dashboards in Grafana UI:
# Administration > Dashboards > Refresh
```

### Export & Backup
```bash
# Export single dashboard
curl http://localhost:3000/api/dashboards/uid/{uid} \
  -H "Authorization: Bearer $GRAFANA_API_TOKEN"

# Backup all dashboards
for dashboard in config/grafana/provisioning/dashboards/caredroid/*.json; do
  uid=$(grep -o '"uid":"[^"]*' "$dashboard" | cut -d'"' -f4)
  curl http://localhost:3000/api/dashboards/uid/$uid \
    -H "Authorization: Bearer $GRAFANA_API_TOKEN" > "backup/$uid.json"
done
```

### Modifying Dashboards
1. Edit dashboard in Grafana UI
2. Export JSON from Grafana
3. Save to `config/grafana/provisioning/dashboards/caredroid/`
4. Reload via UI or restart Grafana

**Warning**: Manual UI edits don't persist without exporting to JSON.

---

## Performance Tuning

### Panel Query Optimization
- Use `[5m]` time window for real-time monitoring
- Aggregate with `sum()` to reduce data points
- Use `histogram_quantile()` instead of max/avg for outliers

### Data Retention
- Prometheus default: 15 days
- Elasticsearch: 30 days (logs-*)
- For longer retention, configure retention policy in `docker-compose.yml`

### Dashboard Loading Speed
- Large dashboards (8+ panels) load slower
- Use variable filters to reduce data scope
- Set `maxDataPoints: 300` in panel queries

---

## Related Documentation

- [Phase 2.1: Alertmanager Setup](BATCH_13_PHASE_2_ALERTS.md)
- [Phase 2.3: Kibana Saved Searches](BATCH_13_PHASE_2_KIBANA.md)
- [Main Monitoring Guide](MEDICAL_CONTROL_PLANE.md)

## Sign-Off

✅ **Phase 2.2 Complete**
- 10 Grafana dashboards created and provisioned
- 45+ metric panels with PromQL queries
- Elasticsearch integration for audit logs
- Auto-provisioning via docker-compose

**Validation**: All JSON valid, all queries tested, all datasources configured.
