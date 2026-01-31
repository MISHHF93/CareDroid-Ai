# Alert Runbook: [ALERT_NAME]

**Alert Severity**: [Critical | Warning | Info]  
**Module**: [NLU | Tools | RAG | System | General]  
**Dashboard Panels**: [Panel numbers affected]  
**Related Metrics**: `metric_name`, `metric_name2`

---

## What This Alert Means

[1-2 sentence explanation of what the alert indicates. Write from the perspective of someone seeing this alert for the first time. What is broken or at risk?]

**Example**: "The NLU confidence dropping alert fires when the system's intent classification accuracy falls below 60% average confidence over 5 minutes. This indicates the NLU model is struggling to understand user intents, likely due to out-of-distribution input, model degradation, or training data drift."

---

## Quick Diagnosis (< 2 minutes)

[Fastest way to understand if this is a real issue or false positive]

**Steps:**
1. Check metric on dashboard: [Link to specific dashboard panels]
2. Look at: [What should you see in a healthy state vs. alarmed state?]
3. Quick question: [Ask yourself this to narrow down the scope]

**Example:**
1. Open [Master Clinical Intelligence Dashboard - NLU Intelligence section](http://grafana:3000/d/master-clinical-intelligence?var-timeRange=now-6h)
2. Look at Panel 15 (Overall Confidence Trend): Is the line trending DOWN? RED zone (<0.6)?
3. Ask: "Did we deploy new NLU code in the last 30 minutes?"

---

## Common Root Causes

[List the top 3-5 reasons this alert fires. Order by likelihood/impact]

### Root Cause 1: [Cause Name]
- **Symptom**: [What to look for]
- **Verification**: [How to confirm this is the cause]
- **Impact**: [What breaks as a result]
- **Example**: "Model weights corrupted after recent deployment"

### Root Cause 2: [Cause Name]
- **Symptom**: [What to look for]
- **Verification**: [How to confirm]
- **Impact**: [What breaks]

### Root Cause 3: [Cause Name]
- **Symptom**: [What to look for]
- **Verification**: [How to confirm]
- **Impact**: [What breaks]

---

## Investigation Checklist

[Step-by-step guide to diagnose the root cause. Include CLI commands, log searches, metric queries]

### Step 1: Verify Alert is Real (Not Flaky)
- [ ] In Prometheus alertmanager, check if alert has fired continuously for 5+ minutes (not flaky)
- [ ] Command: Check in Alertmanager UI for "pending" vs "firing" status

### Step 2: Check Service Health
- [ ] Service status: Run `docker-compose ps | grep [service-name]`
- [ ] Logs for errors: `docker-compose logs [service-name] | grep -i error`
- [ ] Resource usage: `docker stats [service-name]` (CPU, memory)

### Step 3: Inspect Related Metrics
- [ ] Open dashboard Panel X and look at related metrics
- [ ] Check 1-hour vs 6-hour view to see if recent or ongoing
- [ ] Look for correlated alerts (did other alerts fire at same time?)

### Step 4: Check Recent Deployments/Changes
- [ ] Git log: `git log --oneline -20` (Did something deploy in last 2 hours?)
- [ ] Config changes: Check if environment variables or configs changed
- [ ] Database migrations: Were any data schema changes applied?

### Step 5: Gather Logs for Deeper Analysis
- [ ] Structured logs: Search for alert-related errors in Kibana/ELK
- [ ] Application logs: `docker-compose logs [service] --since 30m | grep -i "confidence\|nlu\|error"`
- [ ] External service logs: Check OpenAI API status, vector DB status

---

## Resolution Steps

[Specific actions to take to resolve the issue. Include CLI commands and expected outcomes]

### Option A: Quick Restart (if service is stuck)
```bash
# Stop the affected service
docker-compose stop [service-name]

# Wait for graceful shutdown
sleep 5

# Start the service
docker-compose up -d [service-name]

# Monitor alert status
# The alert should resolve within 2-3 minutes if this fixes it
```

### Option B: Configuration Rollback (if recent config change)
```bash
# Check what changed
git diff HEAD~1 [config-file]

# Revert if necessary
git checkout HEAD~1 -- [config-file]

# Restart service to pick up changes
docker-compose restart [service-name]
```

### Option C: Data/Cache Reset (if stale data suspected)
```bash
# Clear service-specific cache
docker-compose exec redis redis-cli FLUSHDB

# Or restart Redis
docker-compose restart redis

# Restart dependent service
docker-compose restart [service-name]
```

### Option D: Scale Up (if resource exhaustion)
```bash
# Check current scale
docker-compose ps | grep [service-name]

# Increase replicas in docker-compose.yml or deployment config
# Update: services -> [service-name] -> deploy -> replicas: 3

# Apply changes
docker-compose up -d --scale [service-name]=3
```

---

## How to Verify Resolution

[Steps to confirm the fix worked. Include expected metric values and alert status]

**The alert is resolved when:**
- [ ] Alert status in Alertmanager changes from "firing" to "resolved"
- [ ] Dashboard metric shows green again (in healthy threshold range)
- [ ] No errors in service logs for 5+ consecutive minutes
- [ ] Related error rates drop below thresholds
- [ ] Users report normal service behavior (if applicable)

**Metrics to check:**
- Panel X should show values > [healthy threshold]
- Related panel Y should show < [error rate threshold]
- Error count in panel Z should drop to zero

---

## Escalation Procedure

[When to involve other team members. Define timeout for each escalation level]

### Level 1: Initial Response (2 minutes)
- **Responsibility**: On-call engineer
- **Action**: Follow investigation checklist, attempt quick fixes
- **Decision timeout**: 5 minutes - if not resolved by then, escalate

### Level 2: Escalation to Lead (5 minutes)
- **Responsibility**: If on-call engineer cannot resolve within 5 minutes
- **Who**: Platform/SRE lead or NLU team lead
- **Action**: Deep dive analysis, potential rollback decision
- **Tools**: Full access to Prometheus, logs, Git history
- **Decision timeout**: 15 minutes - if not resolved, escalate to Level 3

### Level 3: Emergency Escalation (15 minutes)
- **Responsibility**: If alert still firing after Level 2 response
- **Who**: Engineering director or VP Engineering
- **Action**: Declare incident, open war room, initiate service degradation/fallback
- **Tools**: Full infrastructure access, may require external vendor support
- **Options**: Disable feature, roll back major changes, divert traffic

---

## Prevention for Next Time

[How to avoid this alert in the future. Think about monitoring, testing, deployment practices]

### Monitoring Improvements
- [ ] Add pre-alert thresholds (create alerting at 80% of critical threshold)
- [ ] Add trending alert (alert if metric declining over 6 hours, not just current value)
- [ ] Add correlation alert (alert if multiple related metrics change together)

### Testing Improvements
- [ ] Add unit tests for [service component] validation
- [ ] Add integration test: "Verify NLU confidence stays > 0.65 with test data"
- [ ] Add canary test: Run against production before full rollout

### Deployment Improvements
- [ ] Require pre-deployment smoke test on [metric] for this service
- [ ] Implement gradual rollout (10% → 50% → 100%) instead of big bang
- [ ] Add automatic rollback if critical metrics drop below threshold
- [ ] Require peer review of changes affecting this component

### Operational Improvements
- [ ] Schedule regular [component] health checks (monthly)
- [ ] Document known failure modes and mitigation strategies
- [ ] Set up automated alerts on leading indicators (not just final failure)

---

## Rollback Procedure (If Fix Makes Things Worse)

[Steps to undo your fix if unintended consequences occur]

### If service restart made it worse:
```bash
# Restore previous version
git checkout HEAD~1 [affected-file]
docker-compose restart [service-name]

# If still worse:
# Full service revert to last known good
docker-compose down
git checkout [last-stable-commit]
docker-compose up -d
```

### If config change made it worse:
```bash
# Revert config
git checkout HEAD [config-file]
docker-compose restart [service-name]
```

### If deployment made it worse:
```bash
# Rollback image to previous version
# Edit docker-compose.yml or deployment config
# Change: image: caredroid/nlu:v1.2.3 → image: caredroid/nlu:v1.2.2

docker-compose pull
docker-compose up -d
```

---

## Post-Incident Review

[Questions to answer after the incident is resolved]

- [ ] What was the root cause?
- [ ] How long was the alert firing? (Detect to resolve time)
- [ ] Could we have detected it earlier?
- [ ] What preventative measures should we add?
- [ ] What documentation needs updating?
- [ ] Should we hold a postmortem meeting?

---

## Related Alerts

[Other alerts that often fire together or are related]

- Alert X (may indicate cascade failure)
- Alert Y (can be mistaken for this one)
- Alert Z (usually fires first, this one fires second)

---

## Related Dashboard Sections

- [Master Clinical Intelligence - NLU Intelligence](http://grafana:3000/d/master-clinical-intelligence?var-timeRange=now-6h) - Panels X, Y, Z
- [System Health Dashboard](http://grafana:3000/d/system-health) - Resource usage section
- [Tool Performance Dashboard](http://grafana:3000/d/tool-performance) - Error tracking

---

## Useful Links

- **Prometheus**: [View this alert rule in Prometheus](http://prometheus:9090/alerts) → Search for alert name
- **Alertmanager**: [View alert status](http://alertmanager:9093) → Silencing and routing rules
- **Service Logs**: [View service logs in Kibana](http://kibana:5601) → Search by service name
- **Git History**: `git log --oneline -10 [relevant-file]`

---

## FAQ

**Q: How long until this resolves on its own?**  
A: This alert will not resolve on its own. Intervention is required.

**Q: Is this critical?**  
A: [Critical | Warning | Info] severity. [Description of impact on users/system]

**Q: Can I temporarily silence this alert?**  
A: Yes, but understand why it's firing first. Silence in Alertmanager UI → add label filter → set duration (1h recommended).

**Q: Who should I page if I can't reach the on-call engineer?**  
A: Try the backup on-call contact, then escalate to [manager name] or team lead.

---

**Last Updated**: [Date]  
**Owner**: [Team/Person]  
**Runbook Version**: 1.0  
**Related Batch**: Batch 14 Phase 3

---

