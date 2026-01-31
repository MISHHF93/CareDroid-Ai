# Alert Runbook: HighLlmCostRate

**Severity**: WARNING  
**Category**: Cost Control  
**SLI Impact**: SLI-6 (Cost Efficiency)  
**Response Time**: 5 minutes to acknowledge, 15 minutes to initial action  

---

## What This Alert Means

The system's OpenAI API costs have exceeded $1/minute (~$1440/day). This is a financial operation alert, not a service quality alert. The system is likely spending more than anticipated on LLM queries.

**Normal Baseline**: ~$200-400/month ($0.25-0.55/hour)  
**Alert Threshold**: $60/hour ($1/min × 60)  
**Critical Threshold**: $120/hour (costs doubled)

---

## Quick Diagnosis (2 minutes)

1. **Check dashboard**: Open Cost Intelligence dashboard
   - View "OpenAI Cost Trend (Last 7 days)" panel
   - Is cost spiking upward or been high for hours?

2. **Identify the cause**:
   - Is NLU unavailable? → Check `NluCircuitBreakerOpen` alert
   - Is confidence dropping? → Check `NluConfidenceDropping` alert
   - Did traffic surge? → Check `RequestRateAnomaly` alert
   - Is a specific model being used? → Check "Cost by Model" pie chart

3. **Estimate impact**:
   - At $1/min: $1,440/day = $43,200/month (vs $500 budget)
   - At $2/min: $2,880/day = $86,400/month (5x over budget)
   - Need to take action immediately

---

## Common Root Causes

### Cause 1: NLU Model Unavailable (Circuit Breaker Open)
**Symptoms**:
- Cost spike correlates with `NluCircuitBreakerOpen` alert
- Cost graph spikes while confidence graph drops
- Tool success rate drops

**Investigation**:
```bash
# Check if NLU circuit breaker is open
curl http://localhost:9090/api/v1/query?query=nlu_circuit_breaker_state

# Check NLU service logs
docker logs backend-nlu | tail -100 | grep error

# Check if NLU is responding
curl http://localhost:8001/health
```

**Fix**: See ALERT_NluCircuitBreakerOpen.md runbook (opens separate incident)

---

### Cause 2: Confidence Score Too Low (Fallback to Expensive LLM)
**Symptoms**:
- Cost spike correlates with `NluConfidenceDropping` alert
- `llm_fallback_rate` metric rising
- NLU service unhealthy or overloaded

**Investigation**:
```bash
# Check LLM fallback rate
curl http://localhost:9090/api/v1/query?query='rate(llm_fallback_spike[5m])'

# Check intent confidence score
curl http://localhost:9090/api/v1/query?query='intent_classification_confidence'

# Check which intents are low confidence
curl http://localhost:9090/api/v1/query?query='group_by(intent_type, intent_classification_confidence)'
```

**Fix**: See ALERT_NluConfidenceDropping.md runbook

---

### Cause 3: Traffic Surge (Legitimate or Abuse)
**Symptoms**:
- Cost spike correlates with request rate increase
- All metrics (latency, errors, CPU) increasing together
- Proportional cost increase (cost × request_rate)

**Investigation**:
```bash
# Check request rate
curl http://localhost:9090/api/v1/query?query='rate(http_requests_total[5m])'

# Check if surge is from authenticated users or bots
curl http://localhost:9090/api/v1/query?query='rate(authenticated_requests_total[5m])'

# Check for bot patterns (same IP, repeated queries)
# Check auth logs for suspicious patterns
docker exec postgresql psql -U postgres care_droid -c \
  "SELECT user_id, COUNT(*) as req_count FROM audit_logs WHERE created_at > now() - interval '1 hour' GROUP BY user_id ORDER BY req_count DESC LIMIT 10;"
```

**Fix**:
- If legitimate traffic surge: Scale up, update cost forecast
- If bot/abuse: Block IPs, update rate limiting, check WAF logs

---

### Cause 4: New Feature Using Expensive LLM
**Symptoms**:
- Cost spike after recent deployment
- Specific feature (e.g., medical_insights) correlates with cost
- error rate may be normal

**Investigation**:
```bash
# Check recent deployments
git log --oneline -20

# Check feature flags
curl http://localhost:8080/api/features | jq '.features | map(select(.cost_model == "gpt-4o"))'

# Check which endpoints are calling LLM most
curl http://localhost:9090/api/v1/query?query='topk(10, sum(rate(openai_api_cost_total[5m])) by (endpoint))'
```

**Fix**:
- Disable feature or optimize (increase NLU confidence threshold, add caching)
- Review feature deployment PR for cost estimates
- Update feature cost documentation

---

### Cause 5: Token Count Explosion
**Symptoms**:
- Cost per request increasing (not just total requests)
- Context windows growing (longer conversations)
- Large prompts or many tool results in context

**Investigation**:
```bash
# Check average tokens per request
curl http://localhost:9090/api/v1/query?query='increase(openai_api_cost_total[1h]) / increase(authenticated_requests_total[1h])'

# Check prompt length distribution
docker exec postgresql psql -U postgres care_droid -c \
  "SELECT 
     percentile_cont(0.5) WITHIN GROUP (ORDER BY prompt_length) as p50,
     percentile_cont(0.95) WITHIN GROUP (ORDER BY prompt_length) as p95
   FROM ai_queries WHERE created_at > now() - interval '1 hour';"

# Check context size
grep -r "context" backend/src/modules/ai/ | grep "max\|size"
```

**Fix**:
- Implement context pruning (remove old conversation turns)
- Implement prompt compression (summarize context)
- Reduce max_tokens in model config if safe

---

## Investigation Checklist

- [ ] Check Cost Intelligence dashboard (cost trend, model breakdown, cost per user)
- [ ] Identify if spike is proportional to requests or per-request cost
- [ ] Check if NLU is functioning (circuit breaker, confidence)
- [ ] Check if traffic surge legitimate (user count, request rate)
- [ ] Check deployment history (any recent changes?)
- [ ] Check for bot/abuse patterns in auth logs
- [ ] Calculate estimated impact (duration × cost/min = total overage)
- [ ] Notify finance team if >$5000 daily overage
- [ ] Document root cause for post-incident review

---

## Resolution Steps

### Option 1: If NLU Unavailable (Fallback Loop)
```bash
# Immediate: Implement cost ceiling (fallback disabled over $100/hour)
# 1. Disable LLM fallback temporarily
curl -X POST http://localhost:8080/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"flag": "llm_fallback_enabled", "enabled": false}'

# 2. Investigate NLU (see NLU Circuit Breaker runbook)

# 3. Re-enable fallback once NLU recovered
```

**Time to resolution**: 5-15 minutes  
**Cost saved**: ~$60-120/min until fixed (~$7200/hour)

---

### Option 2: If Traffic Surge (Legitimate)
```bash
# No action needed on cost itself, but:
# 1. Update monthly cost forecast
OLD_MONTHLY=$(echo "scale=2; 30 * 400" | bc)  # $12,000 baseline
NEW_MONTHLY=$(echo "scale=2; 30 * $(curl http://localhost:9090/api/v1/query?query='rate(openai_api_cost_total[1h])' | jq '.data.result[0].value[1]' | tr -d '"')" | bc)
echo "Cost forecast: $OLD_MONTHLY -> $NEW_MONTHLY"

# 2. Check if budget needs adjustment
if [ $NEW_MONTHLY -gt 20000 ]; then
  echo "ALERT: Projected monthly cost $NEW_MONTHLY exceeds budget"
  # Notify product/finance
fi

# 3. Scale infrastructure if needed
kubectl autoscale deployment api --min=3 --max=10 --cpu-percent=70
```

**Time to resolution**: 10-30 minutes  
**Cost impact**: Permanent (new baseline)

---

### Option 3: If Bot/Abuse
```bash
# 1. Identify malicious IPs
docker exec postgresql psql -U postgres care_droid -c \
  "SELECT ip_address, COUNT(*) as requests FROM audit_logs 
   WHERE created_at > now() - interval '1 hour' 
   GROUP BY ip_address 
   ORDER BY requests DESC LIMIT 20;"

# 2. Block IPs in WAF
# (depends on your WAF implementation)
# Example for AWS WAF:
aws wafv2 create-ip-set \
  --scope REGIONAL \
  --ip-set-name malicious-ips \
  --addresses "[\"192.0.2.0/24\"]"

# 3. Check rate limiting
curl http://localhost:8080/api/admin/rate-limits | jq '.'

# 4. Increase rate limiting if too permissive
curl -X POST http://localhost:8080/api/admin/rate-limits \
  -H "Content-Type: application/json" \
  -d '{"per_minute": 10, "per_day": 500}'

# 5. Reset user quotas if needed
docker exec postgresql psql -U postgres care_droid -c \
  "UPDATE user_quotas SET queries_used = 0 WHERE CAST(queries_used AS int) > 1000;"
```

**Time to resolution**: 15-30 minutes  
**Cost saved**: Depends on bot size (~$1000+/hour if large)

---

### Option 4: If New Feature Causing Cost Growth
```bash
# 1. Identify feature
git log --oneline --all | head -20
# Find feature flags/deployment related to cost increase

# 2. Check if feature is essential
# (discuss with product manager)

# 3. Disable feature if not essential
curl -X POST http://localhost:8080/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"flag": "new_feature", "enabled": false}'

# 4. Optimize if essential
# - Increase cache TTL
# - Implement request deduplication
# - Add confidence threshold check before expensive LLM call

# 5. Re-enable once optimized
```

**Time to resolution**: 30-60 minutes  
**Cost saved**: 30-70% of feature cost depending on optimization

---

### Option 5: If Token Count Explosion
```bash
# 1. Implement context pruning
# Edit backend/src/modules/ai/ai.service.ts
# MAX_CONTEXT_WINDOW = 4096
# Remove turns beyond N most recent

# 2. Implement prompt compression
# Add: "Summarize this conversation in 500 tokens"
# before sending to LLM

# 3. Reduce max_tokens if safe
# Don't reduce below 1000 (medical quality)
# Current: 4000, try 2000-3000

# 4. Deploy changes
git add backend/src/modules/ai/ai.service.ts
git commit -m "fix: reduce context window to lower token costs"
git push origin main

# 5. Monitor token count after deploy
curl http://localhost:9090/api/v1/query?query='increase(openai_api_cost_total[1h]) / increase(authenticated_requests_total[1h])' | watch -n 30
```

**Time to resolution**: 1-2 hours (includes testing)  
**Cost saved**: 20-40% depending on optimization

---

## Verification

After taking action, verify the fix:

1. **Check cost trend graph** (Cost Intelligence dashboard)
   - Should see downward slope within 5-10 minutes
   - Expect return to baseline within 30 minutes

2. **Verify root cause addressed**
   ```bash
   # Example: If NLU was down, check it's back up
   curl http://localhost:8001/health | jq '.status'
   # Expected: "healthy"
   ```

3. **Check if alert clears**
   ```bash
   # Should stop firing once cost drops below $1/min
   curl http://localhost:9090/api/v1/alerts | jq '.data[] | select(.labels.alertname == "HighLlmCostRate")'
   # Expected: no results (alert cleared)
   ```

4. **Check business metrics didn't suffer**
   ```bash
   # Make sure SLI-2 (latency) and SLI-5 (errors) still good
   curl http://localhost:9090/api/v1/query?query='http_request_duration_seconds'
   curl http://localhost:9090/api/v1/query?query='errors_total'
   ```

---

## Escalation

- **If cost > $5/minute** (sustained): Page on-call engineering lead immediately
- **If cost > $10/minute** (>$14,400/day): Page director, potential service shutdown
- **If bot/abuse confirmed**: Notify security team, may need incident response protocol

**Escalation Contact**:
- On-call Engineer: `@caredroid-oncall` (Slack)
- Engineering Lead: `@engineering-lead` (Slack)
- Director: `@director` (Slack) or call +1-555-0100

---

## Prevention

To prevent future high cost spikes:

1. **Implement cost ceiling**: 
   - Hard disable LLM fallback if cost > $100/hour
   - Code: Add circuit breaker in AIService.invokeLLM()

2. **Monitor token usage**:
   - Add histogram metric: `openai_tokens_per_request`
   - Alert if P95 tokens/request increases >20%

3. **Feature cost review**:
   - All new features using LLM must estimate cost
   - Code review must check for cost implications

4. **Rate limiting**:
   - Per-user: 1000 requests/day (adjustable by tier)
   - Per-IP: 100 requests/minute (anti-bot)
   - Per-feature: Selective rate limiting for high-cost features

5. **Monthly budget review**:
   - Forecast month-end cost on 10th
   - If >$400, start cost reduction initiatives
   - Document all cost increases in commit messages

---

## Related Alerts

- `LlmFallbackSpike` - When fallback rate >50% (usually precedes cost spike)
- `NluConfidenceDropping` - When confidence low (causes fallback)
- `NluCircuitBreakerOpen` - When NLU unavailable (forces fallback)
- `UnexpectedCostSpike` - When cost doubles in 1 hour

---

## Related Documentation

- **Cost Intelligence Dashboard**: [Cost Intelligence](http://localhost:3000/d/cost-intelligence)
- **SLI-6 (Cost Efficiency)**: [SLI_SLO.md](../SLI_SLO.md#sli-6-cost-efficiency-phase-4-new)
- **Budget Forecast**: See Finance team monthly reports
- **OpenAI Pricing**: https://openai.com/pricing (as of Jan 2026: gpt-4o $0.03/1K input, $0.06/1K output)

---

**Alert Runbook Complete** | January 30, 2026 | Phase 4
