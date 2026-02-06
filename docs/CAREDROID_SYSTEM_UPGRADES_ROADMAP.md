# CareDroid System Upgrades Roadmap (Post Three-Phase Intent Pipeline)

## Purpose
This document proposes **next upgrades** to the current CareDroid system, building on the existing three-phase intent architecture (keyword → NLU model → LLM fallback) and existing NLU microservice.

It is implementation-oriented and scoped to what is already present in this repository.

---

## 1) Current Baseline (Already in Place)

### 1.1 Intent Control Plane
- Three-phase intent routing in backend:
  1. Keyword detection for fast and deterministic triage.
  2. NLU microservice `/predict` classification.
  3. LLM structured fallback for low-confidence/complex queries.
- Emergency detection is performed before normal routing and has escalation integration.

### 1.2 NLU Microservice
- In-repo FastAPI service for clinical intent classification.
- Transformer-based sequence classification model wrapper (lazy loading + batch predict).
- Training/evaluation scripts and seed datasets are already available.

### 1.3 Observability Foundation
- Intent/NLU metrics service exists.
- Circuit-breaker handling exists for both NLU and LLM phases.
- Audit logging is already integrated in chat processing.

---

## 2) Upgrade Objectives

1. **Increase clinical safety** via stronger confidence calibration and fail-safe routing.
2. **Increase model ownership** by improving NLU quality and introducing specialized heads.
3. **Improve MLOps reliability** with versioned model governance and drift detection.
4. **Reduce external LLM cost/latency** while preserving quality through selective routing.

---

## 3) Recommended Upgrades

## Upgrade A — Confidence Calibration + Abstain Policy (P0)

### What to add
- Temperature scaling or isotonic calibration for NLU output probabilities.
- "Abstain" policy when confidence is below calibrated threshold.
- Per-intent thresholds reviewed by clinical risk level.

### Why
- Raw softmax confidence is often overconfident for out-of-distribution clinical text.
- Reduces unsafe auto-routing and overtrust in uncertain predictions.

### Deliverables
- `calibration_metrics.json` generation in NLU evaluation pipeline.
- Configurable calibration artifact loading in NLU service startup.
- Threshold table maintained per intent/risk tier.

---

## Upgrade B — Intent Taxonomy Expansion (P0/P1)

### What to add
Expand intent schema from broad categories to operationally useful classes:
- `emergency_risk`
- `tool_selection`
- `medication_safety`
- `documentation_assist`
- `protocol_lookup`
- `patient_data_query`
- `general_clinical_qna`

### Why
- Current broad classes hide misroutes and make drift hard to detect.
- Better routing fidelity for downstream tool-orchestrator and RAG.

### Deliverables
- New label set specification.
- Label mapping compatibility layer for backward compatibility.
- Retrained NLU model + migration notes.

---

## Upgrade C — Dual Emergency Guardrails (P0)

### What to add
- Keep keyword emergency detection as deterministic guardrail.
- Add neural emergency risk head only as a secondary signal.
- Safety rule: emergency escalation triggers if **either** deterministic or neural path fires above critical thresholds.

### Why
- Maintains explainability and recall while improving sensitivity for nuanced phrasing.

### Deliverables
- Emergency risk score in classification metadata.
- Escalation policy matrix documenting deterministic/neural combinations.

---

## Upgrade D — RAG Gating Classifier (P1)

### What to add
- Classifier head to determine if an answer **must** be grounded by citations before generation.
- Enforce RAG-required mode for medication and protocol-sensitive intents.

### Why
- Prevents unsupported generation in high-risk response categories.

### Deliverables
- `requires_grounding` boolean in routing context.
- Prompt policy updates when grounding is mandatory.

---

## Upgrade E — Model Registry & Promotion Gates (P1)

### What to add
- Lightweight model registry manifest (`model_id`, `dataset_version`, `metrics`, `created_at`, `approved_by`).
- Promotion workflow:
  - candidate model in shadow mode,
  - compare against champion,
  - auto-block promotion if safety metrics regress.

### Why
- Needed for reproducibility, audits, rollback, and incident response.

### Deliverables
- `models/registry.json` (or DB table) standard.
- Promotion checklist and rollback playbook.

---

## Upgrade F — Distillation Pipeline (P1/P2)

### What to add
- Teacher-student data pipeline:
  1. teacher (GPT/Claude) structured labels,
  2. clinician adjudication on disagreements,
  3. training dataset consolidation,
  4. student transformer retraining.

### Why
- Accelerates in-domain model ownership while preserving expert alignment.

### Deliverables
- `distillation_dataset.jsonl` schema.
- disagreement sampling policy.
- periodic retraining job.

---

## Upgrade G — Local Generation Shadow Mode (P2)

### What to add
- Introduce local clinical-tuned generator in **shadow mode** only.
- Serve external LLM response to users; store local generator output for offline evaluation.
- Compare factuality/citation adherence/safety constraints.

### Why
- De-risks transition to owned generation without user-facing regressions.

### Deliverables
- Shadow inference pipeline and eval dashboard.
- Safety scorecard with go/no-go criteria.

---

## 4) Reliability & Performance Upgrades

### 4.1 NLU Service SLOs
- Set p95 latency and availability targets.
- Add endpoint-level saturation metrics (queue depth, model load time, inference timeout rate).

### 4.2 Circuit Breaker Enhancements
- Exponential backoff for repeated NLU failures.
- Partial-open probes with low-rate canary requests.

### 4.3 Caching
- Cache repeated low-variance intent predictions for short windows.
- Add cache bypass for emergency-sensitive text.

---

## 5) Security & Compliance Upgrades

1. Strict PHI de-identification pipeline for any training/distillation data.
2. Dataset provenance ledger (source, license, de-identification status).
3. Model card per release with intended-use and contraindications.
4. Red-team prompts for unsafe clinical behavior before promotion.

---

## 6) Suggested 90-Day Execution Plan

## Days 1–30 (Foundation)
- Implement calibration + abstain policy.
- Introduce expanded taxonomy spec and compatibility layer.
- Add model registry manifest and promotion checklist.

## Days 31–60 (Safety + Routing)
- Add emergency neural secondary head + dual-trigger policy.
- Add RAG gating classifier and grounding enforcement.
- Launch drift dashboard (class mix, confidence drift, escalation drift).

## Days 61–90 (Ownership Expansion)
- Run distillation pipeline with clinician adjudication loop.
- Train/evaluate updated student model.
- Start local generation shadow mode with safety scorecards.

---

## 7) Success Metrics

### Safety Metrics
- Emergency recall (target maintain/improve).
- Unsafe response rate (target down).
- Escalation misses (target zero).

### Quality Metrics
- Intent F1 by class and by risk tier.
- Tool routing precision.
- Citation-required compliance rate.

### Operational Metrics
- NLU p95 latency.
- LLM fallback percentage (target down as NLU improves).
- Cost/query trend.

---

## 8) Immediate Next Actions

1. Approve expanded intent taxonomy and risk tiers.
2. Define calibration/evaluation acceptance thresholds.
3. Implement registry + promotion gates before next model retrain.
4. Start a clinician-reviewed distillation sample batch.

These upgrades keep CareDroid clinically conservative while moving toward stronger in-house neural capability.
