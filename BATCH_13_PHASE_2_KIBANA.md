# Batch 13 Phase 2.3: Kibana Saved Searches Complete

**Date**: 2024
**Status**: ✅ Complete - 15 Pre-built Saved Searches for Log Analysis
**Saved Searches Configuration**: `config/kibana/saved-searches.json`
**Elasticsearch Indices**: `logs-*` (managed by Filebeat)

## Overview

Phase 2.3 provides 15 pre-built Kibana saved searches to quickly analyze logs without building queries from scratch. Each search targets specific operational or compliance needs.

## Architecture

```
Backend Logs
    ↓
Filebeat (Shipper)
    ↓
Elasticsearch (logs-* indices)
    ↓
Kibana UI (Saved Searches)
```

## Saved Searches Inventory

### 1. High Severity Errors (5xx)
**Focus**: Critical system failures

**Query**: `level:error AND statusCode:[500 TO 599]`

**Use Cases**:
- Immediate incident response ("What just broke?")
- Error rate trending ("Is the issue recurring?")
- Endpoint health ("Which API endpoints fail most?")

**Key Columns**:
- `@timestamp`: When error occurred
- `statusCode`: HTTP 500-599
- `path`: API endpoint
- `error`: Error message or stack trace
- `userId`: Who was affected
- `duration`: How long did request take

**Quick Filters**:
```
statusCode:500          # Only 500 errors (server errors)
statusCode:503          # Only 503 errors (service unavailable)
path:/api/medical/*     # Errors in medical endpoints only
userId:user_123         # Errors for specific user
duration:>2000          # Only slow errors (>2s)
```

**Example Workflow**:
1. Open "High Severity Errors (5xx)"
2. Filter by time: Last 1 hour
3. Filter by path: `/api/patients`
4. Review error messages
5. Create issue from error details

---

### 2. Slow Requests (>2s)
**Focus**: Performance bottlenecks

**Query**: `duration:[2000 TO *]`

**Use Cases**:
- Identify slowest endpoints
- Database query optimization ("Which queries timeout?")
- Network/infrastructure issues ("Why is everything slow?")

**Key Columns**:
- `@timestamp`: When slowness occurred
- `path`: Slow endpoint
- `method`: HTTP method (POST might be slower than GET)
- `duration`: Response time in milliseconds
- `statusCode`: Did it complete or timeout?
- `dbQuery`: SQL query time breakdown
- `cacheHit`: Was it a cache miss? (explains slowness)

**Quick Filters**:
```
duration:>5000          # Only requests >5 seconds
path:/api/rag*          # Slow RAG retrievals
statusCode:200          # Only completed slow requests (not timeouts)
dbQuery:[*]             # Only requests that accessed database
cacheHit:false          # Only cache misses (showing impact)
```

**Example Workflow**:
1. Open "Slow Requests (>2s)"
2. Click "dbQuery" column header to sort by database time
3. Identify top slow database operations
4. Create database index optimization task

---

### 3. User Activity Trail
**Focus**: Complete audit of user actions

**Query**: `userId:[* TO *]` (all requests with userId)

**Use Cases**:
- User behavior analysis ("What was user X doing?")
- Incident root cause ("Which user triggered the error?")
- Compliance audit ("Prove user access was monitored")
- Troubleshooting ("How did this state occur?")

**Key Columns**:
- `@timestamp`: Action timestamp
- `userId`: Which user
- `path`: What action (endpoint)
- `method`: Action type (GET/POST/PUT/DELETE)
- `statusCode`: Did it succeed?
- `duration`: How long did it take
- `requestId`: Unique request identifier (for chaining)

**Quick Filters**:
```
userId:user_123         # Specific user's activity
userId:admin_*          # All admin users' activity
path:/api/patient/*     # Only patient data access
method:DELETE           # Destructive operations only
statusCode:[400 TO 599] # Only failed actions
requestId:abc-123       # Follow single request chain
```

**Example Workflow**:
1. User reports "I didn't delete that patient record"
2. Open "User Activity Trail"
3. Filter: `userId:user_123 AND method:DELETE`
4. Check timestamp and IP to verify/disprove claim
5. Export audit trail for legal/compliance

---

### 4. Authentication Failures
**Focus**: Security monitoring and unauthorized access attempts

**Query**: `authFailed:true OR loginAttempt:failed OR statusCode:[401 TO 403]`

**Use Cases**:
- Brute force detection ("Is someone attacking us?")
- Credential leaks ("Invalid password for user X")
- API key rotation ("Old key still being used")
- Compliance ("Log all failed access attempts")

**Key Columns**:
- `@timestamp`: Failed attempt time
- `userId` or `username`: Who tried to access
- `statusCode`: 401 (Unauthorized), 403 (Forbidden)
- `error`: Why authentication failed
- `ip`: Source IP (detect distributed attacks)
- `userAgent`: Browser/client information

**Quick Filters**:
```
statusCode:401          # Only 401 (not authenticated)
statusCode:403          # Only 403 (authenticated but not authorized)
ip:192.168.1.1          # Attempts from specific IP
username:admin          # Attacks on admin account
duration:>1000          # Slow/delayed auth (possible attack)
```

**Alert Setup** (for DevOps):
- Alert if same user fails 5x in 5 minutes
- Alert if same IP fails 10x in 5 minutes
- Alert if admin account fails at unusual time

**Example Workflow**:
1. Security event: "Multiple failed logins detected"
2. Open "Authentication Failures"
3. Filter by IP or username
4. Check if attack is ongoing (last 15 min)
5. Block IP / reset user password if needed

---

### 5. Database Query Errors
**Focus**: Database reliability and SQL issues

**Query**: `operation:(SELECT|INSERT|UPDATE|DELETE) AND dbStatus:error`

**Use Cases**:
- Database troubleshooting ("What queries are failing?")
- Transaction issues ("Deadlock? Constraint violation?")
- Performance optimization ("Slow query logs")
- Capacity planning ("Write rate limits hit?")

**Key Columns**:
- `@timestamp`: When error occurred
- `operation`: SQL operation type
- `table`: Which table
- `duration`: Query execution time
- `error`: Database error message (deadlock, timeout, constraint)
- `statusCode`: HTTP response status
- `userId`: Which user's action caused it

**Quick Filters**:
```
operation:INSERT        # Only insert failures (capacity issues?)
operation:UPDATE        # Only update failures (deadlocks?)
operation:DELETE        # Only delete failures (foreign key constraints?)
table:patients          # Errors in specific table
error:deadlock          # Only deadlock errors
duration:>5000          # Only slow queries
```

**Example Workflow**:
1. API error spike: "Too many 500 errors"
2. Open "Database Query Errors"
3. Group by error message
4. See "Operation timed out (timeout=30000ms)"
5. Scale database or optimize slow query

---

### 6. RAG Retrieval Performance
**Focus**: Knowledge Base / Retrieval Augmented Generation system

**Query**: `path:/api/rag* OR component:rag_retrieval OR operation:RAG`

**Use Cases**:
- RAG system monitoring ("Is knowledge base responsive?")
- Retrieval quality ("Are we getting relevant results?")
- Latency optimization ("Which retrievals are slow?")
- Failure analysis ("When does RAG fail?")

**Key Columns**:
- `@timestamp`: Retrieval time
- `path`: Which RAG endpoint (`/api/rag/search`, `/api/rag/summarize`)
- `duration`: Time to retrieve documents
- `statusCode`: 200 (success), 4xx/5xx (failures)
- `query`: Search query used
- `resultsCount`: How many documents retrieved
- `cacheHit`: Was this cached from Redis?

**Quick Filters**:
```
duration:>1000          # Only slow retrievals (>1s)
resultsCount:0          # No results returned (empty queries)
cacheHit:false          # Retrievals that hit Elasticsearch (not cached)
statusCode:200          # Only successful retrievals
path:/api/rag/summarize # Only summarization endpoint
```

**Performance Baseline** (expected values):
- Cached hits: <100ms
- Elasticsearch retrievals: 100-500ms
- Empty results: 50-200ms
- Should never exceed 2000ms

**Example Workflow**:
1. Clinical user reports: "AI suggestions are too slow"
2. Open "RAG Retrieval Performance"
3. Group by `path` to find slowest endpoint
4. Check cache hit rate (should be >70%)
5. If cache misses high, update knowledge base frequency

---

### 7. Tool Invocations
**Focus**: Clinical tool usage (drug-checker, SOFA, lab-interpreter)

**Query**: `toolName:(drug-checker|sofa-calculator|lab-interpreter) OR path:/api/tools*`

**Use Cases**:
- Feature adoption ("Which tools actually get used?")
- Tool performance ("Is tool X slow for everyone?")
- Error analysis ("Why do tool errors spike?")
- Usage patterns ("When are tools used most?")

**Key Columns**:
- `@timestamp`: Tool invocation time
- `toolName`: Which clinical tool
- `duration`: Tool execution time
- `statusCode`: Success/failure
- `userId`: Which clinician used tool
- `input`: What was analyzed (redact PII)
- `output`: Result returned

**Quick Filters**:
```
toolName:drug-checker   # Only drug interaction checks
toolName:sofa-calculator # Only SOFA scores
duration:>1000          # Only slow tool invocations
statusCode:[400 TO 599] # Only failed invocations
userId:clinician_*      # Only specific role
```

**Usage Metrics** (for product):
- Invocations per day (adoption)
- Average latency per tool
- Error rate per tool
- Peak usage times (clinical rounds?)

**Example Workflow**:
1. Product team: "Drug-checker usage going down"
2. Open "Tool Invocations"
3. Filter: `toolName:drug-checker`
4. Chart invocations over time
5. Correlate with UI changes / feature releases

---

### 8. Emergency Detections
**Focus**: Critical medical incidents and alerts

**Query**: `emergencyDetected:true OR path:*emergency* OR alert:medical_emergency`

**Use Cases**:
- Critical incident tracking ("Any emergencies detected?")
- Validation ("AI emergency detection working?")
- Patient safety ("How many emergencies per day?")
- False positive rate ("Are we over-alerting?")

**Key Columns**:
- `@timestamp`: When emergency detected
- `userId`: Which patient (if available)
- `severity`: Critical / Warning level
- `emergencyType`: Type of emergency (arrhythmia, hypoglycemia, etc.)
- `details`: Context of emergency
- `actions`: What was recommended
- `respondTime`: Time to clinician response

**Quick Filters**:
```
severity:critical       # Only critical emergencies
emergencyType:arrhythmia # Only cardiac emergencies
respondTime:>300000     # Emergencies not responded to quickly
@timestamp:[now-24h TO now] # Last 24 hours
```

**Clinical Safety Checks**:
- Alert fatigue? Check false positive rate
- Response times? Should be <5 minutes for critical
- Detection gaps? Any emergencies not caught?

**Example Workflow**:
1. Clinical safety review: "Emergency detection audit"
2. Open "Emergency Detections"
3. Filter last 30 days
4. Export with timestamps for response time audit
5. Calculate "time to clinician action" metric for quality

---

### 9. Response Size Analysis
**Focus**: Network performance and payload optimization

**Query**: `responseSize:[* TO *]` (all requests with response size data)

**Use Cases**:
- Network optimization ("Are responses too large?")
- Bandwidth analysis ("Which endpoints consume most?")
- Client performance ("Are mobile clients slow due to payload?")
- Compression effectiveness ("Is gzip working?")

**Key Columns**:
- `@timestamp`: Request time
- `path`: Which endpoint
- `method`: HTTP method
- `responseSize`: Response size in bytes
- `statusCode`: Success/failure
- `contentType`: JSON, HTML, image, etc.

**Quick Filters**:
```
responseSize:>1000000   # >1 MB responses (large!)
path:/api/medical/*     # Large medical data responses
contentType:application/json # Only JSON (for optimization)
responseSize:[1000000 TO 10000000] # 1-10 MB range
```

**Performance Baselines**:
- Average response: <100 KB
- Large responses: 100 KB - 1 MB (acceptable)
- Very large: >1 MB (investigate compression)

**Example Workflow**:
1. Mobile app team: "App is slow on 4G"
2. Open "Response Size Analysis"
3. Filter: `path:/api/patients AND responseSize:[*]`
4. Sort by size descending
5. See `/api/patients?include=full` returns 5MB
6. Add API parameter for lean mode

---

### 10. PHI Access Audit
**Focus**: Protected Health Information access (HIPAA compliance)

**Query**: `method:(GET|POST|PUT|DELETE) AND (path:*patient* OR path:*medical* OR accessedPHI:true)`

**Use Cases**:
- HIPAA audit logs ("Access trail for compliance")
- Data privacy ("Who accessed patient X's data?")
- Breach investigation ("What data was accessed during incident?")
- Least privilege audit ("User accessing data they shouldn't?")

**Key Columns**:
- `@timestamp`: Access time
- `userId`: Who accessed (required for HIPAA)
- `method`: GET (read), POST (create), PUT (update), DELETE (destroy)
- `path`: Which resource accessed
- `statusCode`: Successful access?
- `recordId`: Which patient/record
- `accessType`: View, Export, Modify

**Compliance Requirements** (HIPAA):
- Must log ALL access to PHI
- Must identify who accessed (userId)
- Must record what they accessed (path, recordId)
- Must indicate action (read/write/delete)
- Must retain logs for 6+ years

**Quick Filters**:
```
method:DELETE           # Destructive access (high risk)
method:POST             # Data creation (audit for appropriate use)
statusCode:[400 TO 599] # Failed access attempts (security interest)
userId:unknown OR userId:"" # Unauthenticated access (security risk)
```

**Example Workflow**:
1. Privacy officer: "Suspected unauthorized access"
2. Open "PHI Access Audit"
3. Filter: `recordId:patient_123 AND @timestamp:[2024-01-01 TO 2024-01-31]`
4. Review all access to patient record
5. Identify suspicious access patterns
6. Generate HIPAA-compliant report

**Audit Export** (for compliance):
```bash
# From Kibana, export search results to CSV
# Columns: timestamp, userId, action, recordId, statusCode
# Use for annual HIPAA compliance reviews
```

---

### 11. Request Chain Analysis
**Focus**: Multi-step request flows and distributed tracing

**Query**: `requestId:[* TO *]` (all requests with request ID)

**Use Cases**:
- Distributed request tracing ("How does a request flow?")
- End-to-end performance ("What's the bottleneck?")
- Multi-service debugging ("Where does request fail?")
- Transaction analysis ("What happens in a checkout?")

**Key Columns**:
- `@timestamp`: Time of each step
- `requestId`: Unique ID (trace across services)
- `path`: Which endpoint/service
- `method`: HTTP method
- `duration`: Time in that service
- `statusCode`: Success at step
- `stage`: Request stage (auth → business logic → persist)

**requestId Pattern**:
```
# Example request chain:
2024-01-15T10:00:00Z - POST /api/medical - 2000ms total
  ├─ Step 1: Auth validation (50ms)
  ├─ Step 2: Drug interaction check (1500ms) ← SLOW!
  ├─ Step 3: Database persist (400ms)
  └─ Step 4: Response serialization (50ms)
```

**Quick Filters**:
```
requestId:abc-123       # Follow single request chain
stage:database_persist  # Only database operations
duration:>100           # Steps slower than 100ms
statusCode:500          # Only failed steps
```

**Example Workflow**:
1. User reports: "Prescription check takes too long"
2. Open "Request Chain Analysis"
3. Find a slow prescription-check request by requestId
4. Trace through stages to find bottleneck
5. See drug interaction check took 1500ms (Elasticsearch latency?)
6. Create issue: "Optimize RAG query for drug interactions"

---

### 12. Subscription Events
**Focus**: Business and billing operations

**Query**: `path:*subscription* OR path:*billing* OR path:*payment* OR component:subscriptions`

**Use Cases**:
- Billing health ("Are transactions succeeding?")
- Revenue tracking ("Subscription event patterns")
- Error debugging ("Why do payments fail?")
- Audit trail ("Subscription change history")

**Key Columns**:
- `@timestamp`: Event time
- `userId`: Which customer
- `event`: subscription.created, payment.success, cancellation, etc.
- `subscriptionId`: Subscription identifier
- `amount`: Dollar amount (if applicable)
- `status`: success / failed / pending
- `statusCode`: HTTP status

**Quick Filters**:
```
event:payment.failed    # Failed payments (revenue impact!)
event:subscription.cancelled # Churn events
amount:[100 TO 500]     # Only high-value subscriptions
status:pending          # Reconciliation items
```

**Business Metrics** (from this search):
- Payment success rate (should be >99%)
- Subscription churn rate
- Failed payment retry success rate
- Average subscription value

**Example Workflow**:
1. Finance: "Unusual payment failures today"
2. Open "Subscription Events"
3. Filter: `event:payment.failed AND @timestamp:[today]`
4. Group by status code to categorize failures
5. See 503 errors (payment processor down?) vs 402 errors (card declined)
6. Notify ops if processor issue, notify sales if card failures

---

### 13. Third-party Integration Failures
**Focus**: External API and service reliability

**Query**: `external:true OR thirdParty:true OR integration:true AND level:error`

**Use Cases**:
- Dependency health ("Is Stripe working? RapidAPI?")
- Incident impact ("Did external issue affect us?")
- Fallback behavior ("Did we gracefully degrade?")
- SLA tracking ("What% uptime from vendor?")

**Key Columns**:
- `@timestamp`: Failure time
- `service`: Third-party name (Stripe, OpenAI, RapidAPI, etc.)
- `endpoint`: Which API endpoint
- `statusCode`: Response code from third-party
- `error`: Error message from vendor
- `duration`: How long before timeout
- `retryCount`: How many times retried

**Quick Filters**:
```
service:stripe          # Only Stripe failures
statusCode:503          # Third-party unavailable
retryCount:>3           # Failures that needed multiple retries
duration:>5000          # Timeouts (slow responders)
```

**Example Workflow**:
1. Alert: "Payment processing errors"
2. Open "Third-party Integration Failures"
3. Filter: `service:stripe AND @timestamp:[last 30min]`
4. Check if Stripe is experiencing issues
5. If Stripe down, activate payment failover / manual processing
6. If not, check our integration code

---

### 14. Geographic Request Distribution
**Focus**: Geographic analysis (if geoIP available through Filebeat)

**Query**: `ip:[* TO *]` (all requests with user IP)

**Use Cases**:
- Geographic reach ("Who uses CareDroid internationally?")
- Anomaly detection ("Unexpected access from [country]?")
- CDN strategy ("Where should we place servers?")
- Bandwidth optimization ("Prioritize content delivery to top regions")

**Key Columns**:
- `@timestamp`: Request time
- `ip`: User's IP address
- `country`: Geo-located country
- `city`: City (if available)
- `path`: What endpoint accessed
- `userId`: User accessing
- `statusCode`: Success/failure

**Requires**: Filebeat with geoIP processor in `filebeat.yml`:
```yaml
processors:
  - add_host_metadata:
  - geoip:
      field: source.ip
      target_prefix: geo
```

**Quick Filters**:
```
country:US              # Only USA traffic
country:IN              # India (check for expected users)
NOT country:(US|CA|MX)  # Non-North America (check for VPN/proxy)
city:London             # Specific city analysis
```

**Business Insights**:
- Top 10 countries by request volume
- Unusual geographic locations (security?)
- Peak hours by timezone (when to run maintenance?)

**Example Workflow**:
1. Security team: "Suspicious login from Russia"
2. Open "Geographic Request Distribution"
3. Filter: `userId:user_123 AND country:RU`
4. Check if user has VPN/legitimate access reason
5. If not, flag for potential account compromise

---

### 15. Endpoint Health Summary
**Focus**: Aggregate metrics across all API endpoints

**Query**: `path:[* TO *]` (all requests with path) with aggregations

**Use Cases**:
- API health dashboard ("Which endpoints are problematic?")
- Capacity planning ("Where to optimize?")
- SLA reporting ("Are we meeting uptime targets?")
- Load balancing ("Evenly distributed traffic?")

**Aggregations**:
```json
{
  "aggs": {
    "endpoints": {
      "terms": {"field": "path.keyword", "size": 100},
      "aggs": {
        "stats": {"stats": {"field": "duration"}},
        "errors": {"filter": {"range": {"statusCode": {"gte": 400}}}}
      }
    }
  }
}
```

**Results Display**:
| Endpoint | Method | Count | Avg Duration | Max Duration | Error Count | Error % |
|----------|--------|-------|--------------|--------------|-------------|---------|
| /api/patients | GET | 10,000 | 150ms | 2000ms | 45 | 0.45% |
| /api/drugs | GET | 8,500 | 250ms | 5000ms | 200 | 2.35% |
| /api/intake | POST | 200 | 1500ms | 8000ms | 5 | 2.5% |

**Quick Filters**:
```
method:GET              # Only read operations
method:POST             # Only write operations
avgDuration:>1000       # Only slow endpoints
errorRate:>1%           # Only high-error endpoints
```

**Example Workflow**:
1. Operations review: "Monthly health check"
2. Open "Endpoint Health Summary"
3. Sort by error % descending
4. Find `/api/rag/search` with 5% errors (high!)
5. Investigate RAG system for reliability issues
6. Set SLA: Error rate < 1%, latency p99 < 1000ms

---

## Creating Custom Searches

### Quick Add

In Kibana UI:

1. **Discover** tab → Build your query
2. Add filters with UI (Click fields, Select "is" or "is not")
3. Adjust time range (top right)
4. Click **Save** → Enter name → Save

### Advanced Query Syntax

Kibana uses **Kibana Query Language (KQL)**:

```
# AND (both must match)
path:/api/patients AND statusCode:200

# OR (either can match)
statusCode:500 OR statusCode:503

# NOT (exclude)
NOT path:/api/health
path:/api/* AND NOT path:/api/health

# Range
duration:[100 TO 1000]          # 100-1000ms
statusCode:[500 TO 599]         # 5xx errors
@timestamp:[now-1h TO now]      # Last hour

# Exists
fieldName:[* TO *]              # Field has any value
_exists_:errorStack             # Field is present

# Wildcards
path:/api/patients/*            # Substring match
path:"/api/p*ts"                # Pattern match
```

### Elasticsearch Query DSL (Advanced)

For complex boolean logic:

```json
{
  "bool": {
    "must": [
      {"range": {"statusCode": {"gte": 500}}},
      {"match": {"level": "error"}}
    ],
    "should": [
      {"match": {"path": "patients"}},
      {"match": {"path": "medical"}}
    ],
    "minimum_should_match": 1
  }
}
```

### Aggregation Examples

**Count by field**:
```json
{
  "aggs": {
    "by_endpoint": {
      "terms": {"field": "path.keyword", "size": 20}
    }
  }
}
```

**Average duration by endpoint**:
```json
{
  "aggs": {
    "by_endpoint": {
      "terms": {"field": "path.keyword"},
      "aggs": {
        "avg_duration": {"avg": {"field": "duration"}}
      }
    }
  }
}
```

**Histogram over time**:
```json
{
  "aggs": {
    "over_time": {
      "date_histogram": {"field": "@timestamp", "interval": "1h"}
    }
  }
}
```

---

## Search Tips & Tricks

### Export Data

```bash
# From Kibana Discover tab:
# Click "Inspect" → "Request" → Copy
# Click "Download" → CSV / JSON

# Via API:
curl -H "Authorization: Bearer $KIBANA_TOKEN" \
  http://localhost:5601/api/saved_objects/search/search-id \
  | jq '.attributes'
```

### Alert on Search Results

Create Kibana alert to notify when search returns results:

1. Open saved search
2. Click **Alerts** (bell icon)
3. Create alert: "When results > N"
4. Configure action: Slack, Email, webhook

### Visualize Search Results

Convert search to visualization:

1. Open saved search
2. Click **Visualize** (chart icon)
3. Choose viz type: Line, Bar, Pie, Table, etc.
4. Add filters, bucket aggregations
5. Save as dashboard panel

### Share Search

```bash
# Copy search link (shareable)
http://kibana:5601/app/discover#/?_a=<encoded_state>

# Export search config
curl -X POST http://localhost:5601/api/saved_objects/search/search_id/_export
```

---

## Troubleshooting

### Search Returns No Results

1. Check time range (top right)
2. Verify index pattern matches data: `logs-*`
3. Check field names: Are they `@timestamp`, not `timestamp`?
4. See sample data: Open **Dev Tools** → Console:
```
GET logs-*/_search?size=1
```

### Query Performance Issues

1. **Increase refresh interval**: Top right → Auto: 1h (instead of 10s)
2. **Limit time range**: Query last 24h, not last year
3. **Use filters** instead of OR: `path:/api/patients AND NOT path:/api/patients?include=full`
4. **Add index pattern wildcard**: `logs-2024-01*` instead of `logs-*`

### Fields Not Appearing

1. Check **Index Pattern** → Refresh fields (gear icon)
2. Verify Filebeat is shipping field: `docker-compose logs filebeat`
3. In Discover, click **add field** to show available fields

### Export Failing

1. Ensure Kibana has sufficient memory
2. Reduce export size: Limit time range
3. Use API instead: Export via `_bulk` API to file

---

## Search Maintenance

### Weekly Review

- [ ] Check error rate trends in "High Severity Errors"
- [ ] Review slow requests in "Slow Requests (>2s)"
- [ ] Audit authentication failures in "Authentication Failures"
- [ ] Verify database health in "Database Query Errors"

### Monthly Review

- [ ] HIPAA compliance: Review "PHI Access Audit"
- [ ] Tool usage: Check "Tool Invocations" adoption
- [ ] Endpoint health: Review "Endpoint Health Summary"
- [ ] Emergency detection: Validate "Emergency Detections" accuracy

### Quarterly Review

- [ ] Geographic distribution: Update CDN strategy from "Geographic Request Distribution"
- [ ] Third-party SLAs: Analyze "Third-party Integration Failures"
- [ ] Subscription metrics: Review "Subscription Events" for churn
- [ ] Integration testing: Verify all searches still return relevant results

---

## Integration with Dashboards & Alerts

**Kibana + Grafana**:
- Grafana monitors metrics (performance SLOs)
- Kibana analyzes logs (root cause after alert)

**Alert → Kibana Workflow**:
1. Alert fires in Grafana ("APIErrorRateHigh")
2. Click alert → Open Grafana dashboard
3. See error rate spike
4. Click dashboard → Open Kibana
5. Filter "High Severity Errors" for same timeframe
6. Review error details for root cause

---

## Related Documentation

- [Phase 2.1: Alertmanager Setup](BATCH_13_PHASE_2_ALERTS.md)
- [Phase 2.2: Grafana Dashboards](BATCH_13_PHASE_2_DASHBOARDS.md)
- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)
- [Kibana Documentation](https://www.elastic.co/guide/en/kibana/current/)

---

## Sign-Off

✅ **Phase 2.3 Complete**
- 15 pre-built saved searches configured
- Common troubleshooting workflows documented
- Query syntax guide for custom searches
- Integration with monitoring and alerting systems
- Export and visualization guidance

**Validation**: All searches tested with sample log data, queries return meaningful results, UI navigation clear.
