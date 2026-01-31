# Alert Runbook: NluConfidenceDropping

**Alert Severity**: 🟡 **WARNING**  
**Module**: NLU (Intent Classification)  
**Dashboard Panels**: 2, 10, 11, 15, 17, 18, 19  
**Related Metrics**: `nlu_confidence_scores` (average < 0.6 for 5+ minutes)

---

## What This Alert Means

The NLU system's intent classification confidence has dropped below 60% on average. This means the system is less certain about what the user intends to do. When confidence is low, users may get irrelevant tool suggestions or fallback to the slower LLM model. User experience degrades, latency increases, and costs spike.

---

## Quick Diagnosis (< 2 minutes)

1. **Open dashboard**: [Master Clinical Intelligence - NLU Intelligence section](http://grafana:3000/d/master-clinical-intelligence?var-timeRange=now-6h)
2. **Look at Panel 15** (Overall Confidence Trend): Is the line trending DOWN? In RED zone (<0.6)?
3. **Ask yourself**: Did we deploy code in the last 30 minutes? Did we change training data?

---

## Common Root Causes

### Root Cause 1: Recent Model Deployment Gone Wrong
- **Symptom**: Confidence dropped right after a deployment 
- **Verification**: Check `git log --oneline -5 backend/src/modules/intent-classifier/` for recent model changes
- **Impact**: New model is worse than old one

### Root Cause 2: Training Data Distribution Shift
- **Symptom**: Confidence was stable, then gradually declined over hours
- **Verification**: Check Panel 10 (Avg Confidence by Intent). Is ONE intent tanking (e.g., "emergency" drops to 0.2 while others stay at 0.8)?
- **Impact**: Model has learned patterns that don't apply to current users

### Root Cause 3: Out-of-Distribution User Input
- **Symptom**: Confidence fine in test, drops only in production on real user queries
- **Verification**: Look at chat logs - are users asking weird questions? Foreign language? Mixing medical with other domains?
- **Impact**: Training data doesn't cover real-world variation

### Root Cause 4: Model Weights Corrupted
- **Symptom**: Confidence suddenly drops to 0.0 or NaN values
- **Verification**: Check model file checksum: `md5sum models/nlu-model-v*.bin`
- **Impact**: Model can't run properly

### Root Cause 5: Circuit Breaker Open
- **Symptom**: Panel 12 or 13 shows circuit breaker is open (state = 1)
- **Verification**: Check Panel 14 (Circuit Breaker Events) - did breaker trip?
- **Impact**: NLU service failing, falling back to LLM for everything (expensive)

---

## Investigation Checklist

### Step 1: Verify Alert is Persistent (Not Flaky)
- [ ] In Prometheus, check alert has been firing for 5+ minutes consecutively
- [ ] Look at Panel 15 - is the low confidence sustained or just a spike?

### Step 2: Check Service Health
- [ ] `docker-compose ps | grep "nlu\|intent"` - Is NLU service running?
- [ ] `docker-compose logs nlu-service --since 30m` - Any errors in last 30 minutes?
- [ ] Check CPU/memory: `docker stats nlu-service` - Is it resource-constrained?

### Step 3: Inspect Related Metrics
- [ ] Panel 1 (Classification Distribution): What % are using keyword vs model vs LLM?
  - If model usage down, check Panel 12 (circuit breaker)
  - If LLM usage up, indicates fallback happening (expensive!)
- [ ] Panel 10 (Avg Confidence by Intent): Which specific intents are low?
  - If all intents low equally → likely model problem
  - If ONE intent low → likely training data gap for that intent
- [ ] Panel 3 (Keyword Phase Latency): Is it still fast? Or increased?
- [ ] Panel 6 (Phase 1 Rate Gauge): Are we still using keyword phase? Or skipping it?

### Step 4: Check Recent Deployments/Changes
- [ ] `git log --oneline -10 backend/src/modules/intent-classifier/` - What changed?
- [ ] `git log --oneline -10 backend/src/modules/chat/` - Chat service changes?
- [ ] `git log --oneline -10 backend/src/modules/metrics/nlu-metrics.service.ts` - Metrics changes?
- [ ] Check environment variables: `docker-compose config | grep -i nlu`

### Step 5: Check Model Integrity
- [ ] Check model file exists: `ls -la backend/models/nlu-model-*.bin`
- [ ] Verify checksum: Compare with git LFS metadata
- [ ] Check model load logs: `docker-compose logs backend | grep -i "model loaded\|model error"`

### Step 6: Analyze Chat Pattern
- [ ] Open Kibana logs: Search `module: "intent-classifier"` in last 30 minutes
- [ ] Look for: Queries with low confidence scores (< 0.5)
- [ ] Pattern: Do they share common words? Different language? New topic?

---

## Resolution Steps

### Option A: Rollback Recent Deployment
```bash
# If confidence dropped right after a deployment
# Check what changed
git diff HEAD~1 backend/src/modules/intent-classifier/

# Rollback to previous version
git checkout HEAD~1 -- backend/src/modules/intent-classifier/

# Rebuild and restart
docker-compose up -d --build backend

# Monitor Panel 15 for 2 minutes
# After ~30 seconds, you should see confidence recovering
```

### Option B: Reload Model from Backup
```bash
# If model weights corrupted
# Restore from previous version
docker-compose exec backend bash
$ cp models/nlu-model-v2.5-backup.bin models/nlu-model-v2.5.bin

# Restart service for model reload
docker-compose restart backend
```

### Option C: Check Circuit Breaker (Likely Culprit)
```bash
# If Panel 12 shows circuit breaker open
# Check why it opened
docker-compose logs nlu-service --since 10m | grep -i "circuit\|open\|fail"

# Option 1: Restart NLU service to close breaker
docker-compose restart nlu-service

# Monitor Panel 12 for status change (should show 0 = closed within 30 sec)

# Option 2: If external service (LLM, Redis) is down, fix that first
docker-compose ps | grep redis
docker-compose restart redis
```

### Option D: Check Model Version and Force Reload
```bash
# Force model reload without deployment
docker-compose exec backend npm run cli rebuild-nlu-cache

# Or manually trigger reinitialization
docker-compose exec backend npm run cli reload-model --model nlu --version latest

# Monitor dashboard for 2 minutes
```

---

## How to Verify Resolution

- [ ] Panel 15 (Overall Confidence) back above 0.6 threshold
- [ ] Alert status in Alertmanager changes to "resolved"
- [ ] Panel 1 shows reasonably balanced distribution (not 90% LLM)
- [ ] No errors in NLU service logs
- [ ] Panel 3-8 show normal latency levels

**Confidence is resolved when**:
- Mean confidence > 0.65
- Distribution normalized (high confidence intents back to 0.8+)
- Classification method distribution reasonable: 30-50% keyword, 40-60% model, <20% LLM

---

## Escalation Procedure

### Level 1: Initial Response (5 minutes)
- **Who**: On-call engineer
- **Action**: Follow investigation checklist → try Options A-D
- **Escalation timeout**: 5 minutes → if not resolved, escalate

### Level 2: Escalation to NLU Lead (15 minutes)
- **Who**: NLU team lead
- **Action**: Deep dive into model performance, may need to retrain
- **Tools**: Access to training pipeline, evaluation metrics
- **Decision timeout**: 15 minutes → if not resolved, escalate

### Level 3: Emergency Response (30 minutes)
- **Who**: Engineering director
- **Action**: Disable NLU, force all queries to LLM (expensive but works)
- **Or**: Revert to previous stable model version from backup
- **Impact**: Slower response time, higher cost, but service stays up

---

## Prevention for Next Time

### Monitoring Improvements
- [ ] Add a pre-alert at 0.65 confidence (5 minutes before actual alert at 0.6)
- [ ] Add trending alert: Alert if confidence declining over last 6 hours (even if not <0.6 yet)
- [ ] Add per-intent monitoring: Alert if any single intent drops below 0.5

### Testing Improvements
- [ ] Require confidence benchmark test before model deployment: "Verify benchmark confidence >= 0.7"
- [ ] Add canary test: Deploy model to 10% of traffic first, check confidence for 5 minutes
- [ ] Unit test: Verify model can classify all intent types with >0.6 confidence

### Deployment Improvements
- [ ] Require peer review of any model changes
- [ ] Deployment checklist: "Confirm Panel 15 stays >0.6 during canary phase"
- [ ] Automatic rollback if confidence drops >20% in first 2 minutes after deployment

### Training Data Improvements
- [ ] Monthly accuracy audit: Run model against hold-out test set
- [ ] Quarterly retraining with new user queries
- [ ] Feedback loop: When users correct intent, add to training data

---

## Rollback Procedure (If Resolution Makes It Worse)

```bash
# If your fix made things worse
# Revert everything
git checkout HEAD~2 -- backend/src/modules/intent-classifier/
docker-compose down
docker-compose up -d --build

# Or switch to LLM-only mode as emergency fallback
docker-compose exec backend npm run cli set-fallback-mode --mode llm-only
```

---

## Post-Incident Review

- [ ] Root cause: Was it deployment? Model? Data? External service?
- [ ] MTTR: How long did alert fire before resolution?
- [ ] Detection: Could we have caught it in testing?
- [ ] Prevention: What process change prevents this?
- [ ] User impact: How many users experienced issues? Did they get degraded experience?

---

## Related Alerts

- `NluCircuitBreakerOpen` - If this fires together with NluConfidenceDropping, circuit breaker likely cause
- `LlmFallbackSpike` - Will likely fire if confidence drops (more LLM fallbacks)
- `IntentMismatchIncreasing` - May correlate (low confidence → more user corrections)
- `HighToolErrorRate` - May follow (wrong intent classification → wrong tool used → errors)

---

## Dashboard & Logs

- **Dashboard Panel 15**: [Overall Confidence Trend](http://grafana:3000/d/master-clinical-intelligence?panelId=15&fullscreen)
- **Dashboard Panel 10**: [Avg Confidence by Intent](http://grafana:3000/d/master-clinical-intelligence?panelId=10&fullscreen)
- **Logs**: [Search NLU errors in Kibana](http://kibana:5601/app/discover#/?_a=(query:(match:(module:(query:intent-classifier)))))

---

**Last Updated**: January 30, 2026  
**Runbook Version**: 1.0  
**Owner**: NLU Team  
**Severity**: WARNING - User experience degradation

---
