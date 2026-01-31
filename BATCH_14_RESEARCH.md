# Batch 14: Custom Metrics & Advanced Instrumentation - Research Report

**Research Date**: January 30, 2026  
**Purpose**: Foundation analysis for Batch 14 implementation  
**Status**: Complete research findings documented  

---

## Executive Summary

CareDroid has a **solid base infrastructure** for Batch 14 custom metrics implementation:
- ✅ Core metrics service already collecting 20+ base metrics
- ✅ NLU system with 3-phase classification pipeline
- ✅ Tool orchestrator managing 3 clinical tools (SOFA, Drug Checker, Lab Interpreter)
- ✅ RAG system with retrieval tracking
- ✅ Emergency detection system with pattern-based keywords
- ✅ Audit logging for compliance

**Gaps identified**: Most business metrics are basic counters/gauges without granular labels, confidence tracking, or performance baselines. Batch 14 will add custom metrics for NLU accuracy, tool performance analysis, and business intelligence.

---

## 1. CURRENT METRICS INFRASTRUCTURE

### 1.1 Prometheus Metrics Service Location
**File**: [backend/src/modules/metrics/metrics.service.ts](backend/src/modules/metrics/metrics.service.ts)

**Total Lines**: 284 lines | **Status**: ✅ Fully implemented

### 1.2 Currently Collected Metrics (20+ total)

#### HTTP Metrics
```
- http_requests_total{method, path, status}
- http_request_duration_seconds{method, path, status} [Histogram]
- http_request_size_bytes{method, path}
- http_response_size_bytes{method, path, status}
```

**Recording Method**: Called via middleware in `backend/src/middleware/logging.middleware.ts`

**Buckets**: 
- Duration: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
- Size: [100B, 1KB, 5KB, 10KB, 50KB, 100KB, 500KB, 1MB]

#### Database Metrics
```
- database_queries_total{operation, entity, status}
- database_query_duration_seconds{operation, entity} [Histogram]
- database_connection_pool_utilization{pool_name} [Gauge]
```

**Current Status**: Defined in service, **NOT YET INTEGRATED** into services (gap!)

#### Cache Metrics
```
- cache_operations_total{operation, status}
- cache_hit_rate [Gauge]
```

**Current Status**: Defined, not actively recorded

#### Error Metrics
```
- errors_total{error_type, severity}
```

**Recording**: Via error handling in services

#### Business Metrics (Medical Domain)
```
- tool_invocations_total{tool_name, status}
- tool_invocation_duration_seconds{tool_name} [Histogram]
  Labels: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]

- rag_retrieval_duration_seconds [Histogram]
  Labels: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]

- rag_retrieval_success{query_type}

- emergency_detection_total{emergency_type, severity}
```

**Recording**: Partially integrated
- Tool invocations: Recorded in `tool-orchestrator.service.ts` (line 300+)
- RAG retrieval: Recorded in `chat.service.ts` (line 576+)
- Emergency detection: Recorded in intent classifier

#### User Metrics
```
- active_users [Gauge]
- authenticated_requests_total{user_role}
```

**Current Status**: Defined, implementation pending

#### System Metrics (Automatic)
```
- process_cpu_seconds_total
- process_resident_memory_bytes
- nodejs_eventloop_lag_seconds
```

**Status**: Automatically collected via `collectDefaultMetrics()`

### 1.3 Prometheus Configuration
**File**: [config/prometheus.yml](config/prometheus.yml)

```yaml
scrape_configs:
  - job_name: 'caredroid-backend'
    scrape_interval: 10s
    scrape_timeout: 5s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend:3000']
```

**Endpoint**: `/metrics` (exposed by MetricsController)

### 1.4 Alert Rules
**File**: [config/prometheus/alert.rules.yml](config/prometheus/alert.rules.yml)

**Currently Defined**: 20+ rules including:
- HighErrorRate (>10% for 2m) → CRITICAL
- HighLatency (95th percentile >2s) → WARNING
- SlowToolInvocation (95th percentile >10s) → WARNING
- SlowRagRetrieval (90th percentile >2s) → WARNING
- EmergencyDetected (any emergency) → CRITICAL
- HighToolErrorRate (>10% errors) → WARNING
- DatabaseErrors (>5% error rate) → WARNING
- DatabaseConnectionPool (>90% utilization) → CRITICAL

---

## 2. NLU SYSTEM ARCHITECTURE

### 2.1 Intent Classification Service
**File**: [backend/src/modules/medical-control-plane/intent-classifier/intent-classifier.service.ts](backend/src/modules/medical-control-plane/intent-classifier/intent-classifier.service.ts)

**Lines**: 453 lines | **Status**: ✅ Fully implemented

### 2.2 Three-Phase Classification Pipeline

```
USER MESSAGE
    ↓
PHASE 0: Emergency Detection (100% recall, no false negatives)
    ↓ (if emergency detected)
PHASE 1: Keyword Pattern Matching
    ├─ Fast rule-based matching
    ├─ Returns confidence score (0-1)
    └─ If confidence ≥ 0.7 → return result
    ↓ (if confidence < 0.7)
PHASE 2: NLU Model (Fine-tuned BERT)
    ├─ HTTP call to NLU service (http://nlu:8001/predict)
    ├─ Returns confidence + intent + key_terms
    ├─ Circuit breaker: 3 failures → 30s reset
    └─ If confidence ≥ 0.7 → return result
    ↓ (if NLU unavailable or confidence < 0.7)
PHASE 3: LLM Fallback (GPT-4)
    ├─ Calls OpenAI API
    ├─ Circuit breaker: 3 failures → 30s reset
    └─ Returns most reliable result
```

**Key Methods**:
- `classify(message, context)` - Main entry point
- `keywordMatcher(message)` - Phase 1
- `nluMatcher(message)` - Phase 2
- `llmMatcher(message)` - Phase 3

### 2.3 NLU Model Details
**File**: [backend/ml-services/nlu/model.py](backend/ml-services/nlu/model.py)

**Model**: BiomedBERT (fine-tuned transformer)
**Port**: 8001
**Endpoint**: `POST /predict`

**Response Schema**:
```json
{
  "intent": "emergency|clinical_tool|lab_query|protocol_search|general_query|patient_data|admin_function",
  "confidence": 0.95,
  "label_id": 0,
  "subcategory": "cardiac|respiratory|neurological",
  "key_terms": ["term1", "term2"],
  "latency_ms": 45.2,
  "logits": [0.1, 0.2, ...],
  "probabilities": [0.05, 0.12, ...]
}
```

**Intent Classes** (7 total):
1. **emergency** - Critical patient conditions
2. **clinical_tool** - SOFA, drug checker, lab interpreter
3. **lab_query** - Laboratory value interpretation
4. **protocol_search** - Medical guidelines/protocols
5. **general_query** - General medical knowledge
6. **patient_data** - Patient history/records
7. **admin_function** - System configuration

### 2.4 Classification Output (IntentClassification DTO)
**File**: [backend/src/modules/medical-control-plane/intent-classifier/dto/intent-classification.dto.ts](backend/src/modules/medical-control-plane/intent-classifier/dto/intent-classification.dto.ts)

```typescript
interface IntentClassification {
  primaryIntent: PrimaryIntent;
  toolId?: string;                          // Tool ID if clinical_tool
  confidence: number;                       // 0-1
  method: 'keyword' | 'nlu' | 'llm';       // Which phase classified
  extractedParameters: Record<string, any>;
  
  // Emergency fields
  isEmergency: boolean;
  emergencyKeywords: EmergencyKeyword[];
  emergencySeverity?: 'critical' | 'urgent' | 'moderate';
  
  // Supporting info
  matchedPatterns: string[];
  alternativeIntents?: Array<{ intent, toolId, confidence }>;
  classifiedAt: Date;
}
```

### 2.5 Data Available for Metrics
**Confidence Tracking**:
- Keyword match confidence (0-1)
- NLU model confidence (0-1)
- LLM confidence (inferred from reasoning)
- Overall classification confidence

**Latency Data**:
- Phase 1 (keyword): ~1-5ms
- Phase 2 (NLU): ~40-100ms
- Phase 3 (LLM): ~500-2000ms
- Total classification time

**Accuracy Data Needed**:
- Ground truth labels for test queries (not currently tracked)
- Misclassifications (when user disagrees or corrects)
- Fallback patterns (when keyword failed, NLU succeeded)

**Current Logging**: Via `AuditService.log()` in chat.service.ts (lines 87-98)

---

## 3. TOOL PERFORMANCE TRACKING

### 3.1 Tool Orchestrator Service
**File**: [backend/src/modules/medical-control-plane/tool-orchestrator/tool-orchestrator.service.ts](backend/src/modules/medical-control-plane/tool-orchestrator/tool-orchestrator.service.ts)

**Lines**: 426 lines | **Status**: ✅ Fully implemented

### 3.2 Available Clinical Tools

#### Tool 1: SOFA Calculator
**File**: `backend/src/modules/medical-control-plane/tool-orchestrator/services/sofa-calculator.service.ts`

**Purpose**: Sequential Organ Failure Assessment score  
**Inputs**: pao2, fio2, platelets, bilirubin, map, gcs, creatinine  
**Outputs**: 
```json
{
  "success": true,
  "data": {
    "totalScore": 6,
    "scores": {
      "respiration": 2,
      "coagulation": 1,
      "liver": 1,
      "cardiovascular": 0,
      "cns": 0,
      "renal": 2
    },
    "mortality": "20-30% mortality risk"
  },
  "interpretation": "SOFA Score of 6 indicates moderate organ dysfunction",
  "timestamp": "2024-01-30T10:45:00Z"
}
```

**Performance Baseline**: ~10-20ms (pure computation)

#### Tool 2: Drug Interaction Checker
**File**: `backend/src/modules/medical-control-plane/tool-orchestrator/services/drug-checker.service.ts`

**Purpose**: Identify clinically significant drug-drug interactions  
**Inputs**: medications[] (list of drug names)  
**Outputs**:
```json
{
  "success": true,
  "data": {
    "medicationsChecked": ["warfarin", "aspirin"],
    "totalInteractions": 1,
    "interactionsBySeverity": {
      "contraindicated": 0,
      "major": 1,
      "moderate": 0,
      "minor": 0
    },
    "interactions": [
      {
        "drug1": "warfarin",
        "drug2": "aspirin",
        "severity": "major",
        "mechanism": "Increased bleeding risk",
        "recommendation": "Monitor INR more frequently"
      }
    ]
  },
  "timestamp": "2024-01-30T10:45:00Z"
}
```

**Performance Baseline**: 
- Rule-based: 20-50ms
- AI-enhanced: 500-2000ms

#### Tool 3: Lab Interpreter
**File**: `backend/src/modules/medical-control-plane/tool-orchestrator/services/lab-interpreter.service.ts`

**Purpose**: Interpret laboratory results and clinical significance  
**Inputs**: labValues[] (array of {name, value})  
**Outputs**:
```json
{
  "success": true,
  "data": {
    "labValues": [
      {
        "name": "Hemoglobin",
        "value": 10.5,
        "unit": "g/dL",
        "status": "low",
        "category": "CBC",
        "normalRange": { "min": 12.0, "max": 17.5 },
        "clinicalSignificance": "Mild anemia"
      }
    ],
    "groupedByCategory": {
      "CBC": [...],
      "BMP": [...]
    }
  },
  "interpretation": "Results suggest mild anemia, recommend iron panel evaluation",
  "timestamp": "2024-01-30T10:45:00Z"
}
```

**Performance Baseline**: 
- Rule-based: 50-100ms
- AI-enhanced: 800-2000ms

### 3.3 Tool Execution Flow
**In ToolOrchestratorService**:

```typescript
executeTool(request: ExecuteToolDto): Promise<ToolExecutionResponseDto> {
  const startTime = Date.now();
  
  // 1. Validate inputs
  // 2. Get tool from registry
  // 3. Execute tool
  const result = await tool.execute(parameters);
  
  // 4. Record metrics
  const duration = Date.now() - startTime;
  this.metricsService.recordToolInvocation(
    toolId,
    duration,
    result.success ? 'success' : 'error'
  );
  
  // 5. Audit log
  await this.auditService.log({
    action: AuditAction.TOOL_EXECUTION,
    resource: `tool/${toolId}`,
    metadata: { duration, success: result.success }
  });
  
  return { ...result, executionTimeMs: duration };
}
```

**Current Metrics Recording** (line 300+):
- `toolInvocationsTotal{tool_name, status}`
- `toolInvocationDuration{tool_name}` (duration in seconds)

### 3.4 Performance Data Available
**Currently Tracked**:
- ✅ Execution time (recorded in metrics)
- ✅ Success/failure status
- ✅ Tool name
- ❌ Error types/details
- ❌ Parameter variances (simple vs complex calculation)
- ❌ Input characteristics (e.g., number of drugs checked)
- ❌ Output quality metrics

**Audit Logging**:
- Duration recorded via `AuditService.log()`
- Stored in Elasticsearch for long-term analysis
- Accessible via Kibana saved search: "Tool Invocations" (15 fields)

---

## 4. BUSINESS METRICS

### 4.1 Tool Invocation Tracking

**Current Metrics**:
```
tool_invocations_total{tool_name, status}
tool_invocation_duration_seconds{tool_name}
```

**How Recorded**: 
- Location: `tool-orchestrator.service.ts` (line ~155)
- Called after each tool execution
- Includes tool name and success/error status

**Alert Rules** (from `config/prometheus/alert.rules.yml`):
```yaml
- alert: HighToolErrorRate
  expr: (error_count / total_invocations per tool) > 0.1
  for: 2m
  severity: warning

- alert: SlowToolInvocation
  expr: histogram_quantile(0.95, ...) > 10s
  severity: warning
```

### 4.2 RAG Retrieval Performance

**Current Metrics**:
```
rag_retrieval_duration_seconds [Histogram]
rag_retrieval_success{query_type} [Counter]
```

**How Recorded**:
- Location: `chat.service.ts` (lines 456-576)
- Called when performing RAG retrieval for medical queries
- Includes latency and success/failure

**Current Buckets**: [0.01, 0.05, 0.1, 0.5, 1, 2, 5] seconds

**Missing Labels**:
- Query complexity (simple keyword vs semantic)
- Chunk count retrieved
- Confidence score
- Query type (protocol vs drug vs lab)
- Vector DB provider (Pinecone)

### 4.3 Emergency Detection Metrics

**Current Metrics**:
```
emergency_detection_total{emergency_type, severity} [Counter]
```

**Emergency Categories** (from `backend/src/modules/medical-control-plane/intent-classifier/patterns/emergency.patterns.ts`):

```
CRITICAL Emergencies:
- Cardiac: cardiac arrest, MI, STEMI, cardiogenic shock
- Neurological: stroke, status epilepticus, severe altered mental status
- Respiratory: respiratory arrest, anaphylaxis, severe dyspnea
- Psychiatric: suicidal ideation, homicidal ideation
- Trauma: major trauma, severe hemorrhage
- Hemodynamic: shock (all types), hypotension
- Sepsis: signs of severe sepsis/septic shock
- Metabolic: severe hyperglycemia/DKA, severe hypoglycemia

URGENT Emergencies:
- Chest pain, dyspnea, altered mental status, seizures, severe allergic reactions, etc.
```

**How Recorded**:
- Location: `intent-classifier.service.ts` (lines 70-75)
- Called during Phase 0 of intent classification
- All messages checked for emergency keywords
- No false negatives (100% recall requirement)

**Pattern Matching**: 
- ~30 emergency patterns defined
- Keyword-based detection (case-insensitive)
- Returns category, severity, escalation message

**Metrics Labels**:
- `emergency_type`: cardiac, neurological, respiratory, psychiatric, trauma, hemodynamic, sepsis, metabolic
- `severity`: critical, urgent

**Missing Data**:
- Response time (how long from detection to notification)
- Escalation success rate
- False positive rate (if tracked)
- Category distribution over time

---

## 5. BACKEND STRUCTURE

### 5.1 Module Organization
**Location**: `backend/src/modules/`

```
modules/
├── audit/                          # Audit logging
├── auth/                           # Authentication
├── chat/                           # Chat service
├── ai/                             # AI/LLM integration
├── medical-control-plane/          # Core medical logic
│   ├── intent-classifier/          # NLU 3-phase pipeline
│   │   ├── intent-classifier.service.ts
│   │   ├── dto/intent-classification.dto.ts
│   │   ├── patterns/
│   │   │   ├── emergency.patterns.ts
│   │   │   ├── tool.patterns.ts
│   │   │   └── clinical.patterns.ts
│   │   └── intent-classifier.module.ts
│   └── tool-orchestrator/          # Tool management
│       ├── tool-orchestrator.service.ts
│       ├── interfaces/clinical-tool.interface.ts
│       └── services/
│           ├── sofa-calculator.service.ts
│           ├── drug-checker.service.ts
│           └── lab-interpreter.service.ts
├── rag/                            # Retrieval-Augmented Generation
│   ├── rag.service.ts
│   ├── embeddings/openai-embeddings.service.ts
│   ├── vector-db/pinecone.service.ts
│   └── utils/document-chunker.ts
├── metrics/                        # Prometheus metrics
│   ├── metrics.service.ts
│   ├── metrics.controller.ts (exposes /metrics endpoint)
│   └── metrics.module.ts
├── middleware/
│   ├── logging.middleware.ts       # HTTP request logging (calls metrics)
│   └── error.middleware.ts
├── encryption/                     # TLS/encryption
├── compliance/                     # HIPAA compliance
└── common/
    └── logger.module.ts            # Winston logger
```

### 5.2 Service Injection Patterns

**Example**: ChatService (line 35-45)
```typescript
constructor(
  private readonly aiService: AIService,
  private readonly intentClassifier: IntentClassifierService,
  private readonly toolOrchestrator: ToolOrchestratorService,
  private readonly auditService: AuditService,
  private readonly ragService: RAGService,
) {}
```

**Key Pattern**: Services injected via NestJS DI, allowing easy metric recording

### 5.3 Existing Instrumentation Patterns

#### Pattern 1: Timing Metrics
```typescript
async someMethod() {
  const startTime = Date.now();
  
  // Do work
  const result = await operation();
  
  // Record duration
  const duration = Date.now() - startTime;
  this.metricsService.recordSomething(duration);
}
```

**Current Usage**: Tool execution, RAG retrieval

#### Pattern 2: Success/Failure Counters
```typescript
try {
  const result = await operation();
  this.metricsService.recordSuccess(operationName);
  return result;
} catch (error) {
  this.metricsService.recordFailure(operationName, errorType);
  throw error;
}
```

**Current Usage**: Tool invocations, RAG retrieval, intent classification

#### Pattern 3: Audit Logging (Secondary to Metrics)
```typescript
await this.auditService.log({
  userId,
  action: AuditAction.TOOL_EXECUTION,
  resource: 'tool/' + toolId,
  details: {
    duration: executionTime,
    success: true,
    toolName: toolName
  }
});
```

**Current Usage**: Tool execution, intent classification, RAG retrieval

#### Pattern 4: Circuit Breaker for External Services
```typescript
private nluCircuitBreaker = { failureCount: 0, openUntil: 0 };
private nluFailureThreshold = 3;
private nluResetMs = 30_000;

private isCircuitOpen(breaker): boolean {
  return breaker.openUntil > Date.now();
}
```

**Current Usage**: NLU service, LLM fallback in intent classifier

---

## 6. KEY FILES IDENTIFIED FOR BATCH 14

### Core Metrics Service
- **[backend/src/modules/metrics/metrics.service.ts](backend/src/modules/metrics/metrics.service.ts)** (284 lines)
  - All metric definitions
  - Recording methods for each metric type
  - Currently ~20 metrics, needs expansion

### Services to Instrument
1. **[backend/src/modules/medical-control-plane/intent-classifier/intent-classifier.service.ts](backend/src/modules/medical-control-plane/intent-classifier/intent-classifier.service.ts)** (453 lines)
   - NLU 3-phase pipeline
   - Add: confidence tracking, phase-specific metrics, accuracy data

2. **[backend/src/modules/medical-control-plane/tool-orchestrator/tool-orchestrator.service.ts](backend/src/modules/medical-control-plane/tool-orchestrator/tool-orchestrator.service.ts)** (426 lines)
   - Tool registry and execution
   - Add: per-tool performance baselines, error categorization

3. **[backend/src/modules/chat/chat.service.ts](backend/src/modules/chat/chat.service.ts)** (760 lines)
   - All chat operations
   - Add: conversation metrics, feature usage metrics, response quality

4. **[backend/src/modules/rag/rag.service.ts](backend/src/modules/rag/rag.service.ts)**
   - RAG retrieval
   - Add: query type metrics, chunk quality metrics, confidence scores

5. **[backend/ml-services/nlu/model.py](backend/ml-services/nlu/model.py)**
   - NLU model predictions
   - Add: prediction confidence tracking, inference time recording

### Configuration Files
- **[config/prometheus.yml](config/prometheus.yml)** - Scrape targets
- **[config/prometheus/alert.rules.yml](config/prometheus/alert.rules.yml)** - Needs new rules for NLU metrics
- **[config/grafana/provisioning/dashboards/](config/grafana/provisioning/dashboards/)** - 10 dashboards (Phase 2) already defined

### Test Files to Reference
- **[backend/test/intent-classification.e2e-spec.ts](backend/test/intent-classification.e2e-spec.ts)** - Intent classification tests
- **[backend/test/tool-orchestrator-api.e2e-spec.ts](backend/test/tool-orchestrator-api.e2e-spec.ts)** - Tool execution tests
- **[backend/test/rag-chat.e2e-spec.ts](backend/test/rag-chat.e2e-spec.ts)** - RAG integration tests

---

## 7. GAP ANALYSIS: WHAT'S MISSING

### 7.1 NLU Metrics Gaps

| Metric | Status | Needed for Batch 14 |
|--------|--------|---------------------|
| Intent classification confidence | ✅ Recorded | Histogram + percentiles |
| NLU model confidence | ✅ Available | Extract + record separately |
| Classification latency by phase | ⚠️ Partial | Phase 1/2/3 separate timing |
| Intent accuracy | ❌ Missing | Ground truth labels needed |
| Fallback frequency | ❌ Missing | Track phase transitions |
| NLU service availability | ❌ Missing | Uptime metrics |
| LLM fallback usage rate | ❌ Missing | How often LLM used? |
| Classification method distribution | ❌ Missing | % keyword vs NLU vs LLM |

### 7.2 Tool Performance Gaps

| Metric | Status | Needed for Batch 14 |
|--------|--------|---------------------|
| Tool execution time | ✅ Recorded | Already collected |
| Success/failure rate | ✅ Recorded | Already tracked |
| Error categorization | ❌ Missing | What types of errors? |
| Input complexity metrics | ❌ Missing | Number of drugs, labs, etc. |
| Tool-specific parameters | ❌ Missing | SOFA score ranges, etc. |
| Execution time vs parameter | ❌ Missing | Does complexity affect speed? |
| Tool combination patterns | ❌ Missing | Multi-tool sequences |
| User's perceived tool accuracy | ❌ Missing | Do users accept/correct results? |

### 7.3 Business Metrics Gaps

| Metric | Status | Needed for Batch 14 |
|--------|--------|---------------------|
| Tool invocation frequency | ✅ Recorded | Already tracking |
| Intent distribution | ❌ Missing | Which intents most common? |
| Emergency detection rate | ✅ Recorded | Already tracking |
| RAG retrieval success | ✅ Recorded | Already tracking |
| RAG retrieval confidence | ❌ Missing | Confidence scores |
| Query complexity metrics | ❌ Missing | Simple vs complex queries |
| Feature usage patterns | ❌ Missing | Which features used most? |
| User engagement metrics | ❌ Missing | Conversation depth, follow-ups |
| Clinician satisfaction | ❌ Missing | Feedback metrics |
| Accuracy feedback loops | ❌ Missing | User corrections/validations |

### 7.4 Infrastructure Gaps

| Gap | Impact | Batch 14 Task? |
|-----|--------|-----------------|
| Database query metrics not integrated | Medium | Optional - add to services |
| Cache metrics not recorded | Low | Optional - add Redis integration |
| Active users metric not updated | Low | Optional - add session tracking |
| No distributed tracing | Medium | Phase 4 (OpenTelemetry) |
| No custom metric exporters | Low | Use prom-client directly |
| No metric cardinality limits | High | Define label explosion rules |
| Metric retention (30 days) | Low | Current: adequate for Phase 1 |

---

## 8. INSTRUMENTATION INSIGHTS

### 8.1 Confidence Scoring Available
**In Classification**:
- Keyword match confidence: Always available (0-1)
- NLU model confidence: From response.confidence
- LLM confidence: Inferred from reasoning text
- Overall: User can request detailed confidence breakdown

**In RAG Retrieval**:
- Chunk similarity scores (from vector DB)
- Source quality scores (based on chunk metadata)
- Overall RAG confidence calculated (lines 90-120 in rag.service.ts)

**In Tool Execution**:
- Success flag (binary) - no confidence scores yet
- Error details in logs
- No tool-specific confidence metrics

### 8.2 Performance Baseline Patterns

**Phase 1 (Keyword)**: 1-5ms
- Pure string matching
- Negligible overhead
- No external calls

**Phase 2 (NLU)**: 40-100ms
- HTTP overhead: ~10-20ms
- Model inference: ~20-50ms
- Tokenization: ~10-20ms

**Phase 3 (LLM)**: 500-2000ms
- API call + network: ~100-500ms
- Model inference: ~200-1000ms
- Parsing response: ~10-50ms

**Tool Execution**: 10-2000ms
- SOFA: 10-20ms (pure computation)
- Drug Checker: 20-50ms (DB lookup) to 1-2s (AI call)
- Lab Interpreter: 50-100ms (rule-based) to 1-2s (AI call)

**RAG Retrieval**: 100-500ms
- Query embedding: 50-150ms
- Vector DB query: 20-100ms
- Filtering/reranking: 30-100ms

### 8.3 Logging Integration Points

**Current Logging**:
- `AuditService.log()`: For audit trail (compliance)
- `Logger.log/warn/error`: For application logs

**Log Destinations**:
- Winston → Elasticsearch (via Logstash pipeline)
- Kibana: 15+ saved searches for forensics
- Sentry: Error tracking (critical + errors only)

**Existing Saved Searches** (from BATCH_13_PHASE_2_KIBANA.md):
- Tool Invocations (duration, status, success rate)
- Intent Classification (success rate, confidence)
- RAG Retrieval Performance (latency by component)
- Emergency Detections (type, severity, category)

**For Batch 14**: Metrics ⊕ Logs = complete observability
- Metrics: Real-time dashboards, quantitative analysis
- Logs: Root cause analysis, user context, qualitative insights

---

## 9. TECHNICAL CONSTRAINTS & OPPORTUNITIES

### 9.1 Constraints

1. **Label Cardinality**
   - Prometheus can handle 1000s of unique label combinations
   - Watch out for: too many dynamic labels (user IDs, conversation IDs)
   - Solution: Use only categorical labels (tool_name, intent_type, severity)

2. **Histogram Buckets**
   - Too many buckets = storage overhead
   - Too few = loss of precision
   - Current pattern: use 8-10 logically-spaced buckets
   - Example: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10] for tool execution

3. **Gauge vs Counter**
   - Gauges go up/down (current active value)
   - Counters always go up (cumulative)
   - `active_users`: Gauge  
   - `tool_invocations_total`: Counter
   - `emergency_detection_total`: Counter

4. **Circuit Breaker State**
   - NLU and LLM have circuit breakers (prevent cascade failures)
   - Fallback metrics need contextual labels
   - Example: `intent_classification_method{method="keyword|nlu|llm"}`

### 9.2 Opportunities

1. **Confidence Score Histograms**
   - Intent classification confidence: [0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99]
   - NLU model confidence: Same buckets
   - RAG confidence: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]
   - Reveals distribution shift, model degradation

2. **Phase-Specific Intent Metrics**
   - Track separately: keyword_classification, nlu_classification, llm_classification
   - Analyze fallback patterns: keyword→nlu, nlu→llm, etc.
   - Identify when cheaper phases (keyword/NLU) working vs when LLM needed

3. **Tool-Specific Metrics**
   - `sofa_calculator_score{score_range}`: Low/Medium/High organ failure
   - `drug_checker_interactions{severity}`: Count by major/moderate/minor
   - `lab_interpreter_abnormal_count`: Number of abnormal results per query
   - **Opportunity**: Correlate with patient outcomes (future)

4. **Query Complexity Metrics**
   - `intent_classification_message_length`
   - `rag_query_length{query_type}`
   - `tool_parameter_count{tool_name}`
   - **Insight**: Do longer queries need LLM more often?

5. **Feature Adoption Metrics**
   - Which tools most used?
   - Which intents most common?
   - Which RAG query types most popular?
   - **Opportunity**: Data-driven feature prioritization

6. **User Engagement Metrics**
   - Conversation depth (turns per session)
   - Tool usage per user role
   - Response satisfaction (if user asks follow-up vs stops)
   - **Future**: Retention metrics

### 9.3 Quick Wins for Batch 14

**High Value, Low Effort**:
1. Add `method` label to intent_classification metrics
2. Add NLU confidence histogram (already available in response)
3. Add RAG confidence histogram (already calculated)
4. Track intent distribution with counter (one cardinality dimension)
5. Add per-tool error categorization (success → error details)

**Medium Value, Medium Effort**:
1. Add message length metrics (classify queries by complexity)
2. Add tool-specific parameter metrics (SOFA scores, drug count)
3. Add phase timing separately (keyword vs NLU vs LLM times)
4. Extract NLU model confidence for separate tracking

**High Value, Higher Effort**:
1. Implement ground truth tracking (for accuracy metrics)
2. Add user feedback loops (did user accept result?)
3. Correlate metrics with audit logs (richer context)
4. Build real-time dashboards for ops team

---

## 10. RECOMMENDATIONS FOR BATCH 14

### 10.1 Phase 1: Core Custom Metrics (Week 1)

**Priority 1 Metrics**:
```typescript
// NLU Confidence Distribution
intent_classification_confidence{method} [Histogram]
nlu_model_confidence [Histogram]
rag_retrieval_confidence [Histogram]

// Intent Classification Method Distribution
intent_classification_total{method, primary_intent} [Counter]

// Tool-Specific Error Codes
tool_execution_errors{tool_name, error_code} [Counter]

// Phase Timing (separate from total)
intent_classification_phase1_duration [Histogram]
intent_classification_phase2_duration [Histogram]
intent_classification_phase3_duration [Histogram]
```

**Tasks**:
1. Extend MetricsService with new metric definitions
2. Add recording calls in IntentClassifierService (each phase)
3. Update ToolOrchestratorService with error categorization
4. Add RAG confidence recording in RAGService
5. Update Prometheus config with new scrape filters
6. Write unit tests (40+ test cases)

### 10.2 Phase 2: Dashboards & Alerts (Week 2)

**New Dashboards**:
1. NLU Performance Dashboard (confidence distribution, phase timing)
2. Tool Performance Baselines (per-tool benchmarks)
3. Business Metrics Dashboard (feature adoption, intent distribution)
4. Emergency Detection Dashboard (types, severity, response time)

**Alert Rules**:
1. NLU Confidence Degradation (mean < 0.75)
2. Tool Performance Regression (95th percentile > baseline + 50%)
3. High Fallback Rate (LLM used >30% of time)
4. Intent Misclassification Rate (need user feedback mechanism)

### 10.3 Phase 3: Accuracy Tracking (Week 3)

**Ground Truth Mechanisms**:
1. User feedback on classification accuracy (+/- button)
2. Clinician override tracking (when user selects different intent)
3. Tool result validation (user accepts or modifies)
4. Correction logging (store both original and corrected intent)

**Accuracy Metrics**:
```
intent_classification_accuracy [Gauge] - updated via user feedback
tool_result_acceptance_rate{tool_name} [Counter]
rag_retrieval_relevance_score [Gauge]
emergency_detection_false_positive_rate [Gauge]
```

**Dashboard**: Accuracy trends over time per intent/tool

### 10.4 Phase 4: Advanced Instrumentation (Week 4)

**Distributed Tracing**: OpenTelemetry (Phase 4, post-Batch 14)
- Trace intent classification phases end-to-end
- Correlate tool execution with RAG retrieval
- Multi-service call graphs

**Query-Level Analytics**:
- What patterns lead to LLM fallback?
- Which intents need improvement?
- Tool combinations that work well together

---

## 11. IMPLEMENTATION CHECKLIST FOR BATCH 14

### Phase 1 Tasks (Week 1)

- [ ] **Task 1.1**: Add new metrics to MetricsService
  - Location: `backend/src/modules/metrics/metrics.service.ts`
  - Add 8-10 new metric definitions
  - Total lines added: ~100

- [ ] **Task 1.2**: Integrate NLU metrics into IntentClassifierService
  - Location: `backend/src/modules/medical-control-plane/intent-classifier/intent-classifier.service.ts`
  - Record confidence per phase
  - Record phase timing
  - Track method distribution
  - Lines: ~50 additions

- [ ] **Task 1.3**: Enhance tool metrics in ToolOrchestratorService
  - Location: `backend/src/modules/medical-control-plane/tool-orchestrator/tool-orchestrator.service.ts`
  - Add error type categorization
  - Record parameter counts
  - Lines: ~30 additions

- [ ] **Task 1.4**: Update RAG confidence recording
  - Location: `backend/src/modules/rag/rag.service.ts`
  - Extract and record confidence histogram
  - Add query type labels
  - Lines: ~20 additions

- [ ] **Task 1.5**: Write unit tests
  - 40+ test cases covering:
    - Metric creation/registration
    - Recording calls with correct labels
    - Histogram bucket boundaries
    - Counter operations
  - Files: `metrics.service.spec.ts` (new), tests for each service

- [ ] **Task 1.6**: Update Prometheus rules
  - File: `config/prometheus/alert.rules.yml`
  - Add 5-8 new alert rules
  - Lines: ~80

### Phase 2 Tasks (Week 2)

- [ ] **Task 2.1**: Create NLU Performance Dashboard
- [ ] **Task 2.2**: Create Tool Performance Dashboard
- [ ] **Task 2.3**: Create Business Metrics Dashboard
- [ ] **Task 2.4**: Create Emergency Detection Dashboard
- [ ] **Task 2.5**: Add alert notifications

### Phase 3 Tasks (Week 3)

- [ ] **Task 3.1**: Add user feedback mechanism (API endpoint)
- [ ] **Task 3.2**: Create accuracy tracking service
- [ ] **Task 3.3**: Implement feedback recording

### Phase 4 Tasks (Week 4)

- [ ] **Task 4.1**: OpenTelemetry setup (Phase 4)
- [ ] **Task 4.2**: Distributed tracing integration
- [ ] **Task 4.3**: Query analytics dashboard

---

## 12. RESOURCES & REFERENCES

### Code Files Summary
| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| metrics.service.ts | 284 | Prometheus metrics | ✅ Ready to extend |
| intent-classifier.service.ts | 453 | NLU 3-phase pipeline | ✅ Ready to instrument |
| tool-orchestrator.service.ts | 426 | Tool execution | ✅ Ready to enhance |
| chat.service.ts | 760 | Chat operations | ✅ Ready to add metrics |
| rag.service.ts | ~200 | RAG retrieval | ✅ Ready to instrument |
| alert.rules.yml | 200+ | Prometheus rules | ✅ Ready for new rules |

### Documentation References
- BATCH_13_PHASE_1_COMPLETE.md - Current metrics infrastructure
- BATCH_13_PHASE_2_COMPLETE.md - Dashboards & alerts (template)
- BATCH_13_PHASE_2_KIBANA.md - Log analysis saved searches
- BATCH_13_PHASE_1_QUICK_REFERENCE.md - Quick implementation reference
- MEDICAL_CONTROL_PLANE.md - Architecture details
- IMPLEMENTATION_PLAN.md - Original plan (Batch 2 tool orchestrator)

### External Standards
- Prometheus Best Practices: https://prometheus.io/docs/practices/naming/
- OpenMetrics Spec: https://github.com/OpenObservability/OpenMetrics/blob/main/specification/OpenMetrics.md
- Prometheus Python Client: https://prometheus-client.readthedocs.io/

---

## 13. CONCLUSION

**Current State**: 
- ✅ Solid foundation with 20+ base metrics
- ✅ Core business operations (tools, RAG, intent) partially instrumented
- ✅ Metrics infrastructure ready for expansion
- ✅ Alert rules framework in place

**Batch 14 Opportunity**:
- Add 10-15 custom business metrics
- Implement confidence scoring across NLU, tool, and RAG systems
- Add performance baselines and anomaly detection
- Build business intelligence dashboards
- Create feedback loops for continuous improvement

**Effort Estimate**:
- Phase 1 (Core metrics): 2-3 days
- Phase 2 (Dashboards): 2-3 days
- Phase 3 (Accuracy tracking): 2-3 days
- Phase 4 (Advanced tracing): 2-3 days
- **Total**: 2-3 weeks elapsed time (with parallelization)

**Risk Mitigation**:
- Start with high-value, low-effort metrics (confidence histograms, method distribution)
- Use existing patterns from Phase 1 metrics
- Test with comprehensive unit tests before deployment
- Roll out gradually (one dashboard at a time)
- Monitor for cardinality explosion with automated checks

---

**Report Completed**: January 30, 2026  
**Next Step**: Proceed to Batch 14 implementation plan based on these findings
