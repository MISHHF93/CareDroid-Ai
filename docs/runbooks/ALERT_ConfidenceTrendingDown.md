# Alert Runbook: ConfidenceTrendingDown

**Severity**: WARNING  
**Category**: NLU Degradation  
**SLI Impact**: SLI-1 (Intent Classification Accuracy)  
**Response Time**: 5 minutes to acknowledge, 15 minutes to initial action  

---

## What This Alert Means

Intent classification confidence scores are declining over 3+ hours. The NLU model's ability to understand user intent is getting worse. This is a **trend alert** - it's not a crisis yet, but will become one in 6-24 hours if the trend continues.

**Normal Baseline**: ~92-94% confidence  
**Warning Threshold**: Declining <2% per hour for 3+ hours  
**Critical Threshold**: Declining >5% per hour (will hit 50% in 8 hours)

---

## Quick Diagnosis (2 minutes)

1. **Check NLU confidence graph**:
   - Navigate to Master Clinical Intelligence dashboard, Panel 2
   - See the trend line - is it downward?
   - Click to see breakdown by intent type

2. **Determine if it's a problem**:
   - Has confidence dropped <85%? → Critical, users may notice
   - Between 85-90%? → Significant, needs investigation
   - Above 90%? → Normal, no action needed (alert may be too sensitive)

3. **Check related alerts**:
   - Is `NluCircuitBreakerOpen` firing? → NLU service unavailable
   - Is `NluPhaseLatencyHigh` firing? → Model inference slow
   - Is `HighCPUUsage` firing? → Resource contention

---

## Common Root Causes

### Cause 1: Recent Deployment
**Symptoms**:
- Confidence drops right after deployment
- Specific intent types drop more than others
- Model weights or preprocessing changed

**Investigation**:
```bash
# Check recent deployments
git log --oneline -10

# Check which commit (specific change to NLU)
git show <commit-hash> -- backend/ml-services/nlu/

# Check git history of model training config
git log --oneline -- config/ml/nlu_training_config.yaml | head -5

# If on Kubernetes, check deployment restart times
kubectl get deployment nlu -o json | jq '.status.conditions'

# Check NLU service logs for errors
docker logs backend-nlu | tail -200 | grep -i error
```

**Fix**: See "Rollback NLU Model" in Resolution section

---

### Cause 2: Training Data Distribution Shift
**Symptoms**:
- Confidence for some intent types drops more than others
- New users or different patient demographics
- Seasonal change in query patterns

**Investigation**:
```bash
# Check intent type distribution
curl http://localhost:9090/api/v1/query?query='count(intent_classification_confidence) by (intent_type)'

# Compare to baseline (week ago)
curl http://localhost:9090/api/v1/query?query='count(intent_classification_confidence) by (intent_type) offset 7d'

# Check for new user cohorts
docker exec postgresql psql -U postgres care_droid -c \
  "SELECT user_id, COUNT(*) as queries, AVG(confidence) as avg_confidence 
   FROM intent_classifications 
   WHERE created_at > now() - interval '3 hours'
   GROUP BY user_id 
   ORDER BY COUNT(*) DESC LIMIT 20;"

# Look for out-of-distribution queries
# (queries similar to training data should be high confidence)
# Manual: Check a few low-confidence classifications
docker exec postgresql psql -U postgres care_droid -c \
  "SELECT intent, confidence, user_input 
   FROM intent_classifications 
   WHERE confidence < 0.70 
   AND created_at > now() - interval '3 hours'
   LIMIT 10;"
```

**Fix**: See "Retrain NLU Model" in Resolution section

---

### Cause 3: Out-of-Distribution (OOD) User Input
**Symptoms**:
- Model was trained on medical professionals, now getting layperson input
- Queries are in different language or medical specialty
- Context is unusual (e.g., pediatric vs geriatric)

**Investigation**:
```bash
# Manually inspect last 20 low-confidence classifications
docker exec postgresql psql -U postgres care_droid -c \
  "SELECT user_id, user_input, predicted_intent, confidence 
   FROM intent_classifications 
   WHERE confidence < 0.70 
   AND created_at > now() - interval '1 hour'
   ORDER BY confidence ASC
   LIMIT 20;"

# Check one example in detail
# (discuss manually with medical team if patterns detected)
```

**Fix**: See "Update Training Data" in Resolution section

---

### Cause 4: Model Weights Corrupted
**Symptoms**:
- Confidence drops consistently for all intents
- No recent deployment or change
- Symmetrical drop across all intent types

**Investigation**:
```bash
# Check NLU service health
curl http://localhost:8001/health

# Force model reload in NLU service
curl -X POST http://localhost:8001/api/reload-model

# Check model file integrity
docker exec backend-nlu ls -la /app/models/
# Look for recent modification times

# Check model file size (if corrupted, might be smaller)
docker exec backend-nlu du -h /app/models/ | sort -h

# Verify model is valid PyTorch
python3 << 'EOF'
import torch
model_path = "/path/to/model.pt"
try:
    model = torch.load(model_path)
    print("Model valid:", model.keys())
except Exception as e:
    print("Model corrupted:", e)
EOF
```

**Fix**: See "Restore Model Backup" in Resolution section

---

### Cause 5: Circuit Breaker Degradation
**Symptoms**:
- Confidence drops alongside increased fallback rate
- More requests are failing fast before reaching NLU
- Latency may be high

**Investigation**:
```bash
# Check circuit breaker metrics
curl http://localhost:9090/api/v1/query?query='nlu_circuit_breaker_state'
curl http://localhost:9090/api/v1/query?query='rate(llm_fallback_spike[5m])'

# Check how many requests fallback vs use NLU
curl http://localhost:9090/api/v1/query?query='rate(nlu_inference_total) vs rate(http_requests_total)'

# Check NLU latency
curl http://localhost:9090/api/v1/query?query='histogram_quantile(0.95, nlu_inference_duration_seconds_bucket)'

# If latency high, circuit breaker may be rejecting requests
# This looks like low confidence, but it's actually missing inferences
```

**Fix**: Investigate root cause for latency increase separately

---

## Investigation Checklist

- [ ] Check confidence trend graph (declining slope, how fast?)
- [ ] Identify if all intent types drop or just specific ones
- [ ] Check recent deployments or config changes
- [ ] Sample low-confidence classifications manually (see actual queries)
- [ ] Check if new user cohort or demographic shift
- [ ] Check NLU service health and logs
- [ ] Check circuit breaker state
- [ ] Verify model files exist and not corrupted
- [ ] Assess estimated time to critical (if trend continues)

---

## Resolution Steps

### Option 1: Rollback NLU Model (Fastest - 10 minutes)
If confidence dropped after a recent deployment:

```bash
# 1. Check recent deployments
git log --oneline -5

# 2. Identify last known good deployment
# (Usually the one before current)
LAST_GOOD_COMMIT="<commit-hash-from-git-log>"

# 3. Rollback to previous model
git checkout $LAST_GOOD_COMMIT -- backend/ml-services/nlu/

# 4. Rebuild NLU container
docker build -f backend/ml-services/nlu/Dockerfile \
  -t caredroid/nlu:rollback \
  backend/ml-services/nlu/

# 5. Restart NLU service
docker-compose restart nlu

# 6. Wait 30 seconds for service to start
sleep 30

# 7. Verify health
curl http://localhost:8001/health

# 8. Monitor confidence metric
watch -n 5 'curl http://localhost:9090/api/v1/query?query="intent_classification_confidence" 2>/dev/null | jq'

# Expected: Confidence should return to baseline within 5 minutes
```

**Time to resolution**: 10-15 minutes  
**Confidence recovery**: Immediate after service restart  
**Risk**: May lose recent improvements from the deployment

### Option 2: Retrain NLU Model (30-60 minutes)
If training data distribution shifted:

```bash
# 1. Collect fresh training data
# (assuming you have a labeled dataset)
python3 backend/ml-services/nlu/scripts/collect_training_data.py \
  --output /tmp/training_data_latest.csv \
  --lookback-days 7

# 2. Analyze new data
python3 << 'EOF'
import pandas as pd
df = pd.read_csv('/tmp/training_data_latest.csv')
print("Intent distribution:")
print(df['intent'].value_counts())
print("\nNew intents:", df[df['confidence'] < 0.70])
EOF

# 3. Retrain model
cd backend/ml-services/nlu/
python3 scripts/train_model.py \
  --training-data /tmp/training_data_latest.csv \
  --epochs 3 \
  --output /tmp/nlu_model_new.pt

# 4. Evaluate on holdout test set
python3 scripts/evaluate_model.py \
  --model /tmp/nlu_model_new.pt \
  --test-data /tmp/test_data.csv

# 5. If metrics improved, deploy new model
cp /tmp/nlu_model_new.pt backend/ml-services/nlu/model/intent_classifier.pt

# 6. Rebuild and deploy
docker build -f backend/ml-services/nlu/Dockerfile \
  -t caredroid/nlu:retrained \
  backend/ml-services/nlu/

docker-compose up -d nlu

# 7. Monitor confidence
watch -n 10 'curl http://localhost:9090/api/v1/query?query="intent_classification_confidence" 2>/dev/null | jq'

# Expected: Confidence should improve within 5-10 minutes
```

**Time to resolution**: 30-60 minutes (including retraining)  
**Confidence recovery**: 10-30% improvement  
**Risk**: If training data bad, could make things worse - verify on test set first

### Option 3: Restore Model Backup (15 minutes)
If model is corrupted:

```bash
# 1. Check backup location
ls -la /backups/nlu_model_*.pt

# 2. Find most recent backup before problem started
ls -la /backups/nlu_model_*.pt | tail -5

# 3. Restore backup
BACKUP_FILE=$(ls -t /backups/nlu_model_*.pt | head -1)
echo "Restoring from: $BACKUP_FILE"

cp $BACKUP_FILE backend/ml-services/nlu/model/intent_classifier.pt

# 4. Restart service
docker-compose restart nlu

# 5. Verify
sleep 10
curl http://localhost:8001/health

# 6. Check confidence metric within 5 minutes
```

**Time to resolution**: 15 minutes  
**Confidence recovery**: Full (returns to backup state)  
**Risk**: May lose recent queries not yet in backup

### Option 4: Update Training Pipeline (1-2 hours)
If OOD or demographic shift detected:

```bash
# 1. Identify what changed
# (manual review with medical team)

# 2. Update training data collection to include new patterns
# Edit: backend/ml-services/nlu/scripts/collect_training_data.py

# 3. Add new intent types if discovered
# Edit: backend/ml-services/nlu/config/intent_types.yaml

# 4. Retrain (same as Option 2)
cd backend/ml-services/nlu/
python3 scripts/train_model.py --epochs 5 --learning-rate 0.0001

# 5. Commit changes
git add backend/ml-services/nlu/
git commit -m "fix: update NLU training data for new intent types"

# 6. Deploy
git push origin main
```

**Time to resolution**: 1-2 hours (includes manual review)  
**Confidence recovery**: 20-50% improvement  
**Risk**: Requires manual review of new patterns first

---

## Verification

After taking action, verify the fix:

1. **Check confidence trend** (Master Clinical Intelligence, Panel 2)
   - Should see upward slope within 5 minutes (if model rollback)
   - Should see recovery within 10-30 minutes (if retrained)

2. **Verify specific intent types**
   ```bash
   curl http://localhost:9090/api/v1/query?query='intent_classification_confidence' | jq '.data.result[] | select(.labels.intent_type) | .value'
   ```
   - All should be > 90% for normal operation
   - If any <85%, they need specific attention

3. **Check fallback rate didn't increase**
   ```bash
   # Fallback rate should be <10%
   curl http://localhost:9090/api/v1/query?query='rate(llm_fallback_spike[5m])' | jq '.data.result[0].value[1]'
   ```

4. **Check if alert clears**
   - Once confidence recovers and stops declining, alert should auto-clear

---

## Escalation

- **If confidence drops below 80%**: Page on-call engineer immediately
- **If still dropping after 30 minutes**: Escalate to NLU team lead
- **If no recovery after 2 hours**: Escalate to engineering director

**Escalation Contacts**:
- On-call Engineer: `@caredroid-oncall`
- NLU Lead: `@nlu-team-lead`
- Director: `@director`

---

## Prevention

1. **Monitor confidence continuously**: Set up dashboard alert for trend
2. **Test deployments**: Always validate model on test set before deploying
3. **Version training data**: Keep all training datasets labeled by date
4. **Automated testing**: Add unit tests for model inference quality
5. **Feature validation**: When adding new user cohorts, validate model on that cohort first

---

## Related Documentation

- **NLU Confidence Dropping (Static Alert)**: ALERT_NluConfidenceDropping.md
- **Master Dashboard Panel 2**: intent_classification_confidence
- **SLI-1 (Intent Accuracy)**: SLI_SLO.md#sli-1

---

**Alert Runbook Complete** | January 30, 2026 | Phase 4
