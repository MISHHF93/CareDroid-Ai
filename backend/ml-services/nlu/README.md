# NLU Service ReadMe

## Overview

The NLU (Natural Language Understanding) service is a Python FastAPI-based microservice that provides intent classification for medical queries using a fine-tuned BERT model (BiomedBERT).

**Service Dependencies**:
- Python 3.11+
- PyTorch 2.0+
- Hugging Face Transformers
- FastAPI + Uvicorn

**Port**: 8001 (configured in app.py and docker-compose.yml)

---

## Quick Start

### 1. Setup Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# OR (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import torch; import transformers; print('✓ All dependencies installed')"
```

### 2. Prepare Training Data

The training dataset is provided in `data/train.jsonl` with 100+ examples across 7 intent classes:

1. **emergency** - High-risk situations (cardiac, neurological, respiratory, sepsis, trauma, psychiatric)
2. **clinical_tool** - Tool usage requests (SOFA calculator, drug interaction checker)
3. **lab_query** - Lab value interpretation and significance
4. **protocol_search** - Protocol lookup (sepsis, ACLS, institutional)
5. **general_query** - Medical knowledge and pathophysiology
6. **patient_data** - Patient record/history queries
7. **admin_function** - Administrative functions (HIPAA, audit logs)

**Format**: JSONL (one JSON object per line)
```json
{"text": "Patient has severe chest pain", "intent": "emergency", "subcategory": "cardiac"}
{"text": "How do I use the SOFA calculator?", "intent": "clinical_tool"}
```

### 3. Train the Model

Before training, create validation and test datasets:

```bash
# (Optional) Split data if you have a larger dataset
python -c "
import json
from sklearn.model_selection import train_test_split

with open('data/train.jsonl', 'r') as f:
    data = [json.loads(line) for line in f]

# 80/10/10 split
train_data, rest = train_test_split(data, test_size=0.2, random_state=42)
val_data, test_data = train_test_split(rest, test_size=0.5, random_state=42)

# Save splits
with open('data/train.jsonl', 'w') as f:
    for item in train_data:
        f.write(json.dumps(item) + '\n')

with open('data/val.jsonl', 'w') as f:
    for item in val_data:
        f.write(json.dumps(item) + '\n')

with open('data/test.jsonl', 'w') as f:
    for item in test_data:
        f.write(json.dumps(item) + '\n')

print(f'Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}')
"

# Start training
python train.py
```

**Expected Training Time**:
- CPU: 1-2 hours
- GPU (Tesla V100): 15-20 minutes

**Output**:
- Model checkpoints saved to: `models/best_model/`
- Training logs: `logs/` directory
- Metrics: `models/metrics.json`

### 4. Evaluate Model

After training completes:

```bash
python evaluate.py
```

**Output**: Accuracy, F1 scores, latency percentiles
```
==================================================
EVALUATION RESULTS
==================================================
Accuracy: 0.9375
Macro F1: 0.9250
Weighted F1: 0.9370
Macro Precision: 0.9400
Macro Recall: 0.9180

Inference Latency (ms):
  P50: 42.32
  P95: 48.15
  P99: 51.87
  Mean: 43.21
Test Set Size: 48
==================================================
```

### 5. Start the Service

**Option A: Direct Python**

```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8001 --workers 2
```

**Option B: Docker**

```bash
docker build -t caredroid-nlu .
docker run -p 8001:8001 -e NLU_USE_GPU=false caredroid-nlu
```

**Option C: Docker Compose (with entire stack)**

```bash
docker-compose up
# Service available at: http://localhost:8001
```

---

## API Endpoints

### Health Check

```bash
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "model_loaded": true,
  "model_name": "BiomedBERT",
  "intent_classes": 7,
  "uptime_seconds": 125.43
}
```

### Single Prediction

```bash
POST /predict

{
  "text": "Patient presenting with severe chest pain and shortness of breath",
  "include_embeddings": false
}
```

**Response**:
```json
{
  "intent": "emergency",
  "confidence": 0.982,
  "label_id": 0,
  "subcategory": "cardiac",
  "key_terms": ["chest pain", "shortness of breath"],
  "latency_ms": 45.2
}
```

### Batch Prediction

```bash
POST /batch-predict

{
  "texts": [
    "Patient has severe chest pain",
    "How do I interpret this lab value?",
    "Show me the sepsis protocol"
  ]
}
```

**Response**:
```json
{
  "results": [
    {"intent": "emergency", "confidence": 0.98, ...},
    {"intent": "lab_query", "confidence": 0.91, ...},
    {"intent": "protocol_search", "confidence": 0.95, ...}
  ],
  "processing_time_ms": 125.4,
  "batch_size": 3
}
```

### Model Info

```bash
GET /model-info
```

**Response**:
```json
{
  "model_name": "BiomedBERT",
  "model_size_mb": 412.5,
  "parameters": 110000000,
  "device": "cuda",
  "status": "loaded"
}
```

### Intent Classes

```bash
GET /intent-classes
```

**Response**:
```json
{
  "classes": [
    "emergency",
    "clinical_tool",
    "lab_query",
    "protocol_search",
    "general_query",
    "patient_data",
    "admin_function"
  ]
}
```

---

## Configuration

Edit `.env` file to customize:

```bash
# Model Configuration
NLU_MODEL_NAME=BiomedBERT
NLU_MAX_LENGTH=512
NLU_CACHE_DIR=~/.cache/huggingface

# Training Configuration
NLU_EPOCHS=5
NLU_BATCH_SIZE=16
NLU_LEARNING_RATE=2e-5
NLU_WARMUP_STEPS=500

# Inference Configuration
NLU_INFERENCE_BATCH_SIZE=32
NLU_USE_GPU=true
NLU_CONFIDENCE_THRESHOLD=0.5
NLU_NUM_WORKERS=4

# Service Configuration
NLU_HOST=0.0.0.0
NLU_PORT=8001
NLU_WORKERS=2
```

---

## Integration with Backend

The backend Node.js service calls the NLU service at `http://nlu:8001` (via Docker network) with fallback logic:

```typescript
// Simplified example
const nluResponse = await fetch('http://nlu:8001/predict', {
  method: 'POST',
  body: JSON.stringify({ text: userQuery })
});

if (nluResponse.confidence >= 0.7) {
  // Use NLU result
  return nluResponse;
} else {
  // Fallback to GPT-4
  return callGPT4(userQuery);
}
```

---

## Development

### Install Dev Dependencies

```bash
pip install -r requirements-dev.txt
```

### Run Tests

```bash
pytest -v --cov=.
```

### Format Code

```bash
black . && isort .
```

### Type Checking

```bash
mypy .
```

---

## Performance Targets

- **Accuracy**: >90% across all intent classes
- **Latency**: <50ms (p95) for single inference
- **Throughput**: 100+ batch predictions/sec
- **Memory**: <2GB GPU, <500MB CPU

---

## Troubleshooting

### Model Download Slow

First inference downloads model (~500MB). To pre-download:

```bash
python -c "from transformers import AutoModel; AutoModel.from_pretrained('BiomedBERT')"
```

### GPU Not Used

```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"

# Force CPU
export NLU_USE_GPU=false
```

### Out of Memory

Reduce batch size in `.env`:
```bash
NLU_INFERENCE_BATCH_SIZE=16  # Default: 32
```

---

## Production Deployment

1. **Build Docker image**: `docker build -t caredroid-nlu:v1.0 .`
2. **Tag for registry**: `docker tag caredroid-nlu:v1.0 <registry>/caredroid-nlu:v1.0`
3. **Push**: `docker push <registry>/caredroid-nlu:v1.0`
4. **Deploy**: Update `docker-compose.yml` with new image tag and deploy

---

## References

- Model: [BiomedBERT](https://huggingface.co/dmis-lab/biobert-base-cased-v1.1)
- Framework: [FastAPI](https://fastapi.tiangolo.com/)
- ML Library: [Hugging Face Transformers](https://huggingface.co/transformers/)
