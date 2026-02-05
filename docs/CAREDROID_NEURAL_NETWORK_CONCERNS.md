# CareDroid Neural Network Readiness & Concern Report

## Objective
Design a practical path for CareDroid to own more of its neural stack while preserving current safety features (emergency recall, escalation workflows, audit logging, and RAG grounding).

## 1) Current System Scan (What Already Exists)

### 1.1 Existing AI Routing in Production Backend
- CareDroid already uses a **three-phase intent pipeline** in `IntentClassifierService`:
  1. keyword matcher,
  2. external NLU model call (`/predict`),
  3. LLM fallback (via GPT JSON classification).
- This means the system is already architected for a local/owned model at the NLU layer.

### 1.2 Existing Neural Network Service (Own Model Foundation)
- There is an in-repo Python microservice at `backend/ml-services/nlu` running FastAPI.
- It exposes `/predict`, `/batch-predict`, `/health`, `/model-info`.
- It wraps a transformer classifier (`AutoModelForSequenceClassification`) with a biomedical base model default (`PubMedBERT`) and seven intent classes.
- The training scripts (`train.py`, `evaluate.py`) and labeled data files (`data/train.jsonl`, `data/val.jsonl`, `data/test.jsonl`) already exist.

### 1.3 External LLM Dependence Still Dominant for Generation
- The core conversational generation and fallback classification currently rely on OpenAI API calls in `AIService`.
- Therefore, CareDroid currently owns **intent-level NLU scaffolding** but does **not yet own the response-generation model**.

## 2) Key Concerns Identified

### Concern A — NLU exists, but production maturity is incomplete
- The TypeScript intent service itself marks the model phase as not fully implemented in comments, despite external service support.
- Intent label mapping is lossy (multiple NLU labels collapse into broader app intents), which can hide model drift in operations.
- NLU confidence threshold strategy is fixed and not role- or risk-aware.

### Concern B — “Own neural network” scope is undefined
- If “own network” means full replacement of GPT/Claude for final medical response text, current codebase is not ready for that leap in one step.
- Safer interpretation: own critical decision layers first (intent triage, emergency risk, tool routing), then progressively own generation.

### Concern C — Clinical safety + compliance implications
- Any fine-tuned generator for clinical text requires strict governance:
  - dataset provenance,
  - PHI de-identification,
  - regression/safety benchmarks,
  - hard fail-safe fallback.
- Existing emergency guarantees are keyword-first; replacing these with a pure neural detector would reduce explainability unless dual-guardrails stay in place.

### Concern D — MLOps gaps for long-term ownership
- No clear in-repo model registry/version policy, champion/challenger rollout, or automatic drift alarms tied to model versions.
- Retraining triggers and label-quality audit loops are not formalized.

## 3) Recommended Neural Architecture for “CareDroid-Owned” Path

## Phase 1 (Immediate, low risk): Strengthen Owned NLU [✅ IMPLEMENTED]

### Phase 1 Implementation Complete
**Date Completed**: February 5, 2026  
**Status**: All core features implemented and integrated into IntentClassifierService

#### Phase 1 Achievements:
1. ✅ **Expanded Intent Taxonomy** (7 primary + 4 legacy fallback intents):
   - `EMERGENCY` - Life-threatening situations
   - `EMERGENCY_RISK` - Potential emergency requiring triage
   - `MEDICATION_SAFETY` - Drug interactions, contraindications, drug checking
   - `TOOL_SELECTION` - Clinical tool invocation (SOFA, APACHE-II, etc.)
   - `PROTOCOL_LOOKUP` - Clinical protocol and guideline queries
   - `DOCUMENTATION` - Medical record and documentation queries
   - `GENERAL_CHAT` - General conversation and educational queries
   - Legacy fallbacks: `CLINICAL_TOOL`, `ADMINISTRATIVE`, `MEDICAL_REFERENCE`, `GENERAL_QUERY`

2. ✅ **Criticality-Aware Confidence Thresholds** (IntentCriticality enum):
   - **CRITICAL** (0.85+ threshold): EMERGENCY, EMERGENCY_RISK, MEDICATION_SAFETY
   - **HIGH** (0.75+ threshold): TOOL_SELECTION, PROTOCOL_LOOKUP
   - **MEDIUM** (0.70+ threshold): DOCUMENTATION, MEDICAL_REFERENCE
   - **LOW** (0.60+ threshold): GENERAL_CHAT, other intents
   - Role-aware adjustments: clinicians/admins may use 0.95× multiplier on thresholds

3. ✅ **Abstain Mechanism** (low-confidence handling):
   - Added `shouldAbstain` flag to IntentClassification
   - Added `confidenceThreshold` field to track applied threshold
   - Added `criticality` field (IntentCriticality enum)
   - Updated `method` enum to include `'abstain'` state
   - When confidence < threshold: set `shouldAbstain=true`, `method='abstain'`
   - Defers to human-safe prompts or escalation workflow

4. ✅ **Enhanced NLU Mapping**:
   - Updated `mapNluIntent()` to handle expanded taxonomy
   - Maps NLU model outputs to Phase 1 intents (e.g., "drug_interaction" → MEDICATION_SAFETY)
   - Backward compatible with legacy intent names

5. ✅ **Three-Phase Pipeline with Phase 1 Thresholds**:
   - Phase 1 (Keyword): Compare confidence vs. intent-specific threshold
   - Phase 2 (NLU): Compare NLU confidence vs. NLU intent's threshold
   - Phase 3 (LLM): Compare LLM confidence vs. LLM intent's threshold
   - Each phase respects user role and intent criticality

#### Configuration & Usage:
```typescript
// Helper functions available in intent-classification.dto.ts:
getIntentCriticality(intent: PrimaryIntent): IntentCriticality
getConfidenceThreshold(criticality: IntentCriticality, userRole?: string): number
```

#### Metrics & Monitoring:
- Existing NluMetrics service already tracks method, confidence, phase duration
- Added logging of threshold comparisons for debugging/audit
- Intent criticality now logged in classification decisions

---

## Phase 2 (Near term): Add Task-Specific Neural Heads
Add independent lightweight models instead of one giant model:
- **Emergency Risk Head** (binary/ordinal triage severity).
- **Tool Invocation Head** (multi-class routing to clinical tools).
- **Citation Need Head** (classify when RAG grounding is mandatory).

These heads can be distilled from GPT/Claude outputs and clinician-reviewed labels.

## Phase 3 (Medium term): Controlled Local Generator
- Introduce a small/medium healthcare-tuned instruction model for draft generation.
- Keep “safety sandwich”:
  - pre-check classifier,
  - grounded generation (RAG required for clinical claims),
  - post-check verifier (contraindication/risk policy rules),
  - escalation fallback to external model if confidence is low.

## 4) Correspondence Strategy (Your GPT/Claude → Transformer Idea)

To implement “correspondence,” use teacher-student distillation:

1. **Teacher**: GPT/Claude produces structured annotations:
   - intent,
   - risk level,
   - tool ID,
   - rationale tags.
2. **Student**: CareDroid transformer model is trained on these labels + existing labeled data.
3. **Human adjudication loop**: clinicians validate disagreement samples.
4. **Promotion gate**: student replaces teacher for that specific subtask once benchmark thresholds are met.

This achieves neural ownership safely without forcing immediate end-to-end LLM replacement.

## 5) Implementation Backlog (Concrete)

### Phase 1 Backlog [✅ P0 COMPLETE, P1 IN PROGRESS]

#### P0 (must do first) [✅ DONE]
- ✅ Define target intent ontology and risk labels (7 primary + 4 fallback intents)
- ✅ Add model version identifiers to NLU responses and backend audit logs
- ✅ Add threshold policy by intent criticality (higher bar for emergency-related classes)
- ✅ Add abstain flag and criticality tracking to IntentClassification
- ✅ Implement role-aware thresholds (user role support)

#### P1 (Next Priority) [IN PROGRESS]
- ⏳ Build distillation dataset pipeline (teacher output + clinician correction + final label)
  - Requires: labeled dataset with GPT/Claude outputs and clinician validation
  - Status: Ready for implementation once labeled data is available
- ⏳ Add calibration evaluation (ECE/Brier + confusion matrix) to CI for NLU service
  - Requires: evaluation scripts and CI integration
  - Impact: Will measure confidence calibration quality
- ⏳ Add drift dashboard: confidence shift, class frequency shift, escalation rate shift
  - Requires: metrics aggregation and visualization backend
  - Impact: Ops visibility into model behavior changes

#### P2 (Next Phase - after P1)
- Introduce specialized heads (emergency risk classifier, tool router, citation detector)
- Add shadow mode for local generator
- Validate against clinical safety benchmark suite

## 6) Decision Summary [UPDATED: Phase 1 Complete]

CareDroid is **not starting from zero**: an internal transformer-based NLU service already exists and is wired into the chat control plane. The safest and fastest path to "its own neural network" is:

1. ✅ **[COMPLETE]** productionize and harden the existing NLU transformer with expanded intent taxonomy
2. ✅ **[COMPLETE]** add criticality-aware confidence thresholds and abstain mechanism
3. ⏳ **[NEXT]** distill GPT/Claude knowledge into targeted classifier heads
4. 🎯 **[FUTURE]** only then consider partial generation ownership under strict safety gates

### Phase 1 Status
**Completed**: Expanded intent taxonomy, criticality levels, role-aware thresholds, abstain mechanism now integrated into IntentClassifierService. All Phase 1 P0 tasks complete. Ready to begin P1 work (distillation dataset, calibration metrics, drift dashboard).

This phase-1-complete path minimizes risk while increasing model ownership and reducing long-term external dependency.
