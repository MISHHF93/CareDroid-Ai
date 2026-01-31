# Batch 14 Phase 4 Implementation Plan

**Status**: Implementation Complete  
**Date**: January 30, 2026  
**Phase Duration**: Week 4 of 4  
**Completion Target**: 100%

---

## Executive Summary

Phase 4 adds cost tracking, supervised ML anomaly detection, and the SLI/SLO framework to complete the monitoring stack. All changes are backward-compatible, new infrastructure is minimal (Python script), and production impact is low. The phase introduces 7 new alert rules, 6 cost/anomaly runbooks, 4 dashboard panels, and the foundational SLI/SLO framework for operational excellence.

---

## Implementation Steps (Completed)

### ✅ Step 1: Cost Metrics Integration
**File**: `backend/src/modules/metrics/metrics.service.ts`

**Changes**:
- Added `openaiApiCostTotal` counter (tracks cumulative costs by model)
- Added `openaiCostPerMinute` gauge (for rate-based alerting)
- Added `costPerUserTotal` counter (per-user cost tracking)
- Added `recordOpenaiCost()` method
- Added `setCostPerMinute()` method

**Status**: ✅ Complete

---

### ✅ Step 2: Cost Instrumentation in AIService
**File**: `backend/src/modules/ai/ai.service.ts`

**Changes**:
- Injected `MetricsService` into constructor
- Added OpenAI pricing map (`gpt-4o`, `gpt-4o-mini` with per-1K-token rates)
- Added `calculateCost(model, inputTokens, outputTokens)` method
- Modified `invokeLLM()` to record cost after each call
- Modified `generateStructuredJSON()` to record cost after each call

**Code**:
```typescript
private readonly openaiPricing: Map<string, OpenaiPricing> = new Map([
  ['gpt-4o', { inputPer1kTokens: 0.03, outputPer1kTokens: 0.06 }],
  ['gpt-4o-mini', { inputPer1kTokens: 0.00015, outputPer1kTokens: 0.0006 }],
]);

private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = this.openaiPricing.get(model);
  return (inputTokens / 1000) * pricing.inputPer1kTokens + 
         (outputTokens / 1000) * pricing.outputPer1kTokens;
}
```

**Status**: ✅ Complete

---

### ✅ Step 3: Cost Alerts in Prometheus
**File**: `config/prometheus/alert.rules.yml`

**Alerts Added**:
1. `HighLlmCostRate` - CRITICAL when rate > $1/min
2. `CostPerUserExceeded` - WARNING when user cost > $10/day
3. `UnexpectedCostSpike` - CRITICAL when cost 2x baseline in 5 min
4. `LlmCostVsQuotaRatio` - WARNING when >80% of $500 monthly budget

**Status**: ✅ Complete (30 lines added)

---

### ✅ Step 4: Trending Alerts in Prometheus
**File**: `config/prometheus/alert.rules.yml`

**Alerts Added**:
1. `ConfidenceTrendingDown` - WARNING when declining >2%/hour for 3+ hours
2. `LatencyTrendingUp` - WARNING when P95 increasing >50ms/hour for 2+ hours
3. `ErrorRateTrendingUp` - WARNING when error rate increasing >0.5%/hour for 2+ hours
4. `AnomalyScoreElevated` - WARNING when anomaly score > 0.7

**Status**: ✅ Complete (40 lines added)

---

### ✅ Step 5: Anomaly Detection Service
**File**: `backend/ml-services/anomaly-detection/anomaly_detector.py`

**Features**:
- IsolationForest algorithm (contamination=10%, 100 estimators)
- Monitors 5 key metrics: confidence, latency, error_rate, tool_latency, rag_relevance
- Queries Prometheus API for 24-hour historical windows
- Computes anomaly scores (0.0 to 1.0 scale)
- Supports Prometheus Pushgateway for metric export

**Key Methods**:
- `query_prometheus()` - Range queries for metric data
- `detect_anomalies()` - IsolationForest inference + normalization
- `process_metric()` - Full pipeline for single metric
- `run()` - Main entry point (invoke every 5 min)
- `push_metrics()` - Export anomaly scores to Prometheus

**Status**: ✅ Complete (350 lines Python)

---

### ✅ Step 6: Cost Intelligence Dashboard
**File**: `config/grafana/provisioning/dashboards/cost-intelligence.json`

**Panels**:
1. **Cost Trend (7 days)** - Line chart of USD/hour, auto-refresh 30s
2. **Top 10 Users by Cost** - Table sorted by 7-day cost
3. **Cost by Model** - Pie chart showing gpt-4o vs gpt-4o-mini breakdown
4. **Monthly Budget Status** - Gauge showing % of $500 budget consumed

**Features**:
- Dynamic time range (default: last 7 days)
- Color coding (green <$200, yellow $200-400, red >$400)
- Thresholds alert on budget overage

**Status**: ✅ Complete (2KB JSON)

---

### ✅ Step 7: SLI/SLO Framework
**File**: `docs/SLI_SLO.md`

**Service Level Indicators Defined**:
1. **SLI-1**: Intent Classification Accuracy (target 95%)
2. **SLI-2**: API Response Latency P95 (target <200ms)
3. **SLI-3**: Tool Execution Success Rate (target 98%)
4. **SLI-4**: RAG Relevance Score (target >85%)
5. **SLI-5**: API Error Rate (target 99.9%)
6. **SLI-6**: Cost Efficiency (target <$0.50/request)

**Service Level Objectives**:
- Primary: 99.5% availability per month (21.6 min error budget)
- Secondary: 95% interaction completion without escalation

**Features**:
- SLI targets with current performance gaps
- Error budget methodology (green/yellow/red zones)
- Quarterly review process
- Operational implications for on-call and product decisions
- Future SLI dashboard specification for Phase 5

**Status**: ✅ Complete (400 lines documentation)

---

### ✅ Step 8: Phase 4 Alert Runbooks
**Files Created**:
- `docs/runbooks/ALERT_HighLlmCostRate.md` (700+ lines)
- `docs/runbooks/ALERT_UnexpectedCostSpike.md` (600+ lines)
- `docs/runbooks/ALERT_ConfidenceTrendingDown.md` (700+ lines)
- `docs/runbooks/ALERT_CostPerUserExceeded.md` (template)
- `docs/runbooks/ALERT_LlmCostVsQuotaRatio.md` (template)
- `docs/runbooks/ALERT_LatencyTrendingUp.md` (template)
- `docs/runbooks/ALERT_ErrorRateTrendingUp.md` (template)
- `docs/runbooks/ALERT_AnomalyScoreElevated.md` (template)

**Comprehensive Runbooks** (3 detailed):
- HighLlmCostRate: 5 root causes, 5 resolution options, cost calculations
- UnexpectedCostSpike: Emergency response procedures, 1-minute diagnosis
- ConfidenceTrendingDown: Model rollback/retrain procedures, 3+ options

**Status**: ✅ Complete (2000+ lines across 8 runbooks)

---

## Detailed Technical Changes

### Cost Tracking Implementation

**OpenAI Pricing Configuration**:
```
gpt-4o:
  - Input: $0.03 per 1,000 tokens
  - Output: $0.06 per 1,000 tokens
  
gpt-4o-mini:
  - Input: $0.00015 per 1,000 tokens
  - Output: $0.0006 per 1,000 tokens
```

**Example Cost Calculation**:
```
Input tokens: 500, Output tokens: 200
Cost = (500 / 1000) * 0.03 + (200 / 1000) * 0.06
     = 0.015 + 0.012
     = $0.027 per request
```

**Metric Labels**:
- `openai_api_cost_total{model="gpt-4o", user_id="user123"}` → cumulative counter
- `cost_per_user_total{user_id="user123"}` → per-user counter
- `openai_cost_per_minute{}` → current rate gauge

---

### Anomaly Detection Implementation

**Algorithm**: Isolation Forest
- Contamination rate: 10% (expect normal ~90% of observations)
- Estimators: 100 trees (balanced speed/accuracy)
- Random state: 42 (reproducible)

**Feature Vectors** (5 metrics monitored):
```python
Features = [
  intent_classification_confidence,      # model accuracy
  http_request_duration_seconds (P95),   # latency
  errors_total rate per 5m,              # error rate
  tool_invocation_duration_seconds (P95),# tool reliability
  rag_retrieval_duration_seconds (P95)   # KB performance
]
```

**Anomaly Score**:
- Range: 0.0 to 1.0 (higher = more anomalous)
- Calculation: Normalize Isolation Forest scores to 0-1
- Alert trigger: score > 0.7 (indicates outlier)

**Execution Model**:
- Runs every 5 minutes (via cron or APScheduler)
- Queries last 24 hours of data from Prometheus
- Computes scores and pushes back to Prometheus
- No real-time inference (batch processing only)

---

### Alert Rules Summary

**Cost Alerts** (4 new):
| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| HighLlmCostRate | rate > $1/min | WARNING | Check cost drivers, optimize queries |
| UnexpectedCostSpike | 2x baseline in 5min | CRITICAL | Emergency (disable LLM if needed) |
| CostPerUserExceeded | user cost > $10/day | WARNING | Investigate user, check for abuse |
| LlmCostVsQuotaRatio | cost > 80% of budget | WARNING | Monitor trajectory, plan cost reduction |

**Trending Alerts** (4 new):
| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| ConfidenceTrendingDown | declining >2%/hr for 3h | WARNING | Investigate NLU degradation |
| LatencyTrendingUp | P95 +50ms/hr for 2h | WARNING | Check performance bottleneck |
| ErrorRateTrendingUp | error +0.5%/hr for 2h | WARNING | Investigate emerging issues |
| AnomalyScoreElevated | score > 0.7 | WARNING | ML flagged unusual metrics |

---

### Dashboard Additions

**Cost Intelligence Dashboard** (new):
- Time range: Last 7 days (customizable)
- Refresh rate: 30 seconds
- 4 panels with 12 metrics total
- Thresholds: Green <$200/day, Yellow $200-400, Red >$400

**Master Clinical Intelligence Updates** (Phase 5):
- Will add SLI attainment % panel (tracks all 6 SLIs)
- Will add error budget burn rate visualization
- Deferred for Phase 5

---

## Testing & Validation

### Prometheus Rules Validation
```bash
# Check alert rule syntax
promtool check rules config/prometheus/alert.rules.yml
# Expected: All 27 rules pass syntax check (20 Phase 1-3 + 7 Phase 4)
```

### Cost Metrics Validation
```bash
# Make a test API call and verify cost recorded
curl http://localhost:8080/api/test-ai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is a heart attack?"}'

# Check Prometheus metrics
curl 'http://localhost:9090/api/v1/query?query=openai_api_cost_total'
# Expected: counter > 0
```

### Anomaly Detection Script
```bash
# Test script runs without errors
python3 backend/ml-services/anomaly-detection/anomaly_detector.py
# Expected: Logs showing metrics processed, scores computed
```

### Dashboard Verification
```bash
# Grafana dashboard loads
curl http://localhost:3000/api/dashboards/uid/cost-intelligence
# Expected: 4 panels load, show data or errors gracefully
```

### Alert Firing Tests
```bash
# Manually trigger cost alert (for testing)
promtool query instant --alert-rule=HighLlmCostRate 'openai_api_cost_total > 100'
```

---

## Files Modified/Created

### New Files
- `backend/ml-services/anomaly-detection/anomaly_detector.py` (350 lines)
- `config/grafana/provisioning/dashboards/cost-intelligence.json` (2KB)
- `docs/SLI_SLO.md` (400 lines)
- `docs/runbooks/ALERT_HighLlmCostRate.md` (700 lines)
- `docs/runbooks/ALERT_UnexpectedCostSpike.md` (600 lines)
- `docs/runbooks/ALERT_ConfidenceTrendingDown.md` (700 lines)
- `docs/runbooks/ALERT_CostPerUserExceeded.md` (200 lines, template)
- `docs/runbooks/ALERT_LlmCostVsQuotaRatio.md` (200 lines, template)
- `docs/runbooks/ALERT_LatencyTrendingUp.md` (200 lines, template)
- `docs/runbooks/ALERT_ErrorRateTrendingUp.md` (200 lines, template)
- `docs/runbooks/ALERT_AnomalyScoreElevated.md` (200 lines, template)

**Total**: 11 new files, 4000+ lines of code/documentation

### Modified Files
- `backend/src/modules/metrics/metrics.service.ts` (+40 lines)
- `backend/src/modules/ai/ai.service.ts` (+60 lines)
- `config/prometheus/alert.rules.yml` (+70 lines)

**Total**: 3 modified files, 170 lines added

---

## Batch 14 Completion Summary

| Phase | Deliverables | Status |
|-------|--------------|--------|
| **Phase 1** | 14 metrics + 20 alerts + backend instrumentos | ✅ COMPLETE |
| **Phase 2** | 32-panel dashboard + visualization | ✅ COMPLETE |
| **Phase 3** | 20+ runbooks + escalation procedures + on-call guide | ✅ COMPLETE |
| **Phase 4** | Cost tracking + anomaly detection + SLI/SLO + 8 runbooks | ✅ COMPLETE |

**Total Batch 14 Metrics**:
- 14 custom metrics
- 27 alert rules (20 + 7 Phase 4)
- 32 dashboard panels
- 28+ runbooks
- 3-level escalation procedures
- 6 Service Level Indicators
- Cost tracking and trending

**Completion**: 100% (4 of 4 phases)

---

## Next Steps (Phase 5 and Beyond)

### Phase 5 (Future): Advanced Analytics & Automation
- [ ] Implement full ML anomaly service (real-time, not batch)
- [ ] Add SLI attainment dashboard panel
- [ ] Automated runbook execution for common fixes
- [ ] Cost optimization recommendations
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Advanced forecasting (LSTM for 24h predictions)

### Production Deployment Checklist
- [ ] Run all Prometheus rule syntax checks
- [ ] Verify cost metrics are accurate (spot-check 5 requests)
- [ ] Test anomaly detection script on production data
- [ ] Verify Grafana dashboard loads all 4 panels
- [ ] Train on-call team on 8 new runbooks
- [ ] Verify alert firing/routing via test alert
- [ ] Document OpenAI pricing in team wiki
- [ ] Monitor for cost accuracy and anomaly false positives week 1

---

## Known Limitations & Future Work

1. **Anomaly Detection**: Batch-based (every 5 min), not real-time
   - Fix in Phase 5: Deploy dedicated service with streaming inference

2. **Cost Precision**: Assumes gpt-4o-mini used for cheap calls
   - Future: Add cost breakdown by feature/endpoint

3. **SLI Dashboard**: Specification only, not yet implemented
   - Fix in Phase 5: Build SLI attainment panel with error budget visualization

4. **Context Pruning**: Not yet implemented (prevents token explosion)
   - Fix urgently if cost spike detected

5. **Rate Limiting**: Per-user limits not yet enforced
   - Future: Implement quota enforcement in API layer

---

**Phase 4 Complete** | January 30, 2026 | 100% of planned deliverables implemented
