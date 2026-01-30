# 🚀 BATCH 9 PREPARATION: Advanced NLU with Fine-Tuned BERT

**Status**: Ready to Begin  
**Estimated Duration**: 7-10 days (includes model training)  
**Date**: January 30, 2026

---

## 📋 Overview

**Batch 9** introduces intelligent Natural Language Understanding (NLU) using fine-tuned BERT model for clinical intent classification. This replaces naive keyword matching with state-of-the-art language models, enabling accurate detection of:

- Clinical tool requests (SOFA, drug interactions, lab interpretation)
- Emergency situations (cardiac, neurological, respiratory events)
- General queries vs structured clinical data access
- Medication, procedure, and diagnostic intent

**Key Innovation**: Separate Python ML microservice communicates with Node.js backend via REST API, enabling:
- Independent scaling of ML workloads
- Easy model swapping and A/B testing
- Production-grade inference with FastAPI
- Docker containerization for deployment

---

## 🎯 Success Criteria

| Metric | Target | Current |
|--------|--------|---------|
| Intent Classification Accuracy | >90% on test set | TBD |
| Inference Latency (p95) | <50ms | TBD |
| Model Throughput | >100 req/s | TBD |
| Fallback Accuracy (GPT-4) | >95% | N/A |
| E2E Test Coverage | All workflows tested | TBD |

---

## 📦 Deliverables

### Phase 1: ML Infrastructure (Days 1-2)
- [ ] Python microservice skeleton with FastAPI
- [ ] Dockerfile for ML service
- [ ] Docker Compose integration
- [ ] Environment configuration

### Phase 2: Dataset & Training (Days 3-5)
- [ ] Training dataset collection (500+ examples per intent)
- [ ] Data augmentation and preprocessing
- [ ] Fine-tuning script with evaluation
- [ ] Model checkpoint and metrics

### Phase 3: Integration (Days 6-7)
- [ ] NLU API endpoints tested
- [ ] IntentClassifier updated to call NLU service
- [ ] Fallback to GPT-4 when confidence < 0.7
- [ ] Error handling and retries

### Phase 4: Testing & Docs (Days 8-10)
- [ ] Unit tests for NLU service
- [ ] Integration tests with backend
- [ ] Performance benchmarking
- [ ] Documentation and deployment guide

---

## 🛠️ Technical Stack

**Machine Learning**:
- Framework: PyTorch + Hugging Face Transformers
- Base Model: `microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext` (biomedical tuned)
- Alternative: `distilbert-base-uncased` (faster, smaller)
- Training: Python 3.9+, CUDA 11.8 (GPU training)

**Service**:
- API Framework: FastAPI 0.100+
- WSGI Server: Uvicorn
- Containerization: Docker + Docker Compose
- Port: 8001 (separate from Node backend on 8000)

**Integration**:
- HTTP Client: httpx or requests
- Retry Logic: exponential backoff
- Caching: Redis (optional, for inference cache)

---

## 📂 Directory Structure

```
backend/
├── ml-services/nlu/
│   ├── Dockerfile                 # Multi-stage Docker build
│   ├── requirements.txt            # Python dependencies
│   ├── app.py                      # FastAPI server + endpoints
│   ├── model.py                    # Model loading and inference
│   ├── train.py                    # Training script
│   ├── evaluate.py                 # Evaluation metrics
│   ├── data/
│   │   ├── train.jsonl            # Training data (500+ examples)
│   │   ├── val.jsonl              # Validation data
│   │   └── test.jsonl             # Test data
│   ├── models/
│   │   └── best_model/            # Checkpoints saved here
│   ├── config.py                   # Hyperparameters
│   └── utils.py                    # Helpers (tokenization, etc.)
├── docker-compose.yml             # Add NLU service
└── src/modules/medical-control-plane/
    └── intent-classifier/
        └── intent-classifier.service.ts  # Call NLU via HTTP
```

---

## 🎓 Intent Classes

The NLU model will classify into these 5-7 intents:

| Intent | Examples | Model Output |
|--------|----------|--------------|
| **emergency** | "chest pain", "patient coding", "stroke alert" | `{intent: "emergency", confidence: 0.98, subcategory: "cardiac"}` |
| **clinical_tool** | "calculate SOFA", "drug interaction aspirin*warfarin" | `{intent: "clinical_tool", tool: "sofa", confidence: 0.95}` |
| **lab_query** | "interpret these labs", "what do these values mean" | `{intent: "lab_query", confidence: 0.92}` |
| **protocol_search** | "sepsis protocol", "ACLS guidelines" | `{intent: "protocol", confidence: 0.88}` |
| **general_query** | "tell me about diabetes", "how do I use this app" | `{intent: "general", confidence: 0.85}` |
| **patient_data** | "show patient history", "export labs" | `{intent: "patient_data", requires_auth: true, confidence: 0.90}` |
| **admin_function** | "configure HIPAA settings", "view audit logs" | `{intent: "admin", requires_admin: true, confidence: 0.93}` |

---

## 🚀 Training Process

### 1. Dataset Preparation
```json
// Format: backend/ml-services/nlu/data/train.jsonl
{"text": "Patient with chest pain and dyspnea, BP 180/100", "intent": "emergency", "subcategory": "cardiac"}
{"text": "Calculate SOFA score for this patient", "intent": "clinical_tool"}
{"text": "What's the interaction between warfarin and aspirin?", "intent": "clinical_tool"}
{"text": "Interpret these lab values for me", "intent": "lab_query"}
```

### 2. Fine-Tuning
```bash
cd backend/ml-services/nlu
python train.py \
  --model microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext \
  --epochs 5 \
  --batch_size 16 \
  --learning_rate 2e-5 \
  --output_dir ./models/best_model
```

### 3. Evaluation
```bash
python evaluate.py --model ./models/best_model
# Output: 
# Accuracy: 91.2%
# Macro F1: 0.908
# Latency (p95): 42ms
```

---

## 🔌 API Specification

### NLU Predict Endpoint
```http
POST /predict

Content-Type: application/json

{
  "text": "Patient presenting with chest pain and shortness of breath",
  "include_embeddings": false
}

200 OK
{
  "intent": "emergency",
  "confidence": 0.98,
  "subcategory": "cardiac",
  "severity": "critical",
  "key_terms": ["chest pain", "dyspnea"],
  "embeddings": null,
  "processing_time_ms": 38
}
```

### Health Check Endpoint
```http
GET /health

200 OK
{
  "status": "healthy",
  "model": "biomedbert-clinical-v1",
  "model_size_mb": 270,
  "inference_batch_size": 32,
  "uptime_seconds": 3600
}
```

### Batch Predict Endpoint
```http
POST /batch-predict

{
  "texts": ["chest pain", "drug interaction", "SOFA score"]
}

200 OK
{
  "results": [
    {"text": "chest pain", "intent": "emergency", "confidence": 0.98},
    {"text": "drug interaction", "intent": "clinical_tool", "confidence": 0.95},
    {"text": "SOFA score", "intent": "clinical_tool", "confidence": 0.96}
  ],
  "processing_time_ms": 54
}
```

---

## 🔗 Integration with Backend

Update `IntentClassifier` service to use NLU:

```typescript
// backend/src/modules/medical-control-plane/intent-classifier/intent-classifier.service.ts

async classify(message: string, context: Message[]): Promise<IntentClassification> {
  // Phase 1: Fast keyword matching (fallback)
  const keywordResult = this.keywordMatcher(message);
  
  // Phase 2: NLU service for high-confidence classification
  try {
    const nluResult = await this.nluService.predict(message);
    
    if (nluResult.confidence >= 0.7) {
      // Use NLU result
      return {
        primaryIntent: nluResult.intent,
        toolId: this.mapIntentToTool(nluResult),
        confidence: nluResult.confidence,
        extractedParameters: this.extractParameters(message, nluResult),
        emergencyKeywords: nluResult.severity === 'critical' ? nluResult.key_terms : [],
      };
    }
  } catch (error) {
    // Fallback on any NLU error
    this.logger.warn(`NLU service failed: ${error.message}, using GPT-4`);
  }
  
  // Phase 3: GPT-4 fallback for ambiguous cases
  if (keywordResult.confidence < 0.7) {
    const gpt4Result = await this.openaiService.classifyIntent(message);
    return gpt4Result;
  }
  
  return keywordResult;
}
```

---

##  Database & Caching

### Optional Redis Caching for Inference
```typescript
// Cache NLU results for 1 hour to reduce model inference
async predict(text: string): Promise<NLUResult> {
  const cacheKey = `nlu:${hash(text)}`;
  
  // Check cache
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Call NLU service
  const result = await this.nluService.predict(text);
  
  // Cache result
  await this.redis.setex(cacheKey, 3600, JSON.stringify(result));
  
  return result;
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Tokenization and preprocessing
- Model loading from checkpoint
- Inference correctness
- Edge cases (very long text, special characters, empty input)

### Integration Tests
- FastAPI endpoint availability
- Request/response format validation
- Error handling (service unavailable, timeout)
- Fallback to GPT-4

### Performance Tests
- Inference latency benchmarking
- Memory usage under load
- Batch processing efficiency
- Model size optimization

### Data Tests
- Dataset balance check (class distribution)
- Train/val/test split integrity
- No label leakage
- Edge case coverage

---

## 📊 Training Hyperparameters

```python
# config.py
TRAINING_CONFIG = {
    "model_name": "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext",
    "num_epochs": 5,
    "batch_size": 16,
    "learning_rate": 2e-5,
    "warmup_steps": 500,
    "weight_decay": 0.01,
    "max_grad_norm": 1.0,
    "seed": 42,
    "early_stopping_patience": 3,
    "early_stopping_threshold": 0.01,  # Stop if val loss doesn't improve by 1%
}

INFERENCE_CONFIG = {
    "batch_size": 32,
    "max_length": 512,  # Maximum token length
    "num_workers": 4,   # CPU inference workers
    "use_gpu": True,
}
```

---

## ⚠️ Known Challenges

1. **Model Size**: BiomedBERT is 270MB, need to optimize for deployment
   - Solution: Use quantization, knowledge distillation, or smaller base model

2. **Training Data**: Finding 500+ labeled clinical intent examples
   - Solution: Synthetic data generation, domain expert annotation

3. **Domain Shift**: Models trained on general medical data may not match institutional workflows
   - Solution: Fine-tune on organization-specific data, monitor predictions

4. **Latency**: Model inference might exceed 50ms budget
   - Solution: GPU acceleration, batching, caching, model quantization

5. **Service Reliability**: New Python service adds complexity
   - Solution: Comprehensive health checks, circuit breaker pattern, fallback to keyword matching

---

## 📅 Milestone Dates

| Milestone | Date | Owner |
|-----------|------|-------|
| ML Service Setup | Day 2 | DevOps |
| Dataset Collection | Day 3 | Data Engineer |
| Model Training Complete | Day 5 | ML Engineer |
| Integration Complete | Day 7 | Backend Engineer |
| Testing Pass | Day 9 | QA |
| Documentation Complete | Day 10 | Technical Writer |

---

## 🔐 Security & Compliance

- **Model Versioning**: Tag every trained model with commit hash
- **Inference Logging**: Log all predictions for audit trail
- **Input Validation**: Sanitize text input to prevent injection
- **Rate Limiting**: Implement on /predict endpoint (100 req/min per user)
- **HIPAA Compliance**: Do NOT log patient-identifying info in model predictions

---

## 🎬 Quick Start Checklist

- [ ] Python 3.9+, pip, virtual environment
- [ ] PyTorch installation (CPU or GPU)
- [ ] Hugging Face token for model downloads
- [ ] Docker and Docker Compose
- [ ] Postman or curl for API testing
- [ ] GPU (optional, for faster training)

---

## 📚 Dependencies

```
# backend/ml-services/nlu/requirements.txt
fastapi==0.100.0
uvicorn[standard]==0.23.0
torch==2.0.1
transformers==4.33.0
datasets==2.14.0
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.0
tqdm==4.66.1
pydantic==2.3.0
python-dotenv==1.0.0
```

---

## Next Steps

1. **Today**: Review this preparation document, gather dataset examples
2. **Tomorrow**: Set up Python environment and FastAPI skeleton
3. **Day 3**: Begin dataset annotation and model training setup
4. **Days 4-7**: Train model and validate results
5. **Days 8-10**: Integrate with backend, test, document

---

**Ready to begin Batch 9? Let's build intelligent clinical NLU! 🧠**

