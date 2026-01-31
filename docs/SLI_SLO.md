# SLI/SLO Framework for CareDroid

**Status**: Phase 4 Complete  
**Date**: January 30, 2026

---

## Executive Summary

This document defines Service Level Indicators (SLIs) and Service Level Objectives (SLOs) for CareDroid's clinical AI assistance platform. SLIs measure actual service quality; SLOs establish target thresholds for acceptable quality. Together, they drive operational excellence and inform budget allocation for reliability work.

---

## Core SLOs

### Primary SLO: Medical Platform Availability
- **Objective**: 99.5% availability per month
- **Error Budget**: 21.6 minutes of downtime/month
- **Measurement Window**: Rolling 30-day period
- **Purpose**: Ensure reliability for clinical use; allows budget for planned maintenance

### Secondary SLO: Clinical Response Quality
- **Objective**: 95% of user interactions complete without escalation to manual review
- **Measurement**: Based on tool invocation success rate
- **Purpose**: Minimize manual work, improve automation

---

## Service Level Indicators (SLIs)

### SLI-1: Intent Classification Accuracy
**What It Measures**: Model's ability to correctly understand user intent

**Definition**: 
```
SLI-1 = (number of correct intent classifications) / 
        (total intent classifications over window)
```

**Target (SLO-1)**: ≥ 95% accuracy in sliding 7-day window

**Current Performance**: ~92% (as of latest batch)

**Measurement**:
- Query: `(sum(intent_classification_confidence) / count(intent_classification_confidence))`
- Dashboard Panel: Master Clinical Intelligence, Panel 2
- Alert Threshold: If drops below 85%, fire `NluConfidenceDropping`

**Business Impact**: 
- 95% accuracy = users trust system, adoption increases
- <85% = users notice poor quality, stop using system
- Each 1% drop costs ~50 lost queries/day

---

### SLI-2: API Response Latency
**What It Measures**: How fast users get responses

**Definition**:
```
SLI-2 = (number of requests with P95 latency < 200ms) / 
        (total requests)
```

**Target (SLO-2)**: ≥ 99% of requests answer in < 200ms

**Current Performance**: ~95% (some slow queries at P95 > 300ms)

**Measurement**:
- Query: `histogram_quantile(0.95, http_request_duration_seconds_bucket)`
- Dashboard Panel: Master Clinical Intelligence, Panel 3
- Alert Threshold: If P95 > 2s, fire `HighLatency`

**Business Impact**:
- <200ms = responsive, medical professional can use while with patient
- 200-500ms = acceptable, some friction
- >500ms = unacceptable, medical professional will find workaround

---

### SLI-3: Tool Execution Success Rate
**What It Measures**: Reliability of clinical tools (drug checker, SOFA, etc.)

**Definition**:
```
SLI-3 = (number of successful tool invocations) / 
        (total tool invocations)
```

**Target (SLO-3)**: ≥ 98% success rate

**Current Performance**: ~96% (some tools timeout)

**Measurement**:
- Query: `sum(tool_invocations_total{status="success"}) / sum(tool_invocations_total)`
- Dashboard Panel: Master Clinical Intelligence, Panel 12
- Alert Threshold: If drops below 90%, fire `HighToolErrorRate`

**Business Impact**:
- 95%+ success = tools trusted
- <90% success = medical professionals lose confidence, switch to manual
- Each 1% loss = ~20 missed patient interactions/day

---

### SLI-4: Knowledge Base (RAG) Relevance
**What It Measures**: Quality of clinical knowledge retrieval

**Definition**:
```
SLI-4 = (number of RAG retrievals with relevance score > 0.70) / 
        (total RAG retrievals)
```

**Target (SLO-4)**: ≥ 85% of retrievals relevant

**Current Performance**: ~82% (knowledge base incomplete)

**Measurement**:
- Query: `(sum(rag_relevance_score) by (query_type)) / count(rag_retrieval_success)`
- Dashboard Panel: Master Clinical Intelligence, Panel 20
- Alert Threshold: If drops below 75%, fire `LowRagRelevance`

**Business Impact**:
- >85% relevance = users trust KB answers
- 70-85% relevance = mixed, some wasted searches
- <70% relevance = users bypass KB, manual lookup instead

---

### SLI-5: API Error Rate
**What It Measures**: Overall application stability

**Definition**:
```
SLI-5 = (number of successful HTTP requests) / 
        (total HTTP requests)
        
Alternative: Only count 5xx errors as "bad" (client errors = user mistake)
```

**Target (SLO-5)**: ≥ 99.9% (only 0.1% server errors)

**Current Performance**: ~99.5% (slightly above target)

**Measurement**:
- Query: `sum(http_requests_total{status!~"5.."}) / sum(http_requests_total)`
- Dashboard Panel: Master Clinical Intelligence, Panel 4
- Alert Threshold: If error rate > 1%, fire `HighErrorRate`

**Business Impact**:
- 99.9%+ = reliable, users have full confidence
- 98-99.9% = occasional issues, users notice
- <98% = unreliable, unusable

---

### SLI-6: Cost Efficiency (Phase 4 NEW)
**What It Measures**: Operational cost per user interaction

**Definition**:
```
SLI-6 = Total API costs in $USD / 
        Total user interactions
```

**Target (SLO-6)**: < $0.50 cost per user interaction

**Current Performance**: ~$0.12/interaction (including model + infrastructure)

**Measurement**:
- Query: `rate(openai_api_cost_total[1m]) / rate(authenticated_requests_total[1m])`
- Dashboard Panel: Cost Intelligence, Panel 1
- Alert Threshold: If cost > $1/request, fire `HighLlmCostRate`

**Business Impact**:
- <$0.50/request = profitable, sustainable model
- $0.50-$1.00 = borderline, need volume
- >$1.00 = unsustainable, losing money on free tier

---

## SLI Tracking Dashboard

**Future Enhancement (Phase 5)**: Create dedicated SLI dashboard with:
1. Real-time SLI attainment % for each indicator
2. Trend analysis (7-day rolling average)
3. Error budget burn rate (how fast are we using our downtime budget?)
4. Correlation between SLIs (when one drops, do others follow?)

**Example Dashboard Layout**:
```
┌─────────────────────────────────────────┐
│ Intent Accuracy: 92.1% / 95% target 🟡 │
│ [██████████░░] Error budget burn: 15%   │
├─────────────────────────────────────────┤
│ API Latency P95: 185ms / 200ms target ✅│
│ [██████████░░] Error budget burn: 2%    │
├─────────────────────────────────────────┤
│ Tool Success: 96.2% / 98% target 🟡    │
│ [█████████░░░] Error budget burn: 8%    │
├─────────────────────────────────────────┤
│ RAG Relevance: 82.0% / 85% target 🟡   │
│ [████████░░░░] Error budget burn: 25%   │
├─────────────────────────────────────────┤
│ API Error Rate: 99.5% / 99.9% target ✅│
│ [██████████░░] Error budget burn: 12%   │
├─────────────────────────────────────────┤
│ Cost/Request: $0.15 / $0.50 target ✅  │
│ [███░░░░░░░░░] Error budget burn: 1%    │
└─────────────────────────────────────────┘

Monthly Error Budget Status:
- Consumed: 8 minutes (41% of 21.6 min budget)
- Remaining: 13.6 minutes 
- At current rate: Will have 5.6 min left for month
```

---

## Error Budget Methodology

**Monthly Error Budget**: 21.6 minutes (from 99.5% SLO)

**Error Budget Allocation** (aspirational):
- Planned maintenance: 10 minutes (46%)
- Incident response overhead: 5 minutes (23%)
- Unplanned incidents: 6.6 minutes (31%)

**Burn Rate Calculation**:
```
If actual availability = 99.2% (vs 99.5% target):
- Deficit per day = (99.5 - 99.2) * 1440 min = 4.3 minutes
- At this rate, budget exhausted in 5 days
- Action: Declare "Code Yellow", increase on-call staffing
```

**Risk Levels**:
- **Green** (>50% budget remaining): Normal operations
- **Yellow** (25-50% budget): Heightened monitoring, defer non-critical work
- **Red** (<25% budget): Incident prevention mode, no risky deployments

---

## SLI Targets vs Current State

| SLI | Metric | Current | Target | Status | Alert |
|-----|--------|---------|--------|--------|-------|
| SLI-1 | Intent Accuracy | 92.1% | 95% | 🟡 WARNING | NluConfidenceDropping @ 85% |
| SLI-2 | API Latency P95 | 185ms | 200ms | ✅ GOOD | HighLatency @ 2s |
| SLI-3 | Tool Success | 96.2% | 98% | 🟡 WARNING | HighToolErrorRate @ 90% |
| SLI-4 | RAG Relevance | 82.0% | 85% | 🟡 WARNING | LowRagRelevance @ 75% |
| SLI-5 | API Error Rate | 99.5% | 99.9% | ✅ GOOD | HighErrorRate @ 1% |
| SLI-6 | Cost/Request | $0.15 | $0.50 | ✅ GOOD | HighLlmCostRate @ $1/req |

**Observations**:
- SLI-1: NLU accuracy trending down slightly (2.9% gap). Recommend retraining soon.
- SLI-3: Tool reliability acceptable but not excellent. Some tools (SOFA) timeout occasionally.
- SLI-4: RAG relevance below target. Knowledge base needs expansion.
- Overall: System meets 4/6 SLOs, 2/6 need attention.

---

## Quarterly Review Process

**When**: Every 3 months (Jan, Apr, Jul, Oct)

**What We Review**:
1. Did we meet each SLI target?
2. What changed (positive/negative)?
3. Which SLIs are trending in wrong direction?
4. How much error budget did we consume?
5. What operational investments paid off?

**Action Thresholds**:
- If SLI < target for 2+ consecutive quarters → escalate to engineering lead
- If SLI > target by 10%+ → consider raising target (we're over-provisioning)
- If error budget exhausted → post-incident review required

**Example Review Meeting**:
```
DATE: Q1 Review (April 1, 2026)
ATTENDEES: Product, Engineering, Medical, Operations

SLI-1 (Intent Accuracy):
  Current: 92.1% (vs 95% target)
  Q4: Started 94%, declined to 92.1%
  Root Cause: New user demographics using system differently
  Action: Retrain model on new intent patterns (2 week sprint)
  
SLI-3 (Tool Success):
  Current: 96.2% (vs 98% target)
  Q4: Stable at 96-97%
  Root Cause: SOFA calculator timeout on edge cases
  Action: Implement caching for SOFA (1 week sprint)
  
Error Budget Status:
  Consumed: 12 minutes in Q1 (from 1 outage + 2 deployments)
  Predicted: Will have 9.6 min left for Q2
  Action: Schedule maintenance in Q2 now to avoid April surprises
```

---

## Operational Implications

### On-Call Training
- Each on-call engineer must understand all 6 SLIs
- Alert responses should be tied to SLI impact
- Escalation decisions based on "which SLI is at risk?"

### Capacity Planning
- If any SLI trending down → more infrastructure investment needed within 2 weeks
- If all SLIs stable → can focus on feature velocity

### Product Decisions
- New feature that hurts SLI-2 (latency) by >10% = reject
- New feature that hurts SLI-6 (cost) by >30% = requires cost offsets

---

## Related Documentation

- **Runbooks**: [docs/runbooks/](docs/runbooks/) - alert response procedures
- **Phase 4 Plan**: [BATCH_14_PHASE_4_PLAN.md](BATCH_14_PHASE_4_PLAN.md) - anomaly detection, cost tracking
- **Escalation Procedures**: [docs/runbooks/ESCALATION_PROCEDURES.md](docs/runbooks/ESCALATION_PROCEDURES.md) - on-call decision tree

---

**SLI/SLO Framework Complete** | January 30, 2026
