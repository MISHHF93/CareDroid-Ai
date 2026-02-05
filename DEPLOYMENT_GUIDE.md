# CareDroid Neural Network Deployment Guide

**Status**: ✅ READY FOR DEPLOYMENT  
**Date**: February 5, 2026  
**Phases Complete**: 3/3 (Phase 1 P0, Phase 2 All Features, Phase 3 Core)

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Architecture Overview](#architecture-overview)
3. [Deployment Phases](#deployment-phases)
4. [Configuration & Environment Variables](#configuration--environment-variables)
5. [Rollout Strategy](#rollout-strategy)
6. [Monitoring & Observability](#monitoring--observability)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality ✅
- [x] All TypeScript compilation: **PASS** (0 errors)
- [x] Phase 1 Intent Classification: **COMPLETE**
  - [x] 7 primary + 4 fallback intents
  - [x] Criticality-based thresholds (CRITICAL/HIGH/MEDIUM/LOW)
  - [x] Abstain mechanism for low-confidence
  - [x] Three-phase pipeline (keyword → NLU → LLM)

- [x] Phase 2 Neural Heads: **COMPLETE**
  - [x] Emergency Risk Head (CRITICAL/URGENT/MODERATE/LOW)
  - [x] Tool Invocation Head (9 clinical tools)
  - [x] Citation Need Head (MANDATORY/REQUIRED/OPTIONAL/NOT_REQUIRED)
  - [x] Neural Heads Orchestrator (parallel execution)
  - [x] Non-blocking async integration

- [x] Phase 3 Local Generation: **COMPLETE**
  - [x] Pre-Check Classifier (query safety assessment)
  - [x] Local Generation Service (draft generation + RAG)
  - [x] Post-Check Verifier (response safety verification)
  - [x] Generation Orchestrator (safety sandwich coordination)
  - [x] Shadow mode support

### Infrastructure Requirements
- [x] NestJS backend running
- [x] ML-services stack available (backend/ml-services/nlu)
- [x] Database connectivity verified
- [x] Redis/cache layer (if used)
- [x] Logging infrastructure in place

### Git Status ✅
- [x] All changes committed: `4 commits ahead of origin/main`
- [x] Working tree clean
- [x] Tags/Release ready

### Documentation ✅
- [x] Phase 1 Implementation Summary: COMPLETE
- [x] Phase 2 Implementation Summary: COMPLETE
- [x] Phase 3 Implementation Summary: COMPLETE
- [x] Neural Network Concerns document: UPDATED

---

## Architecture Overview

### Three-Phase Neural Network

```
┌─────────────────────────────────────────────────────────┐
│                   User Query                             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: Intent Classification Pipeline                 │
├─────────────────────────────────────────────────────────┤
│  1. Keyword Matcher    → Intent + Confidence             │
│  2. NLU Service        → Intent + Confidence             │
│  3. LLM Fallback       → Intent + Confidence             │
│                                                          │
│  Result: IntentClassification                           │
│  - intent (PrimaryIntent enum)                          │
│  - confidence (0-1)                                     │
│  - method (keyword/nlu/llm/abstain)                     │
│  - criticality (CRITICAL/HIGH/MEDIUM/LOW)              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: Task-Specific Neural Heads (Async)            │
├─────────────────────────────────────────────────────────┤
│  ├─ Emergency Risk Head       (0.6 weight)              │
│  ├─ Tool Invocation Head      (0.1 weight)              │
│  └─ Citation Need Head        (0.3 weight)              │
│                                                          │
│  Result: NeuralHeadsResult                              │
│  - aggregatedRiskScore (0-1)                            │
│  - recommendedActions (escalate/ground/etc)             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 3: Controlled Local Generation (Optional)         │
├─────────────────────────────────────────────────────────┤
│  1. Pre-Check       → Is it safe?                       │
│  2. Generation      → Local model response               │
│  3. Post-Check      → Verify safety & quality            │
│  4. Shadow Mode     → Generate but don't serve (optional)│
│  5. Fallback        → Escalate to API if needed         │
│                                                          │
│  Result: GenerationOrchestrationResult                  │
│  - finalDecision (serve_local/escalate/flag)            │
│  - responseText (if approved)                           │
│  - auditTrail (escalation events)                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  Final Response    │
         └────────────────────┘
```

### Deployment Model

- **Phase 1-2**: Enabled by default (low risk, high value)
- **Phase 3**: Disabled by default, shadow mode by default (for evaluation)
- **Fallback Chain**: Phase 3 → Phase 1-2 → External API

---

## Deployment Phases

### Phase 1: Pre-Production Validation (Day 1)

**Objectives**:
- Verify all services start correctly
- Validate configuration loading
- Test Phase 1 intent pipeline
- Monitor baseline metrics

**Actions**:
```bash
# 1. Start backend
cd backend
npm run start:dev

# 2. Verify NLU service is running
curl http://localhost:8001/health

# 3. Test Phase 1 pipeline
curl -X POST http://localhost:3000/api/classify \
  -H "Content-Type: application/json" \
  -d '{"query": "I have chest pain"}'

# 4. Check logs for errors
docker logs <backend-container>
```

**Success Criteria**:
- ✅ Backend starts without errors
- ✅ NLU service responds to health check
- ✅ Intent classification returns valid results
- ✅ No TypeScript compilation errors
- ✅ Metrics collection working

---

### Phase 2: Phase 1 & 2 Production Rollout (Day 2-3)

**Objectives**:
- Deploy Phase 1 intent classification to production
- Enable Phase 2 neural heads (non-blocking)
- Monitor classification accuracy and latency
- Establish baseline metrics

**Rollout Strategy**:
1. **1% Traffic** (Day 2): Canary deployment
   - Monitor: Latency, accuracy, escalation rates
   - Success criteria: <100ms added latency, 0 errors
   
2. **10% Traffic** (Day 2-3): Gradual increase
   - Add alerts for anomalies
   - Monitor per-intent performance
   
3. **100% Traffic** (Day 3): Full rollout
   - All users on Phase 1-2
   - Phase 3 shadow mode running

**Configuration**:
```yaml
# config/neural-network.yml
phase1:
  enabled: true
  intents:
    EMERGENCY: { threshold: 0.95 }
    EMERGENCY_RISK: { threshold: 0.85 }
    MEDICATION_SAFETY: { threshold: 0.85 }
    TOOL_SELECTION: { threshold: 0.75 }
    PROTOCOL_LOOKUP: { threshold: 0.75 }
    DOCUMENTATION: { threshold: 0.70 }
    GENERAL_CHAT: { threshold: 0.60 }

phase2:
  enabled: true
  emergencyRiskHead:
    enabled: true
  toolInvocationHead:
    enabled: true
  citationNeedHead:
    enabled: true
  asyncEnrichment: true
```

---

### Phase 3: Phase 3 Shadow Mode Deployment (Week 1-2)

**Objectives**:
- Deploy Phase 3 in shadow mode (generate, don't serve)
- Collect metrics on generation quality
- Build confidence in safety checks
- Prepare for production rollout

**Configuration**:
```yaml
phase3:
  enabled: false          # Disabled (will enable shadow mode)
  shadowMode: true        # Key: Shadow mode enabled
  preCheck:
    enabled: true
    strictMode: false
    confidenceThreshold: 0.75
  generation:
    enabled: true
    modelId: 'phi-2-7b-medical'
    temperature: 0.7
    maxTokens: 512
  postCheck:
    enabled: true
    strictMode: false
    qualityThreshold: 0.6
  orchestrator:
    enableFallback: true
    fallbackToApiOnAnyFailure: true
```

**Shadow Mode Operations**:
```bash
# 1. Enable shadow mode in config
# 2. Start generation for all queries
# 3. Run post-check verification
# 4. Never serve results (flag for human review)
# 5. Collect metrics:
#    - Generation success rate
#    - Post-check approval rate
#    - Safety issue frequency
#    - Quality score distribution
#    - Escalation reasons
```

**Success Criteria** (Week 1):
- ✅ Generation success rate > 95%
- ✅ Zero critical safety issues found
- ✅ Post-check approval rate > 70%
- ✅ Average quality score > 0.65
- ✅ No performance degradation (<50ms added latency)

---

### Phase 4: Phase 3 Production Rollout (Week 2-3)

**Prerequisites**:
- Shadow mode metrics validated
- Clinical review of sample generations
- Safety checks verified
- Rollback procedures tested

**Rollout Steps**:
1. **Low-Risk Intents Only**: GENERAL_CHAT (Days 1-2)
   - 1% of GENERAL_CHAT queries
   - Monitor: User satisfaction, escalation rate
   
2. **Expand to 5% (Days 3-4)**:
   - Add DOCUMENTATION intent
   - Monitor: Per-intent escalation rates
   
3. **Expand to 25% (Days 5-6)**:
   - Add PROTOCOL_LOOKUP intent
   - Monitor: Response quality trends
   
4. **Expand to 100% (Days 7+)**:
   - All low-risk intents
   - Maintain strict monitoring

**Configuration for Production**:
```yaml
phase3:
  enabled: true           # Enable local generation
  shadowMode: false       # Serve results now
  preCheck:
    enabled: true
    strictMode: true      # Conservative: any doubt → escalate
  generation:
    enabled: true
    temperature: 0.6      # Lower temp for more predictable results
  postCheck:
    enabled: true
    strictMode: false     # Don't fail on low quality; flag instead
    qualityThreshold: 0.65
  orchestrator:
    enableFallback: true
    fallbackToApiOnAnyFailure: true
    escalationThreshold: 0.7
```

---

## Configuration & Environment Variables

### Backend Environment Variables

```bash
# Neural Network Configuration
PHASE_1_ENABLED=true
PHASE_1_THRESHOLD_CRITICAL=0.85
PHASE_1_THRESHOLD_HIGH=0.75
PHASE_1_THRESHOLD_MEDIUM=0.70
PHASE_1_THRESHOLD_LOW=0.60

PHASE_2_ENABLED=true
PHASE_2_EMERGENCY_RISK_ENABLED=true
PHASE_2_TOOL_INVOCATION_ENABLED=true
PHASE_2_CITATION_NEED_ENABLED=true

PHASE_3_ENABLED=false
PHASE_3_SHADOW_MODE=true
PHASE_3_PRE_CHECK_ENABLED=true
PHASE_3_GENERATION_ENABLED=true
PHASE_3_POST_CHECK_ENABLED=true
PHASE_3_STRICT_MODE=false

# ML Services Configuration
ML_SERVICES_URL=http://localhost:8001
NLU_MODEL_PATH=/models/nlu/intent-classifier
LOCAL_GENERATION_MODEL_ID=phi-2-7b-medical

# Logging & Monitoring
LOG_LEVEL=info
LOG_FORMAT=json
SENTRY_DSN=https://your-sentry-dsn
PROMETHEUS_ENABLED=true
```

### Configuration Files

Create `config/neural-network.yml`:
```yaml
intents:
  primary:
    - EMERGENCY
    - EMERGENCY_RISK
    - MEDICATION_SAFETY
    - TOOL_SELECTION
    - PROTOCOL_LOOKUP
    - DOCUMENTATION
    - GENERAL_CHAT
  
  fallback:
    - CLINICAL_TOOL
    - ADMINISTRATIVE
    - MEDICAL_REFERENCE
    - GENERAL_QUERY

thresholds:
  CRITICAL: 0.95
  HIGH: 0.75
  MEDIUM: 0.70
  LOW: 0.60

phase1:
  enabled: true
  intents:
    EMERGENCY: { criticality: CRITICAL, threshold: 0.95 }
    EMERGENCY_RISK: { criticality: CRITICAL, threshold: 0.85 }

phase2:
  maxTokens: 512
  ensembleMethod: weighted_voting

phase3:
  shadowMode: true
  conversationContextLimit: 5
  ragIntegration: true
```

---

## Rollout Strategy

### Canary Deployment

1. **Deploy to 1% of users** (traffic split: 1% new, 99% old)
   ```bash
   # k8s example
   kubectl set image deployment/backend \
     backend=backend:v3-neural-network \
     --record
   
   # Istio example for traffic split
   kubectl apply -f - <<EOF
   apiVersion: networking.istio.io/v1beta3
   kind: VirtualService
   metadata:
     name: backend
   spec:
     hosts:
     - backend
     http:
     - match:
       - uri:
           prefix: /api
       route:
       - destination:
           host: backend
           subset: v3-neural
         weight: 1
       - destination:
           host: backend
           subset: v2-baseline
         weight: 99
   EOF
   ```

2. **Monitor metrics for 4 hours**:
   - API latency (p50, p95, p99)
   - Error rate
   - Classification accuracy
   - Escalation rate

3. **Gradually increase** (1% → 5% → 25% → 100%)
   - Each increase: Monitor for 2-4 hours
   - Rollback triggers: >5% error rate, >2s latency increase

### Blue-Green Deployment (Alternative)

1. Deploy v3 (neural network) to green environment
2. Run smoke tests against green
3. Switch load balancer: blue → green
4. Keep blue running (rollback target)
5. Monitor for 24 hours
6. Retire blue after confidence window

---

## Monitoring & Observability

### Key Metrics to Track

#### Phase 1 Intent Classification
```
# Prometheus metrics
intent_classification_latency_ms           # Histogram
intent_classification_accuracy_percent     # Gauge per intent
intent_abstain_rate_percent               # Rate of low-confidence abstentions
intent_phase_duration_ms                   # Per-phase latency (keyword/nlu/llm)
intent_threshold_violations_total          # Count of threshold misses
```

#### Phase 2 Neural Heads
```
emergency_risk_head_latency_ms
emergency_risk_head_severity_distribution   # CRITICAL/URGENT/MODERATE/LOW rates
tool_invocation_head_routing_accuracy_percent
citation_need_head_accuracy_percent
neural_heads_aggregated_risk_score          # Distribution of risk scores
```

#### Phase 3 Local Generation
```
local_generation_pre_check_safe_rate_percent
local_generation_success_rate_percent
local_generation_post_check_approval_rate_percent
local_generation_quality_score              # Histogram
local_generation_escalation_rate_percent    # Why? (breakdown by reason)
local_generation_response_latency_ms
local_generation_phi_detection_rate_percent
local_generation_citation_rate_percent
```

### Dashboards

Create Grafana dashboards:
1. **Neural Network Overview**
   - Phase 1-3 enabled status
   - Overall accuracy trend
   - Latency over time
   
2. **Phase 1 Detail**
   - Per-intent accuracy
   - Per-phase latency
   - Confidence distribution
   
3. **Phase 2 Detail**
   - Head execution times
   - Risk score distribution
   - Aggregated risk trends
   
4. **Phase 3 Detail**
   - Shadow mode metrics
   - Safety check breakdown
   - Quality score trends
   - Escalation reasons

### Alerting Rules

```yaml
groups:
- name: neural_network
  rules:
  # Critical alerts (page on-call)
  - alert: IntentClassificationErrorRateHigh
    expr: rate(intent_classification_errors_total[5m]) > 0.01
    for: 1m
    annotations:
      severity: critical
      
  - alert: PhaseThreeEscalationRateCritical
    expr: local_generation_escalation_rate_percent > 30
    for: 5m
    annotations:
      severity: critical
  
  # Warning alerts
  - alert: IntentClassificationLatencyHigh
    expr: intent_classification_latency_ms{quantile="0.95"} > 200
    for: 5m
    annotations:
      severity: warning

  - alert: LocalGenerationQualityLow
    expr: local_generation_quality_score < 0.6
    for: 10m
    annotations:
      severity: warning
```

---

## Rollback Procedures

### Immediate Rollback (If Critical Issue)

```bash
# Option 1: Revert commit
git revert <commit-hash>
npm run build && npm run deploy

# Option 2: Disable Phase 3 (fastest)
# Edit config, set: phase3.enabled = false
kubectl rollout restart deployment/backend

# Option 3: Traffic split rollback (immediate, no restart)
kubectl patch virtualservice backend --type merge -p \
  '{"spec":{"http":[{"route":[{"destination":{"subset":"v3"},"weight":0},{"destination":{"subset":"v2"},"weight":100}]}]}}'
```

### Gradual Rollback

```bash
# Decrease traffic to new version: 5% → 2% → 0%
for weight in 5 2 0; do
  kubectl patch vs backend --type merge -p \
    "{\"spec\":{\"http\":[{\"route\":[{\"destination\":{\"subset\":\"v3\"},\"weight\":$weight}]}]}}"
  sleep 300  # Monitor for 5 mins
done
```

### Data-Level Rollback

If Phase 3 generated bad data:
1. Query for affected records: `where generation_phase = 3 AND timestamp > <rollback-time>`
2. Mark as invalid: `update table set is_valid = false where ...`
3. Regenerate with fallback: Call external API for affected queries
4. Audit trail: Log all rollback actions

---

## Troubleshooting

### Issue: High Latency After Deployment

**Symptoms**: Intent classification taking >200ms (was 50ms)

**Investigation**:
```bash
# Check if Phase 2 is blocking
- Is async enrichment working? Check logs for "Phase 2 enrichment timeout"
- Check NLU service latency: curl http://localhost:8001/health
- Check LLM fallback rate: If NLU fails often, LLM adds latency

# Solution:
- Increase Phase 2 timeout (default 1s)
- Disable Phase 2 enrichment if needed: phase2.enabled = false
- Optimize NLU inference (batch predictions, use GPU)
```

### Issue: Low Classification Accuracy

**Symptoms**: Intent misclassification rate >10%

**Investigation**:
```bash
# 1. Check which intents are affected
docker exec backend \
  grep "confidence.*<.*threshold" logs/intent-classifier.log | \
  awk '{print $NF}' | sort | uniq -c

# 2. Check if NLU model is stale
curl http://localhost:8001/model-info

# 3. Check threshold configuration
grep -A 20 "thresholds:" config/neural-network.yml
```

**Solution**:
- Retrain Phase 1 NLU model on recent data
- Adjust per-intent thresholds downward (if overly conservative)
- Check if new query types are emerging (update taxonomy)

### Issue: Phase 3 Generating Low-Quality Responses

**Symptoms**: Post-check approval rate <50%

**Investigation**:
```bash
# 1. Check what's failing post-check
docker exec backend \
  grep "post_check_failed\|recommended_action" logs/generation.log | \
  tail -100

# 2. Review specific failures
# Look for patterns: PHI issues? Contradictions? Poor coherence?

# 3. Check configuration
cat config/neural-network.yml | grep -A 5 "postCheck:"
```

**Solution**:
- Stay in shadow mode longer (collect more metrics)
- Lower `generation.temperature` (more predictable)
- Improve RAG grounding (add more clinical documents)
- Retrain local model with better RLHF data

### Issue: Escalation Rate Too High

**Symptoms**: Phase 3 escalating >40% of requests

**Investigation**:
```bash
# 1. Which component is escalating?
docker exec backend \
  grep "reason.*escalation" logs/generation.log | \
  awk -F: '{print $NF}' | sort | uniq -c

# 2. Check pre-check keyword sensitivity
grep -B 5 -A 20 "unsafeKeywords" \
  backend/src/modules/medical-control-plane/local-generation/services/pre-check.classifier.ts

# 3. Check post-check quality threshold
cat config/neural-network.yml | grep qualityThreshold
```

**Solution**:
- Reduce false positives in pre-check (less conservative thresholds)
- Relax post-check quality thresholds (if safe)
- Retrain or fine-tune local generation model
- Increase RAG document quality/relevance

---

## Deployment Checklist

### Pre-Deployment (24 hours before)

- [ ] All TypeScript compiles: `npm run build`
- [ ] All tests pass: `npm run test`
- [ ] Code review approved
- [ ] Security scan passed
- [ ] Documentation updated
- [ ] Rollback procedure tested
- [ ] On-call engineer briefed
- [ ] Monitoring/alerting configured
- [ ] Configuration values verified

### Deployment Day

- [ ] Database backups verified
- [ ] Logging verified (Kibana/Datadog accessible)
- [ ] Metrics collection running (Prometheus scraping)
- [ ] Dashboards ready (Grafana loaded)
- [ ] Slack notifications enabled
- [ ] PagerDuty integration verified
- [ ] Runbook accessible to on-call

### Deployment Execution

- [ ] Deploy to canary (1% traffic)
- [ ] Monitor for 4 hours
- [ ] Verify SLOs (latency p99 <200ms, errors <1%)
- [ ] Increase to 5%
- [ ] Monitor for 4 hours
- [ ] Increase to 25%
- [ ] Monitor for 2 hours
- [ ] Increase to 100%
- [ ] Monitor for 24 hours
- [ ] Declare success

### Post-Deployment (7 days)

- [ ] Collect baseline metrics
- [ ] Review error patterns
- [ ] User feedback collected
- [ ] Performance stable
- [ ] No regressions observed
- [ ] Close deployment issue
- [ ] Archive runbook

---

## Success Criteria

### Phase 1-2 Deployment Success

✅ **Availability**: 99.9% uptime  
✅ **Latency**: p99 < 200ms (Phase 1-2 adds <100ms)  
✅ **Accuracy**: Intent classification accuracy > 90%  
✅ **Safety**: Zero emergency detection misses  
✅ **User Experience**: <1% user complaints about classifications  

### Phase 3 Shadow Mode Success

✅ **Generation Success Rate**: >95%  
✅ **Post-Check Approval Rate**: >70%  
✅ **Safety**: Zero PHI leaks detected  
✅ **Quality**: Average quality score > 0.65  
✅ **Performance**: <50ms added latency  

### Phase 3 Production Success

✅ **Availability**: 99.95% uptime  
✅ **Accuracy**: Response quality rating > 4/5 from experts  
✅ **Safety**: Zero critical safety issues  
✅ **Cost**: Local generation reduces API costs by 30%+  
✅ **User Satisfaction**: NPS improvement or maintained  

---

## Support & Escalation

**Deployment On-Call**: [Team Contact]  
**Escalation Path**: On-Call → Tech Lead → Director  
**Incident Channel**: #neural-network-incidents  
**Documentation**: [Link to runbook]

---

## Related Documentation

- [Phase 1 Implementation Summary](./PHASE1_IMPLEMENTATION_SUMMARY.md)
- [Phase 2 Implementation Summary](./PHASE2_IMPLEMENTATION_SUMMARY.md)
- [Phase 3 Implementation Summary](./PHASE3_IMPLEMENTATION_SUMMARY.md)
- [Neural Network Concerns & Architecture](./docs/CAREDROID_NEURAL_NETWORK_CONCERNS.md)

---

**Last Updated**: February 5, 2026  
**Deployment Status**: READY FOR PRODUCTION  
**Next Review**: Post-deployment success verification
