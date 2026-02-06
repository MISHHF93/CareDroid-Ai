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

## Phase 1 (Immediate, low risk): Strengthen Owned NLU
1. Keep current 3-phase routing.
2. Treat transformer NLU as the primary non-LLM classifier.
3. Expand intent taxonomy to support:
   - emergency_risk,
   - tool_selection,
   - documentation,
   - medication_safety,
   - protocol_lookup,
   - general_chat.
4. Add calibrated confidence + abstain class:
   - if confidence below threshold, defer to LLM + human-safe prompts.

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

### P0 (must do first)
- Define target intent ontology and risk labels.
- Add model version identifiers to NLU responses and backend audit logs.
- Add threshold policy by intent criticality (higher bar for emergency-related classes).

### P1
- Build distillation dataset pipeline (teacher output + clinician correction + final label).
- Add calibration evaluation (ECE/Brier + confusion matrix) to CI for NLU service.
- Add drift dashboard: confidence shift, class frequency shift, escalation rate shift.

### P2
- Introduce specialized heads and A/B route them behind feature flags.
- Add shadow mode for local generator (generate but do not serve).
- Validate against clinical safety benchmark suite before exposure.

## 6) Decision Summary

CareDroid is **not starting from zero**: an internal transformer-based NLU service already exists and is wired into the chat control plane. The safest and fastest path to “its own neural network” is:

1. productionize and harden the existing NLU transformer,
2. distill GPT/Claude knowledge into targeted classifier heads,
3. only then consider partial generation ownership under strict safety gates.

This path minimizes risk while increasing model ownership and reducing long-term external dependency.
