# Alert Runbook: UnexpectedCostSpike

**Severity**: CRITICAL  
**Category**: Cost Control - Financial Risk  
**SLI Impact**: SLI-6 (Cost Efficiency)  
**Response Time**: 1 minute to acknowledge, 5 minutes to action  

---

## What This Alert Means

OpenAI costs have **doubled in 5 minutes**. This is a financial emergency. Unless immediately addressed, the system could incur $86,400+ in daily costs (vs normal $400-500/month).

**Normal Baseline**: $200-400/month (baseline)  
**Warning**: Cost rate > baseline × 2  
**Immediate Action**: Manual review required

---

## Quick Diagnosis (1 minute)

1. **Open Cost Intelligence dashboard**
   - Check "OpenAI Cost Trend" panel
   - Identify exact moment cost spiked (graph inflection point)

2. **Identify the cause** - ask these questions:
   - Within last 5 minutes, did NLU go down? → CIRCUIT BREAKER OPEN
   - Within last 5 minutes, did traffic surge? → TRAFFIC SPIKE
   - Within last deployment, did something change? → BAD DEPLOYMENT
   - Is there a specific endpoint/user spiking costs? → ABUSE
   - Are tokens per request increasing? → CONTEXT EXPLOSION

3. **Estimate damage**:
   - If sustained for 1 hour: $3,600 overage
   - If sustained for 24 hours: $86,400 overage
   - **NEED TO ACT FAST**

---

## Common Root Causes (in order of likelihood)

### Cause 1: NLU Circuit Breaker Open (60% of cases)
- **Symptom**: Spike correlates with `NluCircuitBreakerOpen` alert
- **Fix**: See ALERT_NluCircuitBreakerOpen.md (immediate restart)
- **Time to fix**: 5-15 minutes  
- **Cost impact**: $60+ per minute * 15 min = $900 potential loss

### Cause 2: Traffic Spike (20% of cases)
- **Symptom**: Request rate increased 2-5x
- **Fix**: Check for bot/abuse, or legitimate traffic surge
- **Time to fix**: 10-30 minutes  

### Cause 3: Token Explosion (10% of cases)
- **Symptom**: Cost/request increased (total requests same)
- **Fix**: Context window too large, implement pruning
- **Time to fix**: 30 minutes deployment

### Cause 4: Bad Deployment (8% of cases)
- **Symptom**: Spike right after deployment
- **Fix**: Rollback immediately
- **Time to fix**: 5 minutes

### Cause 5: Abuse/Bot (2% of cases)
- **Symptom**: Requests from unusual IPs or patterns
- **Fix**: Block IPs, update rate limiting
- **Time to fix**: 10-20 minutes

---

## Immediate Actions (0-5 minutes)

```bash
# CRITICAL: Disable LLM temporarily if cost continues doubling
# This stops financial bleeding while you investigate

# 1. Check current cost rate
COST_RATE=$(curl http://localhost:9090/api/v1/query?query='rate(openai_api_cost_total[1m])' | jq '.data.result[0].value[1]')
echo "Current cost rate: \$$COST_RATE/minute"

# If > $3/minute, AND doubling continues, disable LLM
if [ $(echo "$COST_RATE > 3" | bc) -eq 1 ]; then
  echo "CRITICAL COST SPIKE: Disabling LLM fallback immediately"
  
  # Disable LLM
  curl -X POST http://localhost:8080/api/admin/feature-flags \
    -H "Content-Type: application/json" \
    -d '{"flag": "llm_fallback_enabled", "enabled": false, "reason": "COST_SPIKE_EMERGENCY"}'
  
  # Notify team immediately
  echo "@caredroid-oncall CRITICAL: Cost spike to \$$COST_RATE/min, disabled LLM fallback" | curl -X POST -d @- http://slack-webhook-url
  
  echo "LLM disabled. Cost should drop immediately. Investigate while disabled."
fi

# 2. Parallel: Check what caused the spike
echo "Checking root cause..."

# Is NLU down?
curl http://localhost:8001/health 2>/dev/null | jq '.status'
# If error, NLU is down → escalate to NLU team, see NLU Circuit Breaker runbook

# Is traffic spiking?
REQ_RATE=$(curl http://localhost:9090/api/v1/query?query='rate(http_requests_total[1m])' | jq '.data.result[0].value[1]')
echo "Request rate: $REQ_RATE req/sec (normal: 10-50)"

# Is cost per request increasing?
COST_PER_REQ=$(echo "$COST_RATE / $REQ_RATE" | bc -l)
echo "Cost per request: \$$COST_PER_REQ (normal: 0.005-0.02)"
```

**Expected outcome**: Cost rate stabilizes within 5 minutes

---

## Investigation (5-30 minutes)

Parallel track investigation while LLM disabled:

```bash
# Diagnose root cause
# 1. Check if NLU is down
HEALTH=$(curl http://localhost:8001/health 2>&1)
if [ $? -ne 0 ]; then
  echo "NLU SERVICE IS DOWN - See ALERT_NluCircuitBreakerOpen.md"
  exit 1
fi

# 2. Check request rate increase
BEFORE_RATE=$(curl 'http://localhost:9090/api/v1/query_range?query=rate(http_requests_total[1m])&start='$(date -d '10 minutes ago' +%s)'&end='$(date -d '5 minutes ago' +%s)'&step=1m' | jq '.data.result[0].values[-1][1]')
AFTER_RATE=$(curl 'http://localhost:9090/api/v1/query_range?query=rate(http_requests_total[1m])&start='$(date -d '5 minutes ago' +%s)'&end='$(date +%s)'&step=1m' | jq '.data.result[0].values[-1][1]')
echo "Traffic surge: $BEFORE_RATE → $AFTER_RATE req/sec"

# 3. Check if bot activity
TOP_IPS=$(docker exec postgresql psql -U postgres care_droid -c \
  "SELECT ip_address, COUNT(*) as count FROM audit_logs \
   WHERE created_at > now() - interval '5 minutes' \
   GROUP BY ip_address ORDER BY count DESC LIMIT 5;" | tail -10)
echo "Top IPs in last 5 minutes:"
echo "$TOP_IPS"

# 4. Check for deployment
LAST_DEPLOY=$(git log --oneline -1)
echo "Last deployment: $LAST_DEPLOY"

# 5. Check tokens per request
TOKENS_BEFORE=$(curl 'http://localhost:9090/api/v1/query_range?query=increase(openai_api_cost_total[5m])/increase(authenticated_requests_total[5m])&start='$(date -d '10 minutes ago' +%s)'&end='$(date -d '5 minutes ago' +%s) | jq '.data.result[0].values[-1][1]')
TOKENS_AFTER=$(curl 'http://localhost:9090/api/v1/query_range?query=increase(openai_api_cost_total[5m])/increase(authenticated_requests_total[5m])&start='$(date -d '5 minutes ago' +%s)'&end='$(date +%s) | jq '.data.result[0].values[-1][1]')
echo "Cost per request: \$$TOKENS_BEFORE → \$$TOKENS_AFTER"
```

**Expected outcome**: Root cause identified

---

## Resolution Based on Root Cause

### If NLU Down → See ALERT_NluCircuitBreakerOpen.md
- Restart NLU service
- Verify health check passes
- Re-enable LLM fallback

### If Traffic Spike (Legitimate)
```bash
# 1. Verify traffic is legitimate
# - Check user authentication
# - Check request content (medical queries) vs bot patterns

# 2. If legitimate:
#    - Scale infrastructure (add replicas)
#    - Monitor but allow spike (update cost forecast)

# 3. If abuse:
#    - Block IPs (see section below)
#    - Increase rate limiting
```

### If Abuse Detected
```bash
# 1. Block malicious IPs
curl -X POST http://localhost:8080/api/admin/block-ip \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.0.2.1"}'

# 2. Increase rate limiting
curl -X POST http://localhost:8080/api/admin/rate-limits \
  -H "Content-Type: application/json" \
  -d '{
    "per_minute_per_user": 5,
    "per_hour_per_user": 100,
    "per_minute_per_ip": 30
  }'

# 3. Monitor requests from remaining IPs
```

### If Bad Deployment
```bash
# 1. Rollback
git revert HEAD
docker build . -t caredroid/api:rollback
docker-compose up -d api

# 2. Test cost is normal
sleep 30
COST=$(curl http://localhost:9090/api/v1/query?query='rate(openai_api_cost_total[1m])' | jq '.data.result[0].value[1]')
echo "Cost after rollback: \$$COST/minute"

# 3. If normal, keep rolled back
# If still high, investigate further
```

### If Context/Token Explosion
```bash
# Edit config to reduce context window
# backend/src/modules/ai/ai.service.ts
# MAX_CONTEXT_TURNS = 5 (was 10)
# Max tokens = 2000 (was 4000)

git add backend/src/modules/ai/ai.service.ts
git commit -m "fix: reduce context to stop cost spike"
git push

# Wait for deployment (2-5 minutes)
sleep 300

# Check cost is normal
COST=$(curl http://localhost:9090/api/v1/query?query='rate(openai_api_cost_total[1m])' | jq '.data.result[0].value[1]')
echo "Cost after optimization: \$$COST/minute (should be <$0.20)"
```

---

## Re-Enable Systems (30 minutes after stabilized)

Once LLM was disabled and cost is stable:

```bash
# 1. Verify root cause fixed
# (specific to what caused the spike)

# 2. Re-enable LLM gradually
curl -X POST http://localhost:8080/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"flag": "llm_fallback_enabled", "enabled": true, "reason": "Cost spike resolved"}'

# 3. Monitor cost spike doesn't return
watch -n 10 'curl http://localhost:9090/api/v1/query?query="rate(openai_api_cost_total[1m])" 2>/dev/null | jq ".data.result[0].value[1]"'

# Expected: Stays <$0.20/minute

# 4. If cost spikes again immediately:
#    - Disable LLM again
#    - Investigate more
#    - Escalate to director
```

---

## Escalation

- **Escalate immediately if**:
  - Cost > $5/minute sustained (>$7,200/day)
  - Root cause not identified within 15 minutes
  - System instability after attempted fix
  - Multiple critical systems affected

**Escalation Contacts**:
- On-call Engineer: `@caredroid-oncall` (Slack)
- Director: Call +1-555-0100 (for costs >$5000)
- Finance: `@finance-team` (inform them of overage)

---

## Post-Incident (After cost stabilized)

1. **Quantify financial impact**:
   ```
   Spike duration: X minutes
   Cost rate during spike: $Y/minute
   Total overage: X * Y - (baseline * X)
   ```

2. **Document root cause** in detail

3. **Implement prevention** (see Prevention section below)

4. **Review with team** in next engineering standup

---

## Prevention

1. **Cost ceiling** (hardest brake):
   - Disable LLM fallback if cost > $100/hour
   - Code: Add check in AIService before each LLM call

2. **Traffic circuit breaker**:
   - Reject requests if cost_per_minute > baseline * 3 for >1 min
   - Prevents exponential cost growth

3. **Deployment validation**:
   - All deployments must estimate cost impact
   - Block deployments if cost estimates increase >20%

4. **Rate limiting per user/IP**:
   - Prevent bots from blasting system
   - Per-IP limit: 30 req/min
   - Per-user limit: 1000 req/day (adjustable by tier)

5. **Monitoring**:
   - Set up `UnexpectedCostSpike` alert (this one)
   - Alert on cost_per_request if increases >50%
   - Alert on traffic if increases >200% in 5 min

---

## Related Alerts

- `HighLlmCostRate` - Sustained high cost (not spike)
- `NluCircuitBreakerOpen` - NLU down (common cause)
- `RequestRateAnomaly` - Traffic unusual
- `LatencyTrendingUp` - System under stress

---

**Alert Runbook Complete** | January 30, 2026 | Phase 4 - CRITICAL
