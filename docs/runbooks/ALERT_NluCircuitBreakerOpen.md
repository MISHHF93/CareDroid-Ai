# Alert Runbook: NluCircuitBreakerOpen

**Alert Severity**: 🔴 **CRITICAL**  
**Module**: NLU (Intent Classification)  
**Dashboard Panels**: 12, 13, 14  
**Related Metrics**: `nlu_circuit_breaker_state` (state = 1 = open)

---

## What This Alert Means

The NLU circuit breaker has opened. The system detected repeated failures from the NLU model or LLM service and has stopped sending requests to protect infrastructure. This is a last-resort safety mechanism. When the circuit breaker is open, the system cannot classify intents and cannot process user requests. Service is **DOWN** - this requires immediate action.

---

## Quick Diagnosis (< 30 seconds)

1. **Check which breaker is open**: In Alertmanager alert, look at label `service` (nlu_model | llm)
2. **Check service logs**: `docker-compose logs [service-name] --since 5m` - see the error pattern
3. **Check external dependencies**: If nlu_model → check if it's running. If llm → check OpenAI API status

---

## Common Root Causes

### Root Cause 1: Underlying Service Crashed
- **Symptom**: NLU model service (`docker-compose ps | grep nlu` shows Down)
- **Verification**: `docker-compose logs nlu-service` shows crash on startup
- **Impact**: Cannot classify intents at all

### Root Cause 2: External Dependency Down (LLM)
- **Symptom**: LLM circuit breaker open, trying to reach OpenAI but getting 503
- **Verification**: Check OpenAI status page or curl: `curl https://api.openai.com/v1/status`
- **Impact**: Cannot fallback to LLM, NLU must handle everything alone

### Root Cause 3: Resource Exhaustion
- **Symptom**: Service running but very slow, timing out on every request
- **Verification**: `docker stats nlu-service` shows 99% CPU or memory limit
- **Impact**: Requests timeout → circuit breaker triggers

### Root Cause 4: Configuration Error
- **Symptom**: Service starts but immediately fails (bad config)
- **Verification**: Environment variables missing or wrong: `docker-compose config | grep -i nlu`
- **Impact**: Service cannot initialize models

---

## Investigation Checklist

### Step 1: Check Service Running Status
- [ ] `docker-compose ps | grep "nlu\|llm"` - Is the service container running?
- [ ] If NOT running: Check why it crashed: `docker-compose logs [service] --tail 50`
- [ ] If running: Go to Step 2

### Step 2: Check Service Logs for Error Pattern
- [ ] `docker-compose logs nlu-service --since 5m | grep -i "error\|fail\|timeout"`
- [ ] Look for repeating error: Same error happening multiple times = circuit breaker triggered
- [ ] Copy the error message

### Step 3: Check Resource Constraints
- [ ] `docker stats nlu-service` - CPU, memory usage
- [ ] Is CPU at 99%? Memory at 95%? Service slow / timing out?
- [ ] Check if other services are competing for resources

### Step 4: Check External Services
- [ ] If LLM circuit open: Check OpenAI API
  ```bash
  curl -s https://api.openai.com/v1/status | jq .
  # If API down, circuit breaker is correct behavior
  ```
- [ ] If model service down: Check Redis (model cache): `docker-compose ps | grep redis`
- [ ] Check database: `docker-compose exec postgres psql -c "SELECT 1;"`

### Step 5: Check Circuit Breaker Configuration
- [ ] Circuit breaker threshold: `docker-compose config | grep -A 5 "circuit_breaker"`
- [ ] Threshold might be too aggressive (breaker opens too easily)
- [ ] Or service might have genuine repeated failures

---

## Resolution Steps

### Option A: Restart the Failed Service (Most Common)
```bash
# If service crashed or got stuck
docker-compose restart nlu-service

# Wait for service to fully start (check logs)
docker-compose logs nlu-service --follow
# Wait 5-10 seconds for model loading output

# Monitor Panel 12 for status change
# Should show 0 (closed/healthy) within 30 seconds

# If opening again, proceed to Option B
```

### Option B: Check and Restart Dependencies
```bash
# Circuit breaker might be hitting dependency failures
# Restart Redis (if used for caching)
docker-compose restart redis

# Restart database connection pool
docker-compose restart postgres

# Wait 5 seconds then restart NLU service
docker-compose restart nlu-service

# Monitor for 1 minute
```

### Option C: Force Circuit Breaker Reset
```bash
# If service is running but breaker stuck open
# Force reset in code (requires access)
docker-compose exec backend npm run cli reset-circuit-breaker --service nlu_model

# Or manually:
docker-compose exec redis redis-cli DEL "circuit_breaker:nlu_model:state"

# Then restart service for clean state
docker-compose restart nlu-service
```

### Option D: Scale Up / Increase Timeout
```bash
# If resource exhaustion
# Increase memory limit in docker-compose.yml
#   nlu-service:
#     mem_limit: 2g  # (increase from 1g)

# Or increase request timeout before circuit breaker triggers
# In service config: circuit_breaker_timeout: 30s (increase from 10s)

# Rebuild and restart
docker-compose up -d --build nlu-service
```

### Option E: Check External Service (LLM)
```bash
# If LLM circuit breaker open
# Verify OpenAI API is accessible
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# If fails: OpenAI is down (nothing we can do)
#   Fallback: Disable LLM fallback temporarily
#   docker-compose exec backend npm run cli set-no-llm-mode

# If succeeds: Issue is with our API key or connectivity
#   Check firewall, proxy, or API key validity
```

---

## How to Verify Resolution

- [ ] Panel 12 or 13 shows breaker state = 0 (closed/healthy)
- [ ] Alert status changes from "firing" to "resolved" in Alertmanager
- [ ] Service logs show successful requests (no errors)
- [ ] Panel 1 shows normal classification distribution (not all errors)
- [ ] Response times back to normal (Panel 3-5)

**Circuit breaker is resolved when**:
- Breaker state = 0
- Error rate drops below threshold
- Response times < 300ms median
- Classification success rate > 95%

---

## Escalation Procedure

### Level 1: Immediate Response (1 minute)
- **Who**: On-call engineer
- **Action**: Restart service (Option A) → wait 30 seconds
- **Escalation timeout**: 1 minute → if breaker still open, escalate

### Level 2: Quick Escalation (5 minutes)
- **Who**: NLU or platform engineer
- **Action**: Check logs, identify root cause (Options B-E)
- **Tools**: Full docker-compose access, logs access
- **Escalation timeout**: 5 minutes → if not resolved, escalate

### Level 3: Emergency (15 minutes)
- **Who**: Engineering lead
- **Action**: Disable NLU entirely, route all to LLM (slow, expensive, but works)
- **Or**: Scaling up infrastructure, rolling back recent deployment
- **Impact**: Degraded service but operational

---

## Prevention for Next Time

### Monitoring Improvements
- [ ] Alert at 50% of error threshold (early warning before breaker opens)
- [ ] Monitor circuit breaker state continuously (currently only on open)
- [ ] Alert on slow requests (leading indicator before timeout threshold hit)

### Deployment Improvements
- [ ] Smoke test after deployment: Verify 10 classification requests succeed
- [ ] Canary deployment: Roll out to 10% traffic first, check circuit breaker for 5 min
- [ ] Never deploy both NLU and DB changes together (risk both failing)

### Architecture Improvements
- [ ] Add request queue with timeout: Don't let requests queue infinitely
- [ ] Implement graceful degradation: Even if NLU fails, still give user something
- [ ] Split circuit breakers: Separate threshold for LLM fallback

---

## Related Alerts

- `NluConfidenceDropping` - Often precedes this (falling confidence → more errors → breaker opens)
- `LlmFallbackSpike` - If LLM circuit breaker opens, confidence will drop and fallback spike
- `HighErrorRate` - May fire if circuit breaker open blocks all traffic
- `HighLatency` - May fire if NLU slow before hitting timeout threshold

---

**Last Updated**: January 30, 2026  
**Runbook Version**: 1.0  
**Owner**: NLU Infrastructure Team  
**Severity**: CRITICAL - Service down

---
