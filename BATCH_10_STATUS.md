# Batch 10 Status: Advanced NLU with Fine-Tuned BERT

Date: January 30, 2026
Owner: Engineering
Status: In Progress

## Summary
Batch 10 brings the Python-based NLU service into the Medical Control Plane via backend integration, with confidence-based routing and GPT fallback. The NLU service infrastructure and training pipeline already exist under backend/ml-services/nlu.

## Current State
- NLU service scaffold exists (FastAPI app, model class, config, training/eval scripts).
- Dataset with 100+ examples exists and is ready for train/val/test split.
- Docker integration is present for the NLU service.

## Pending Work
- Prepare train/val/test split for the dataset.
- Fine-tune the BiomedBERT model and evaluate accuracy/latency.
- Implement the backend NLU client and integrate with intent classification.
- Add fallback to GPT-4 when confidence is below threshold or service is unavailable.

## Next Actions
1. Run data split script and train the model.
2. Add NLU client service in backend and wire into IntentClassifier.
3. Add circuit breaker and retry logic for NLU calls.
4. Update documentation and tests for intent classification.
