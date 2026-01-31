# Alert Runbook: LlmFallbackSpike

**Alert Severity**: 🟡 **WARNING**  
**Module**: NLU (Intent Classification)  
**Dashboard Panels**: 1, 9 (classification distribution)  
**Related Metrics**: `intent_classifications_total` (method="llm" > 50% for 10+ minutes)

---

## What This Alert Means

More than 50% of intent classifications are falling back to the expensive LLM (GPT-4) model instead of using the local NLU model. This indicates the NLU model is failing or its confidence is too low. The LLM fallback is 100x more expensive per request. This alert means costs are spiking and performance is degrading.

---

## Quick Diagnosis (< 2 minutes)

1. **Check dashboard**: [Panel 9 - Classification Rate](http://grafana:3000/d/master-clinical-intelligence?panelId=9)
2. **Look at data**: Is LLM line above 50%? When did it jump?
3. **Ask**: Did NLU service restart? Is NLU running slow? Did confidence drop?

---

## Common Root Causes

### Root Cause 1: NLU Service Unavailable
- **Symptom**: LLM jumped to 100% (all requests using fallback)
- **Verification**: Check Panel 12 (circuit breaker) - is it open?
- **Fix**: Restart NLU service

### Root Cause 2: NLU Confidence Dropping
- **Symptom**: LLM gradually increased over time as confidence decreased
- **Verification**: Check Panel 15 (confidence trend) - is it < 0.6?
- **Fix**: Follow NLU Confidence Dropping runbook

### Root Cause 3: NLU Model Slow / Timing Out
- **Symptom**: LLM usage increased, Panel 4 shows model latency > 500ms
- **Verification**: Check Panel 4 (Model phase latency) - is it spiking?
- **Fix**: Restart NLU, check resources

### Root Cause 4: Model Load Failed
- **Symptom**: NLU service runs but model didn't load, confidence=0
- **Verification**: Check backend logs: `docker-compose logs backend | grep "model loaded"`
- **Fix**: Reload model from backup

---

## Investigation Checklist

### Step 1: Determine Timing
- [ ] When did LLM usage spike? (Look at Panel 1 timeline)
- [ ] Correlated with deployment? Service restart? Config change?
- [ ] `git log --oneline -5` - any recent changes in last 1 hour?

### Step 2: Check NLU Service Status
- [ ] `docker-compose ps | grep nlu` - is service running?
- [ ] `docker-compose logs nlu-service --since 10m | grep -i "error\|fail"` - any errors?
- [ ] Check Panel 12 (circuit breaker) - open or closed?

### Step 3: Check NLU Performance
- [ ] Panel 4 (Model phase latency): Is it > 300ms (timeout)?
- [ ] Panel 15 (Confidence): Is it < 0.6 (too low to use)?
- [ ] Panel 6 (Phase 1 rate): Is keyword phase working?

### Step 4: Check Resource Usage
- [ ] `docker stats nlu-service` - CPU/memory approaching limits?
- [ ] `docker-compose ps` - any services restarting?

### Step 5: Cost Impact
- [ ] Panel 9: How many requests using LLM at peak?
- [ ] Estimate: Each LLM request costs ~5x regular request
- [ ] If 100 req/min and 50% LLM→ $cost spike
- [ ] Calculate: 100 * 0.5 * 0.10 = $5/min extra cost!

---

## Resolution Steps

### Option A: Restart NLU Service (Most Common)
```bash
# If NLU service crashed or got stuck
docker-compose restart nlu-service

# Wait 10 seconds for full startup
sleep 10

# Monitor LLM usage on Panel 1
# Over next 2 minutes, should drop back to <50% as NLU starts working
```

### Option B: Check Circuit Breaker (Second Most Common)
```bash
# If Panel 12 shows circuit breaker open
# Service is running but requests failing
docker-compose logs nlu-service --since 5m | grep -i "circuit\|fail\|error"

# Force reset if stuck
docker-compose exec redis redis-cli DEL "circuit_breaker:nlu_model:state"

# Restart
docker-compose restart nlu-service
```

### Option C: Reload Model
```bash
# If model failed to load
# Force reload
docker-compose exec backend npm run cli reload-model --model nlu --version latest

# Wait 5 seconds, monitor diagnostics
```

### Option D: Check Event Timing
```bash
# See if something else changed at same time
# Check all service restarts in last 30 min
docker events --since 30m | grep -i "died\|created\|started"

# If postgres/redis restarted → may have caused NLU failure
# Restart those first, then NLU
```

### Option E: Emergency Fallback (Quick Get Costs Down)
```bash
# If NLU keeps failing and you need immediate cost relief
# Disable LLM fallback completely (accept failures)
docker-compose exec backend npm run cli set-config \
  --key llm_fallback_enabled \
  --value false

# This means:
# - NLU failures won't use expensive LLM
# - Users get "sorry, couldn't understand" instead
# - But costs stop spiking
# - Short term measure while debugging
```

---

## How to Verify Resolution

- [ ] Panel 1 (Classification Distribution): LLM drops back below 20%
- [ ] Alert resolves in Alertmanager (after 10 min of < 50%)
- [ ] Panel 15 (Confidence): Back above 0.65
- [ ] Panel 12 (Circuit breaker): Shows closed (state = 0)
- [ ] Cost metrics: No longer in red zone

**Verified when**:
- LLM usage < 30% (back to normal ~20%)
- Confidence > 0.70
- Circuit breaker closed
- Service logs clean (no errors for 5+ min)

---

## Cost Impact Analysis

**Impact of LLM Fallback Spike**:

If normally:
- 100 requests/minute
- 20% use LLM → 20 LLM requests/min
- Cost: 20 × $0.10 = $2/min = $120/hour

During spike (50% LLM):
- 50 LLM requests/min
- Cost: 50 × $0.10 = $5/min = $300/hour
- **Extra cost: $180/hour!**

**During 1-hour spike**: +$180 cost  
**During 8-hour spike**: +$1,440 cost  
**During 24-hour spike**: +$4,320 cost

This is why fast response is critical.

---

## Escalation Procedure

### Level 1: On-Call (2 minutes)
- **Action**: Restart NLU → check circuit breaker → monitor Panel 1
- **Timeout**: 2 minutes

### Level 2: NLU Lead (8 minutes)
- **Action**: Deep dive into NLU logs, model health, recent changes
- **Timeout**: 8 minutes → escalate if still spiking

### Level 3: Cost Control (15 minutes)
- **Action**: If still spiking, disable LLM fallback to stop cost bleed
- **Decision**: Accept degraded UX temporarily to save costs
- **Plan**: Debug root cause while in safe mode

---

## Prevention

- [x] **Pre-alert at 35%**: Create alert before hitting 50% (gives 10 min warning)
- [x] **Cost anomaly alert**: Alert if daily cost > 20% above baseline
- [x] **Model health test**: Daily test of NLU model accuracy
- [x] **LLM rate limit**: Cap LLM requests per minute (hard fail if exceeded)
- [x] **Confidence threshold**: Gradually lower acceptance of low-confidence predictions

---

## Related Alerts

- `NluConfidenceDropping` - Likely triggers before this (low confidence → fallback)
- `NluCircuitBreakerOpen` - If circuit breaker open, forces LLM fallback
- `LlmCallError` - If LLM API fails, may spike backlog

---

## Dashboard & Analysis

- **Main Panel**: [Panel 1 - Classification Distribution](http://grafana:3000/d/master-clinical-intelligence?panelId=1)
- **Context Panel**: [Panel 15 - Overall Confidence](http://grafana:3000/d/master-clinical-intelligence?panelId=15)
- **Health Panel**: [Panel 12 - Circuit Breaker Status](http://grafana:3000/d/master-clinical-intelligence?panelId=12)

---

**Last Updated**: January 30, 2026  
**Runbook Version**: 1.0  
**Owner**: NLU Team  
**Severity**: WARNING - Cost spik e / Performance degradation

---
