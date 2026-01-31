# Alert Runbook: HighErrorRate

**Alert Severity**: 🔴 **CRITICAL**  
**Module**: HTTP API  
**Dashboard Panels**: System-wide (all endpoints)  
**Related Metrics**: `http_requests_total` (error rate > 10% for 2+ minutes)

---

## What This Alert Means

The CareDroid API is experiencing critical failures. More than 10% of all HTTP requests are returning 5xx errors (server errors). Users cannot access the system properly. This is a service-critical issue requiring immediate mitigation.

---

## Quick Diagnosis (< 1 minute)

1. **Check Prometheus**: [HTTP Errors Graph](http://prometheus:9090/graph?g0.expr=sum(rate(http_requests_total{status=~"5.."}[5m]))%20%2F%20sum(rate(http_requests_total[5m]))&g0.tab=1)
2. **Ask**: Did we deploy backend code in last 5 minutes? OR Did database go down? OR Did external service fail?
3. **Check**: `docker-compose ps` - are all services running?

---

## Common Root Causes

### Root Cause 1: Recent Deployment Introduced Bug
- **Symptom**: Error rate jumped right after `docker-compose up -d --build backend`
- **Verification**: `git log --oneline -3 backend/` shows recent commits
- **Fix**: Rollback deployment

### Root Cause 2: Database Connection Lost
- **Symptom**: Errors like "ECONNREFUSED" or "Cannot acquire connection"
- **Verification**: `docker-compose ps | grep postgres` - is it running?
- **Fix**: Restart database

### Root Cause 3: Out of Memory
- **Symptom**: Service crashes randomly, errors increase
- **Verification**: `docker stats backend | grep MEM` - at limit?
- **Fix**: Increase memory, restart service

### Root Cause 4: External Service Down (OpenAI, etc)
- **Symptom**: 503 errors from backend trying to reach external API
- **Verification**: Manually test: `curl https://api.openai.com/v1/status`
- **Fix**: Wait for external service recovery

### Root Cause 5: Load Spike / Resource Exhaustion
- **Symptom**: Error rate correlates with spike in request volume
- **Verification**: Check if unusual user activity or bot traffic
- **Fix**: Scale up services, add rate limiting

---

## Investigation Checklist

### Step 1: Verify Service Health (30 seconds)
```bash
docker-compose ps
# Check that backend, postgres, redis are all "Up"
# If any are "Exited", they crashed
```

### Step 2: Check Backend Logs
```bash
docker-compose logs backend --since 5m | grep -i "error\|exception\|fail" | head -20
# Look for error pattern - same error repeating = likely root cause
```

### Step 3: Check Database
```bash
docker-compose exec postgres psql -c "SELECT 1;"
# If fails: Database is down or unreachable
```

### Step 4: Check External Services
```bash
# Check OpenAI
curl -s https://api.openai.com/v1/status | jq .

# Check Pinecone (RAG)
curl -s https://api.pinecone.io/status | jq .

# If any are down: That's the issue
```

### Step 5: Check Resource Limits
```bash
docker stats backend --no-stream
# If MEMORY near limit:  increase docker-compose memroy limit
# If CPU always 99%: likely bad code in recent deployment
```

### Step 6: Error Type Distribution
```bash
# Check what HTTP endpoints are erroring
docker-compose logs backend --since 5m | grep "5[0-9][0-9]" | head -10
# Are errors from /classify, /tools, /rag? Narrows down which service
```

---

## Resolution Steps

### Option A: Rollback Recent Deployment (Most Common)
```bash
# If error rate spiked right after deployment
git log --oneline -5
# Find the commit before the spike

# Rollback
git checkout [previous-good-commit] -- backend/

# Rebuild and restart
docker-compose up -d --build backend

# Monitor error rate dashboard for 2 minutes
# Should drop below 10% threshold and alert resolves
```

### Option B: Restart Backend Service
```bash
# If service is stuck or misconfigured
docker-compose restart backend

# Wait 10 seconds for service to start
# Monitor logs
docker-compose logs backend --follow | head -30
```

### Option C: Restart Database (If Connection Issue)
```bash
# If errors are connection-related
docker-compose restart postgres

# Wait 5 seconds for startup
sleep 5

# Restart backend to reconnect
docker-compose restart backend

# Monitor
```

### Option D: Scale Up (If Resource Constrained)
```bash
# If CPU/memory maxed out
# Edit docker-compose.yml
#   backend:
#     mem_limit: 2g  (increase from 1g)
#     deploy:
#       resources:
#         limits:
#           cpus: '1'    (increase from 0.5)

# Rebuild
docker-compose up -d --build backend

# Or add more replicas:
# docker-compose up -d --scale backend=2
```

### Option E: Emergency Fallback (Last Resort)
```bash
# If nothing else works
# Disable feature that's causing errors
docker-compose exec backend npm run cli disable-feature --feature nlu

# This keeps service up but with degraded functionality
# Users can still use basic features while you debug
```

---

## How to Verify Resolution

- [ ] Error rate in Prometheus drops below 10%
- [ ] Alert changes from "firing" to "resolved"
- [ ] Backend logs show successful requests (no errors for 5+ min)
- [ ] Manual API test works: `curl -X GET http://localhost:3000/health`
- [ ] No new errors in error logs

**Resolution verified when**:
- Error rate < 5% (dropping below threshold shows trend improving)
- No service restarts happening (logs are stable)
- Response times back to normal

---

## Escalation Procedure

### Level 1: On-Call (1 minute)
- **Action**: Restart backend → restart postgres → check logs
- **Timeout**: 1 minute

### Level 2: Backend Lead (5 minutes)
- **Action**: Analyze logs, check recent commits, determine rollback
- **Timeout**: 5 minutes

### Level 3: Engineering Director (15 minutes)
- **Action**: Rollback, scale up, or declare incident
- **Timeout**: 15 minutes

### Emergency Incident (30 minutes)
- **Action**: All hands on deck, possible service degradation
- **Decision**: Route traffic to backup, offline non-critical features

---

## Prevention

- [x] Add pre-deployment tests: "Verify 100 test requests succeed"
- [x] Canary deployment: Roll out to 5% traffic, monitor for 2 minutes
- [x] Circuit breaker on external services: Graceful fallback if API down
- [x] Resource limits: Set docker memory limits to prevent OOM crashes
- [x] Rate limiting: Cap max requests/second to prevent overload

---

## Related Alerts

- `HighLatency` - Often precedes this (slow → timeout → error)
- `HighToolErrorRate` / `HighDatabaseErrorRate` - May indicate specific service failure
- `HighMemoryUsage` / `HighCPUUsage` - Resource exhaustion cause

---

**Last Updated**: January 30, 2026  
**Runbook Version**: 1.0  
**Severity**: CRITICAL - Service down

---
