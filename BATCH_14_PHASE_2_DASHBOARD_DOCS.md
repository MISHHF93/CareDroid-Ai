# Master Clinical Intelligence Dashboard Documentation

**Dashboard**: `Master Clinical Intelligence`  
**Location**: [config/grafana/provisioning/dashboards/caredroid/master-clinical-intelligence.json](config/grafana/provisioning/dashboards/caredroid/master-clinical-intelligence.json)  
**UID**: `master-clinical-intelligence`  
**Panels**: 32 (organized in 4 sections)  
**Refresh**: 10 seconds  
**Default Time Range**: Last 6 hours

---

## 📊 Dashboard Overview

The Master Clinical Intelligence dashboard provides comprehensive monitoring of the CareDroid AI system, with **deep focus on NLU classification quality (60%)**, supplemented by tool performance and RAG retrieval metrics. The dashboard enables clinical teams to quickly assess AI system health and troubleshoot classification or tool execution issues.

### Interactive Variables

Three variables control dashboard filtering:

1. **Time Range** (`$timeRange`): Select from 1h, 6h, 24h, or 7d lookback
2. **Service** (`$service`): Filter by component (nlu, llm, rag, etc.)
3. **Intent Type** (`$intentType`): Filter by classification intent (emergency, clinical_tool, medical_reference, etc.)

---

## 🧠 Section 1: NLU Intelligence (Panels 1-20, 60% of dashboard)

### Subsection A: Classification Pipeline (Panels 1-3)

**Panel 1: Intent Classification Distribution (Pie Chart)**
- **Query**: `sum(rate(intent_classifications_total[5m])) by (method)`
- **Purpose**: Shows distribution of classifications across 3 methods: keyword (Phase 1), nlu (Phase 2), llm (Phase 3)
- **Healthy State**: Majority keyword/nlu (>80%), low llm fallback (<20%)
- **Alert Trigger**: >50% LLM fallback indicates phases 1-2 failing

**Panel 2: Confidence Score Distribution (Heatmap)**
- **Query**: `sum(rate(nlu_confidence_scores_bucket[5m])) by (le, intent)`
- **Purpose**: 2D view of confidence scores by intent type, shows where low confidence occurs
- **Healthy State**: Strong concentration at 0.7-1.0 range
- **Alert Trigger**: Shift toward 0.0-0.6 bins indicates degrading classification quality

**Panels 3-5: Phase Latency Timeseries (3 separate panels)**
- **Queries**:
  - Panel 3: `histogram_quantile(0.95, sum(rate(nlu_phase_keyword_duration_seconds_bucket[5m])) by (le)) * 1000`
  - Panel 4: `histogram_quantile(0.95, sum(rate(nlu_phase_model_duration_seconds_bucket[5m])) by (le)) * 1000`
  - Panel 5: `histogram_quantile(0.95, sum(rate(nlu_phase_llm_duration_seconds_bucket[5m])) by (le)) * 1000`
- **Purpose**: Track P95 latency for each phase separately
- **Healthy State**: Phase 1 <20ms, Phase 2 <150ms, Phase 3 <1s
- **Alert Trigger**: Exceeding thresholds indicates external service delays or resource contention

### Subsection B: Performance & Timing Gauges (Panels 6-9)

**Panels 6-8: Phase Latency Gauges**
- **Purpose**: Single-value gauges for quick visual assessment of each phase
- **Thresholds**: Green/Yellow/Red at phase-specific latency boundaries
- **Use Case**: Quick dashboard scans to spot slow phases

**Panel 9: Phase 1 Classification Rate**
- **Query**: `(sum(rate(intent_classifications_total{method="keyword"}[5m])) / sum(rate(intent_classifications_total[5m]))) * 100`
- **Purpose**: % of classifications handled by Phase 1 (fast, rule-based path)
- **Healthy State**: 70-90% (prefer fast path)
- **Alert Trigger**: <50% indicates phases 1 struggling, falling back to phases 2-3

### Subsection C: Circuit Breaker Health (Panels 12-14)

**Panels 12-13: Circuit Breaker State (Status Panels)**
- **Queries**:
  - Panel 12: `nlu_circuit_breaker_state{service="nlu"}`
  - Panel 13: `nlu_circuit_breaker_state{service="llm"}`
- **Purpose**: Real-time breaker state (0=closed/healthy, 1=open/failing)
- **Color Coding**: Green (0), Red (1)
- **Context**: If breaker open, downstream service (NLU model at port 8001, or GPT-4) is failing

**Panel 14: Circuit Breaker Open Events**
- **Query**: `increase(nlu_circuit_breaker_state[1h])`
- **Purpose**: Track how many times breaker opened in last hour
- **Alert Trigger**: Repeated opening (>5 times/hour) = service reliability issue

### Subsection D: Confidence Analysis (Panels 10-11, 15-20)

**Panel 10: Average Confidence by Intent**
- **Query**: `sum(rate(nlu_confidence_scores_sum[5m])) by (intent) / sum(rate(nlu_confidence_scores_count[5m])) by (intent)`
- **Purpose**: Identify which intents get confidently classified vs. uncertain
- **Healthy State**: Most intents >0.75
- **Action**: Low-confidence intents may need training data improvements

**Panel 11: Confidence Bucket Distribution by Phase**
- **Query**: `sum(rate(nlu_confidence_scores_count[5m])) by (phase)`
- **Purpose**: Distribution of confidence buckets across phases
- **Insight**: Identifies which phase produces wider vs. tighter confidence ranges

**Panel 15: Overall Confidence Score Trend**
- **Query**: `sum(rate(nlu_confidence_scores_sum[5m])) / sum(rate(nlu_confidence_scores_count[5m]))`
- **Purpose**: Single-line trend of overall classification confidence over time
- **Healthy State**: Stable >0.70
- **Alert Trigger**: Declining trend = model degradation or distribution shift

**Panel 16: Intent Mismatch Rate**
- **Query**: `rate(chat_intent_confidence_mismatch_total[5m])`
- **Purpose**: User corrections per second (feedback loop)
- **Interpretation**: If user keeps correcting intent X, our model is confused about intent X
- **Action**: Manual review of misclassified queries for retraining

**Panels 17-20: Percentile & Range Splits**
- **Panel 17**: P50, P95, P99 percentiles for all intents combined
- **Panels 18-19**: Confidence range for Phase 1 (keyword) and Phase 2 (model) separately
- **Purpose**: Understand distribution shape (wide vs. narrow) and long-tail behavior
- **Insight**: Wide ranges = uncertain classifications; narrow = confident/consistent

---

## 🔧 Section 2: Tool Performance (Panels 21-24, 20% of dashboard)

### Tool Error Tracking (Panels 20-21)

**Panel 20: Tool Errors by Type (Timeseries)**
- **Query**: `sum(rate(tool_errors_total[5m])) by (error_type)`
- **Error Types**:
  - `timeout`: External service didn't respond in time
  - `validation`: Input parameters failed validation
  - `external_api`: Network/API connectivity issue
  - `internal_error`: Unhandled exception in tool code
- **Purpose**: Identify which error categories dominate
- **Action**: Timeout spikes → check external service health; Validation → check input contracts

**Panel 21: Tool Error Rate by Tool**
- **Query**: `sum(rate(tool_errors_total[5m])) by (tool) / sum(rate(tool_execution_time_tier_total[5m])) by (tool)`
- **Purpose**: Ratio of errors to total executions per tool
- **Healthy State**: <5% error rate
- **Alert Trigger**: >10% = tool unreliable

### Tool Execution Performance (Panels 22-24)

**Panel 22: Tool Execution Latency Tiers (Stacked Area)**
- **Query**: `sum(rate(tool_execution_time_tier_total[5m])) by (tier)`
- **Tier Definitions**:
  - `fast`: <25ms (ideal)
  - `normal`: 25-100ms (acceptable)
  - `slow`: 100-500ms (degraded)
  - `very_slow`: >500ms (poor)
- **Purpose**: See how execution times are distributed
- **Healthy State**: Dominated by fast/normal (>80%)
- **Alert Trigger**: Shift toward slow/very_slow (>30%) = performance degradation

**Panel 23: Tool Parameter Complexity Score**
- **Query**: `avg(tool_param_complexity_score) by (tool)`
- **Score**: 0-100 (calculated from param count, nesting, array size)
- **Purpose**: Understand query complexity patterns per tool
- **Insight**: High complexity + high latency = tool struggling with complex queries

**Panel 24: Tool Slow Execution % (slow + very_slow)**
- **Query**: `(sum(rate(tool_execution_time_tier_total{tier=~"slow|very_slow"}[5m])) by (tool) / sum(rate(tool_execution_time_tier_total[5m])) by (tool)) * 100`
- **Purpose**: Quick metric for performance regression
- **Alert Trigger**: >30% slow = investigate tool/external service

---

## 📚 Section 3: RAG & Knowledge Base (Panels 25-30, 15% of dashboard)

### RAG Quality Metrics (Panels 25-28)

**Panel 25: RAG Chunk Relevance Score Distribution (Heatmap)**
- **Query**: `sum(rate(rag_chunk_relevance_score_bucket[5m])) by (le)`
- **Purpose**: Semantic similarity scores of retrieved chunks (0.0-1.0)
- **Healthy State**: Concentrated at 0.7-1.0 (relevant chunks)
- **Alert Trigger**: Shift toward 0.0-0.5 = embeddings degrading or knowledge base gap

**Panel 26: RAG Chunk Retrieval Size Distribution**
- **Query**: `sum(rate(rag_chunks_retrieved_total[5m])) by (retrieval_size)`
- **Sizes**:
  - `zero`: No matching chunks (knowledge gap)
  - `one`: Single chunk retrieved
  - `two_to_five`: 2-5 chunks (typical)
  - `six_to_ten`: 6-10 chunks
  - `more_than_ten`: 11+ chunks
- **Purpose**: See retrieval pattern distribution
- **Healthy State**: Mostly two_to_five (2-5 chunks per query)
- **Action**: High zero rate = update knowledge base; high >10 = improve ranking

**Panel 27: RAG Empty Results Rate**
- **Query**: `rate(rag_empty_results_total[5m])`
- **Purpose**: % of queries returning zero results
- **Healthy State**: <10%
- **Alert Trigger**: >50% = knowledge base not covering query space

**Panel 28: RAG Median Chunk Relevance Score Trend**
- **Query**: `histogram_quantile(0.50, sum(rate(rag_chunk_relevance_score_bucket[5m])) by (le))`
- **Purpose**: Single metric for knowledge base health over time
- **Healthy State**: >0.70 (most chunks relevant)
- **Alert Trigger**: Declining trend = embeddings or indexing issue

### RAG Patterns (Panels 29-30)

**Panel 29: RAG Retrieval Pattern Trends**
- **Query**: `sum(rate(rag_chunks_retrieved_total[5m]))`
- **Purpose**: Total retrieval volume trend
- **Insight**: Spike = user base growing; drop = system issue

**Panel 30: Empty Query Results (Last 1h)**
- **Query**: `sum(increase(rag_empty_results_total[1h]))`
- **Purpose**: Count of zero-result queries in last hour
- **Action**: Above baseline = knowledge gap; investigate domains without coverage

---

## 👥 Section 4: User Engagement (Panels 31-32, 5% of dashboard)

### Conversation Patterns (Panels 31-32)

**Panel 31: Conversation Depth Distribution (P95)**
- **Query**: `histogram_quantile(0.95, sum(rate(chat_multi_turn_depth_bucket[5m])) by (le))`
- **Purpose**: Track multi-turn conversation lengths
- **Healthy State**: P95 typically 3-8 turns
- **Insight**: High depth = engaged users exploring topics; low = single-turn queries

**Panel 32: Intent Mismatch Rate Trend**
- **Query**: `sum(rate(chat_intent_confidence_mismatch_total[5m]))`
- **Purpose**: User corrections per second (quality feedback metric)
- **Healthy State**: <0.01/sec (one correction per 100+ queries)
- **Alert Trigger**: >0.05/sec = model performing poorly

---

## 🎯 Common Dashboard Usage Patterns

### "Is NLU working well?"
1. Check **Panel 1** (Classification Distribution): Should be >80% keyword/nlu, <20% llm
2. Check **Panel 15** (Overall Confidence): Should be >0.70
3. Check **Panels 12-13** (Circuit Breakers): Should both read 0 (healthy)

### "Why are queries slow?"
1. Check **Panels 3-5** (Phase Latency): Which phase is slow?
2. Check **Panel 14** (Circuit Breaker Events): Is breaker opening frequently?
3. Check **Panel 22** (Tool Tiers): Are tools in slow/very_slow?

### "Is our knowledge base good?"
1. Check **Panel 27** (Empty Results Rate): <10% is good
2. Check **Panel 28** (Median Relevance): >0.70 is good
3. Check **Panel 25** (Distribution): Concentrated at 0.7-1.0

### "Which intents are problematic?"
1. Check **Panel 16** (Intent Mismatch): High values indicate confused intents
2. Check **Panel 10** (Avg Confidence by Intent): Low confidence intents
3. Action: Review misclassified queries and retrain if needed

---

## ⚠️ Alert Thresholds Reference

| Alert Rule | Dashboard Panels | Threshold | Interpretation |
|-----------|------------------|-----------|-----------------|
| NluConfidenceDropping | 10, 15 | Avg <0.6 for 5min | Model degradation |
| NluCircuitBreakerOpen | 12, 13, 14 | State = 1 | External service failing |
| LlmFallbackSpike | 1 | >50% of classifications | Phases 1-2 not working |
| IntentMismatchIncreasing | 16 | >0.05/sec for 10min | High user correction rate |
| ToolErrorRateSpike | 21 | >10% error rate | Tool reliability issue |
| ToolLatencyTierShift | 22, 24 | >30% slow/very_slow | Performance regression |
| RagEmptyResults | 27 | >50% of queries | Knowledge gap |

---

## 🔧 Dashboard Maintenance

### To Add New Panels
1. Create panel in Grafana UI
2. Get PromQL query from panel's "Inspect" button
3. Add panel JSON with unique `id` value
4. Update `gridPos` to avoid overlaps
5. Export updated dashboard and commit

### To Update PromQL Query
1. Click panel title → "Edit"
2. Modify query in "Metrics" tab
3. Click "Apply" to save
4. Export dashboard: Dashboard menu → JSON model → copy full JSON

### To add New Variables
1. Dashboard settings → "Templating"
2. Create new variable
3. Set datasource and query for dynamic options
4. Use `$varName` in PromQL queries with `label=~"$varName"`

---

## 📈 Interpretation Guide

### Confidence Score Meaning
- **0.9-1.0**: Very confident (preferred)
- **0.7-0.9**: Confident enough for production (threshold)
- **0.5-0.7**: Uncertain, may need verification
- **0.0-0.5**: Very uncertain, likely to be wrong

### Relevance Score Meaning
- **0.9-1.0**: Highly relevant chunk
- **0.7-0.9**: Relevant, likely helpful
- **0.5-0.7**: Marginally relevant
- **0.0-0.5**: Not relevant, may mislead

### Execution Tier Meaning
- **Fast** (<25ms): Optimal, rule-based or cached
- **Normal** (25-100ms): Expected for most queries
- **Slow** (100-500ms): External API call or complex computation
- **Very Slow** (>500ms): Performance issue, investigate

---

**Last Updated**: January 2025  
**Batch**: 14 Phase 2
