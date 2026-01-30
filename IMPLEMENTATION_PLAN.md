# CareDroid Implementation Plan

> **Systematic Migration to Medical Control Plane Architecture**  
> Based on: [PROJECT_SPEC.md](PROJECT_SPEC.md) + [MEDICAL_CONTROL_PLANE.md](MEDICAL_CONTROL_PLANE.md)  
> Last Updated: January 30, 2026

---

## 📋 Overview

This document provides a phased, batch-oriented implementation plan to migrate CareDroid to the full Medical Control Plane architecture with Security-First, HIPAA-By-Design principles.

**Current State**: Basic chat interface with tool selection + JWT auth + audit logging  
**Target State**: Intelligent clinical co-pilot with RAG, NLU, emergency detection, and advanced security

---

## 🎯 Implementation Phases

### **Phase 1: Medical Control Plane Foundation** (Weeks 1-4)
*Goal: Basic intent classification and tool orchestration*

### **Phase 2: Enhanced Security & Audit** (Weeks 5-6)
*Goal: Immutable audit logs, encryption hardening, RBAC*

### **Phase 3: RAG Engine Integration** (Weeks 7-10)
*Goal: Vector database + medical knowledge retrieval*

### **Phase 4: Advanced NLU & Emergency Detection** (Weeks 11-14)
*Goal: Fine-tuned BERT + real-time critical condition alerts*

### **Phase 5: Production Hardening** (Weeks 15-18)
*Goal: MFA, penetration testing, HIPAA documentation*

---

## 📦 Batch 1: Intent Classification System

**Estimated Time**: 5-7 days

### Backend Tasks

- [ ] **1.1** Create `backend/src/modules/medical-control-plane/` directory structure
  ```
  medical-control-plane/
  ├── intent-classifier/
  │   ├── intent-classifier.service.ts
  │   ├── intent-classifier.module.ts
  │   ├── dto/
  │   │   └── intent-classification.dto.ts
  │   └── patterns/
  │       ├── emergency.patterns.ts
  │       ├── tool.patterns.ts
  │       └── clinical.patterns.ts
  └── medical-control-plane.module.ts
  ```

- [ ] **1.2** Implement `IntentClassifier` service (keyword matching phase)
  - File: `backend/src/modules/medical-control-plane/intent-classifier/intent-classifier.service.ts`
  - Methods:
    - `classify(message: string, context: Message[]): Promise<IntentClassification>`
    - `keywordMatcher(message: string): Partial<IntentClassification>`
    - `extractParameters(message: string, toolId: string): Record<string, any>`

- [ ] **1.3** Create intent classification DTOs
  - File: `backend/src/modules/medical-control-plane/intent-classifier/dto/intent-classification.dto.ts`
  - Interfaces:
    ```typescript
    export interface IntentClassification {
      primaryIntent: 'general_query' | 'clinical_tool' | 'emergency' | 'administrative';
      toolId?: string;
      confidence: number;
      extractedParameters: Record<string, any>;
      emergencyKeywords: string[];
    }
    ```

- [ ] **1.4** Define clinical tool patterns
  - File: `backend/src/modules/medical-control-plane/intent-classifier/patterns/tool.patterns.ts`
  - Patterns for: SOFA, drug interactions, lab interpreter, calculators, protocols

- [ ] **1.5** Define emergency detection patterns
  - File: `backend/src/modules/medical-control-plane/intent-classifier/patterns/emergency.patterns.ts`
  - Categories: cardiac, neurological, respiratory, psychiatric, trauma
  - Implement severity levels and escalation protocols

- [ ] **1.6** Register MedicalControlPlane module in app
  - File: `backend/src/app.module.ts`
  - Add to imports: `MedicalControlPlaneModule`

- [ ] **1.7** Update chat controller to use IntentClassifier
  - File: `backend/src/modules/chat/chat.controller.ts`
  - Before calling OpenAI, classify intent
  - Route to appropriate handler based on intent

### Testing Tasks

- [ ] **1.8** Create unit tests for IntentClassifier
  - File: `backend/src/modules/medical-control-plane/intent-classifier/intent-classifier.service.spec.ts`
  - Test cases:
    - Emergency keyword detection (100% recall)
    - Tool pattern matching (>90% accuracy)
    - Parameter extraction
    - Confidence scoring

- [ ] **1.9** Create integration tests for chat flow with intent classification
  - File: `backend/test/intent-classification.e2e-spec.ts`

### Documentation Tasks

- [ ] **1.10** Document intent classification API
  - File: `backend/src/modules/medical-control-plane/README.md`

---

## 📦 Batch 2: Clinical Tool Orchestrator

**Estimated Time**: 5-7 days

### Backend Tasks

- [ ] **2.1** Create tool orchestrator directory structure
  ```
  medical-control-plane/
  └── tool-orchestrator/
      ├── tool-orchestrator.service.ts
      ├── tool-orchestrator.module.ts
      ├── interfaces/
      │   └── clinical-tool.interface.ts
      └── services/
          ├── sofa-calculator.service.ts
          ├── drug-checker.service.ts
          └── lab-interpreter.service.ts
  ```

- [ ] **2.2** Define `ClinicalToolService` interface
  - File: `backend/src/modules/medical-control-plane/tool-orchestrator/interfaces/clinical-tool.interface.ts`
  - Methods: `execute()`, `validate()`, `getSchema()`

- [ ] **2.3** Implement SOFA Calculator service
  - File: `backend/src/modules/medical-control-plane/tool-orchestrator/services/sofa-calculator.service.ts`
  - Calculate respiration, coagulation, liver, cardiovascular, CNS, renal scores
  - Return interpretation + mortality prediction + citations

- [ ] **2.4** Implement Drug Interaction Checker service
  - File: `backend/src/modules/medical-control-plane/tool-orchestrator/services/drug-checker.service.ts`
  - Use OpenAI + medical knowledge base
  - Return severity, mechanism, clinical significance

- [ ] **2.5** Implement Lab Interpreter service
  - File: `backend/src/modules/medical-control-plane/tool-orchestrator/services/lab-interpreter.service.ts`
  - Parse lab values from natural language
  - Return interpretation + clinical significance

- [ ] **2.6** Create ToolOrchestrator service
  - File: `backend/src/modules/medical-control-plane/tool-orchestrator/tool-orchestrator.service.ts`
  - Method: `executeInChat(toolId, params, context): Promise<ChatResponse>`
  - Format results for in-chat presentation (tool cards)

- [ ] **2.7** Update chat service to use ToolOrchestrator
  - File: `backend/src/modules/chat/chat.service.ts`
  - When intent = 'clinical_tool', call orchestrator instead of direct OpenAI

### Frontend Tasks

- [ ] **2.8** Create ToolCard component
  - File: `src/components/ToolCard.jsx`
  - Props: `title`, `data`, `interpretation`, `citations`, `disclaimer`
  - Styled as distinct card within message stream

- [ ] **2.9** Update ChatInterface to render tool cards
  - File: `src/components/ChatInterface.jsx`
  - Detect `message.type === 'tool_result'`
  - Render ToolCard component

- [ ] **2.10** Add tool result styling
  - File: `src/index.css`
  - Classes: `.tool-card`, `.tool-result`, `.tool-citation`

### Testing Tasks

- [ ] **2.11** Unit tests for each clinical tool service
  - Files: `sofa-calculator.service.spec.ts`, `drug-checker.service.spec.ts`, etc.

- [ ] **2.12** Integration tests for tool orchestration
  - File: `backend/test/tool-orchestrator.e2e-spec.ts`

---

## 📦 Batch 3: Immutable Audit Logging

**Estimated Time**: 3-4 days

### Backend Tasks

- [ ] **3.1** Update AuditLog entity with cryptographic integrity
  - File: `backend/src/modules/audit/entities/audit-log.entity.ts`
  - Add fields: `hash` (SHA-256), `previousHash` (blockchain-style chaining)

- [ ] **3.2** Enhance AuditService with hash chaining
  - File: `backend/src/modules/audit/audit.service.ts`
  - Method: `log(entry): Promise<void>` - calculates hash from previous log
  - Method: `verifyIntegrity(): Promise<boolean>` - validates entire chain

- [ ] **3.3** Create database migration for AuditLog updates
  - File: `backend/src/database/migrations/XXXXXX-add-audit-log-hashing.ts`
  - Add `hash` and `previousHash` columns

- [ ] **3.4** Add audit logging for all PHI access
  - Files to update:
    - `backend/src/modules/chat/chat.service.ts` (log message access)
    - `backend/src/modules/users/users.service.ts` (log profile access)
    - Tool services (log tool execution)

- [ ] **3.5** Create audit log viewer endpoint
  - File: `backend/src/modules/audit/audit.controller.ts`
  - Endpoint: `GET /api/audit/logs` (admin only)
  - Filter by user, date range, action type

### Frontend Tasks

- [ ] **3.6** Create AuditLogs page (admin only)
  - File: `src/pages/AuditLogs.jsx`
  - Display audit trail with filters
  - Show integrity verification status

- [ ] **3.7** Add route for audit logs
  - File: `src/App.jsx`
  - Route: `/audit-logs` (protected, admin role required)

### Testing Tasks

- [ ] **3.8** Test audit log integrity verification
  - File: `backend/src/modules/audit/audit.service.spec.ts`
  - Test tampering detection (modify a log mid-chain)

- [ ] **3.9** Test audit logging for all critical actions
  - File: `backend/test/audit-logging.e2e-spec.ts`

---

## 📦 Batch 4: Enhanced Encryption

**Estimated Time**: 3-4 days

### Backend Tasks

- [ ] **4.1** Upgrade TLS configuration to 1.3 only
  - File: `backend/nginx.conf` (if using nginx reverse proxy)
  - Or: `backend/src/main.ts` (Express HTTPS config)
  - Ciphers: `TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384`

- [ ] **4.2** Add HSTS headers
  - File: `backend/src/main.ts`
  - Helmet config: `hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }`

- [ ] **4.3** Implement database encryption for PHI columns
  - Install: `npm install pg-crypto`
  - Create encryption service: `backend/src/modules/encryption/encryption.service.ts`
  - Methods: `encrypt(data)`, `decrypt(data)`, `rotateKey()`

- [ ] **4.4** Create database migration for encrypted PHI
  - File: `backend/src/database/migrations/XXXXXX-encrypt-phi-columns.ts`
  - Convert sensitive columns to encrypted BYTEA type

- [ ] **4.5** Update entities to use encryption
  - Files: `backend/src/modules/users/entities/user.entity.ts`
  - Add `@AfterLoad` and `@BeforeInsert` hooks for auto-encrypt/decrypt

- [ ] **4.6** Implement key rotation mechanism
  - File: `backend/src/modules/encryption/key-rotation.service.ts`
  - Store `encryption_key_id` with each encrypted record
  - Background job to re-encrypt with new key

### Testing Tasks

- [ ] **4.7** Test encryption/decryption flows
  - File: `backend/src/modules/encryption/encryption.service.spec.ts`

- [ ] **4.8** Test TLS 1.3 enforcement
  - Manual test: `curl --tlsv1.2 https://localhost:8000` (should fail)

---

## 📦 Batch 5: Role-Based Access Control (RBAC)

**Estimated Time**: 4-5 days

### Backend Tasks

- [ ] **5.1** Define Permission enum
  - File: `backend/src/modules/auth/enums/permission.enum.ts`
  - Values: `READ_PHI`, `WRITE_PHI`, `EXPORT_PHI`, `USE_CALCULATORS`, `MANAGE_USERS`, `VIEW_AUDIT_LOGS`, `CONFIGURE_SYSTEM`

- [ ] **5.2** Create role-permission mapping
  - File: `backend/src/modules/auth/config/role-permissions.config.ts`
  - Map each role to permissions array

- [ ] **5.3** Implement AuthorizationGuard
  - File: `backend/src/modules/auth/guards/authorization.guard.ts`
  - Decorator: `@RequirePermission(Permission.READ_PHI)`
  - Check user role against permission

- [ ] **5.4** Add permission checks to all protected endpoints
  - Files to update:
    - `backend/src/modules/chat/chat.controller.ts` → `@RequirePermission(Permission.READ_PHI)`
    - `backend/src/modules/users/users.controller.ts` → `@RequirePermission(Permission.MANAGE_USERS)`
    - `backend/src/modules/audit/audit.controller.ts` → `@RequirePermission(Permission.VIEW_AUDIT_LOGS)`

- [ ] **5.5** Log all permission checks in audit trail
  - Update: `backend/src/modules/auth/guards/authorization.guard.ts`
  - Log denied access attempts

### Frontend Tasks

- [ ] **5.6** Add role-based UI rendering
  - File: `src/App.jsx`
  - Show/hide features based on user role
  - Example: Hide "Audit Logs" link if not admin

- [ ] **5.7** Create PermissionGate component
  - File: `src/components/PermissionGate.jsx`
  - Usage: `<PermissionGate permission="manage_users">...</PermissionGate>`

### Testing Tasks

- [ ] **5.8** Test RBAC enforcement
  - File: `backend/test/rbac.e2e-spec.ts`
  - Test each role's access to protected endpoints

---

## 📦 Batch 6: RAG Engine - Vector Database Setup

**Estimated Time**: 5-7 days

### Backend Tasks

- [ ] **6.1** Choose and install vector database
  - **Option A (MVP)**: Pinecone (managed, easy setup)
    - `npm install @pinecone-database/pinecone`
  - **Option B (Production)**: Weaviate (self-hosted, more control)
    - Docker: `docker-compose.yml` add Weaviate service
    - `npm install weaviate-ts-client`

- [ ] **6.2** Create RAG module structure
  ```
  backend/src/modules/rag/
  ├── rag.module.ts
  ├── rag.service.ts
  ├── vector-db/
  │   ├── vector-db.interface.ts
  │   ├── pinecone.service.ts
  │   └── weaviate.service.ts
  ├── embeddings/
  │   └── openai-embeddings.service.ts
  ├── reranking/
  │   └── cohere-rerank.service.ts
  └── dto/
      ├── rag-context.dto.ts
      └── medical-source.dto.ts
  ```

- [ ] **6.3** Implement OpenAI embeddings service
  - File: `backend/src/modules/rag/embeddings/openai-embeddings.service.ts`
  - Method: `embed(text: string): Promise<number[]>`
  - Method: `embedBatch(texts: string[]): Promise<number[][]>`
  - Use: `text-embedding-ada-002` model

- [ ] **6.4** Implement vector database service (Pinecone)
  - File: `backend/src/modules/rag/vector-db/pinecone.service.ts`
  - Methods:
    - `query(vector, topK, filter): Promise<RetrievedChunk[]>`
    - `upsert(chunks): Promise<void>`
    - `delete(ids): Promise<void>`

- [ ] **6.5** Implement RAG service
  - File: `backend/src/modules/rag/rag.service.ts`
  - Method: `retrieve(query, options): Promise<RAGContext>`
  - Method: `ingest(document): Promise<void>`

- [ ] **6.6** Add RAG configuration
  - File: `backend/src/config/rag.config.ts`
  - Environment variables: `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_ENVIRONMENT`

- [ ] **6.7** Register RAG module in app
  - File: `backend/src/app.module.ts`

### Data Ingestion Tasks

- [ ] **6.8** Create medical knowledge ingestion script
  - File: `backend/src/modules/rag/scripts/ingest-knowledge.ts`
  - Sources:
    - ACLS/ATLS protocols (PDF → text)
    - FDA drug information (API)
    - Sample institutional protocols (markdown)

- [ ] **6.9** Chunk documents (512 tokens, 50-token overlap)
  - File: `backend/src/modules/rag/utils/document-chunker.ts`
  - Use: `tiktoken` library for token counting

- [ ] **6.10** Run initial ingestion
  - Command: `npm run rag:ingest`
  - Verify vectors in Pinecone dashboard

### Testing Tasks

- [ ] **6.11** Test vector similarity search
  - File: `backend/src/modules/rag/rag.service.spec.ts`
  - Query: "sepsis protocol" → should retrieve relevant chunks

- [ ] **6.12** Test embedding generation
  - File: `backend/src/modules/rag/embeddings/openai-embeddings.service.spec.ts`

---

## 📦 Batch 7: RAG Integration with Chat

**Estimated Time**: 4-5 days

### Backend Tasks

- [ ] **7.1** Update chat service to use RAG
  - File: `backend/src/modules/chat/chat.service.ts`
  - Before calling OpenAI:
    1. Retrieve relevant context via RAG
    2. Inject context into prompt
    3. Include citations in response

- [ ] **7.2** Create prompt template with RAG context
  - File: `backend/src/modules/ai/prompts/clinical-query.prompt.ts`
  - Template:
    ```
    Based on the following medical guidelines:
    [Retrieved Context]
    
    Answer the user's question:
    [User Query]
    ```

- [ ] **7.3** Add citation tracking
  - Update: `backend/src/modules/chat/entities/message.entity.ts`
  - Add field: `citations: MedicalSource[]` (JSONB)

- [ ] **7.4** Implement confidence scoring
  - File: `backend/src/modules/rag/utils/confidence-scorer.ts`
  - If RAG confidence < 0.5, add disclaimer: "Limited evidence available"

### Frontend Tasks

- [ ] **7.5** Display citations in chat messages
  - File: `src/components/ChatInterface.jsx`
  - Render citation badges below assistant messages
  - Format: "[1] ACLS Protocol 2024"

- [ ] **7.6** Add citation modal/popover
  - File: `src/components/CitationDetail.jsx`
  - Click citation → show full source details

### Testing Tasks

- [ ] **7.7** Test RAG-augmented responses
  - File: `backend/test/rag-chat.e2e-spec.ts`
  - Query: "What's the sepsis protocol?" → verify protocol retrieved and cited

---

## 📦 Batch 8: Emergency Detection System

**Estimated Time**: 4-5 days

### Backend Tasks

- [ ] **8.1** Create emergency detection module
  ```
  backend/src/modules/emergency/
  ├── emergency.module.ts
  ├── emergency-detector.service.ts
  ├── emergency-escalator.service.ts
  ├── patterns/
  │   └── emergency-patterns.config.ts
  └── dto/
      └── emergency-alert.dto.ts
  ```

- [ ] **8.2** Define emergency patterns
  - File: `backend/src/modules/emergency/patterns/emergency-patterns.config.ts`
  - Categories: cardiac, neurological, respiratory, psychiatric, trauma
  - Each with: keywords, severity, protocol, escalationMessage

- [ ] **8.3** Implement EmergencyDetector service
  - File: `backend/src/modules/emergency/emergency-detector.service.ts`
  - Method: `detect(message): Promise<EmergencyAlert | null>`
  - 100% recall for critical keywords (no false negatives)

- [ ] **8.4** Implement EmergencyEscalator service
  - File: `backend/src/modules/emergency/emergency-escalator.service.ts`
  - Method: `escalate(alert, context): Promise<void>`
  - Actions:
    1. Send urgent notification to user
    2. Log emergency in audit trail
    3. Insert crisis resources into chat
    4. (Optional) Notify clinical team

- [ ] **8.5** Add emergency detection to chat flow
  - File: `backend/src/modules/chat/chat.service.ts`
  - Before processing message, check for emergencies
  - If detected, escalate before responding

- [ ] **8.6** Create crisis resources database
  - File: `backend/src/modules/emergency/data/crisis-resources.ts`
  - Resources for each emergency category (hotlines, protocols)

### Frontend Tasks

- [ ] **8.7** Create EmergencyBanner component
  - File: `src/components/EmergencyBanner.jsx`
  - Props: `category`, `message`, `actions`
  - Styled with red/urgent colors
  - Actions: "Call 911", "Page Rapid Response", "False Alarm"

- [ ] **8.8** Update ChatInterface to handle emergency alerts
  - File: `src/components/ChatInterface.jsx`
  - Display EmergencyBanner when emergency detected
  - Auto-insert crisis resources into message stream

- [ ] **8.9** Add emergency banner styling
  - File: `src/index.css`
  - Class: `.emergency-banner` (red background, pulsing animation)

### Testing Tasks

- [ ] **8.10** Test emergency keyword detection (100% recall)
  - File: `backend/src/modules/emergency/emergency-detector.service.spec.ts`
  - Test all critical keywords: "chest pain", "stroke", "suicide", etc.

- [ ] **8.11** Test escalation flow
  - File: `backend/test/emergency-escalation.e2e-spec.ts`

---

## 📦 Batch 9: Multi-Factor Authentication (MFA)

**Estimated Time**: 4-5 days

### Backend Tasks

- [ ] **9.1** Install 2FA libraries
  - `npm install speakeasy qrcode`

- [ ] **9.2** Update User entity for 2FA
  - File: `backend/src/modules/users/entities/user.entity.ts`
  - Add fields: `twoFactorSecret` (encrypted), `twoFactorEnabled` (boolean)

- [ ] **9.3** Implement TwoFactorService
  - File: `backend/src/modules/two-factor/two-factor.service.ts`
  - Methods:
    - `generateSecret(userId): Promise<{ secret, qrCode }>`
    - `verifyToken(userId, token): Promise<boolean>`
    - `enable(userId, token): Promise<void>`
    - `disable(userId, token): Promise<void>`

- [ ] **9.4** Add 2FA endpoints
  - File: `backend/src/modules/two-factor/two-factor.controller.ts`
  - Endpoints:
    - `POST /api/two-factor/setup` → generate QR code
    - `POST /api/two-factor/enable` → verify and enable
    - `POST /api/two-factor/disable` → disable 2FA
    - `POST /api/two-factor/verify` → verify login token

- [ ] **9.5** Update login flow to require 2FA
  - File: `backend/src/modules/auth/auth.service.ts`
  - If user has 2FA enabled:
    1. First check credentials
    2. Return `{ requiresTwoFactor: true }`
    3. User submits 2FA code
    4. Verify and issue JWT

### Frontend Tasks

- [ ] **9.6** Create TwoFactorSetup page
  - File: `src/pages/TwoFactorSetup.jsx`
  - Display QR code for Google Authenticator
  - Input for verification code

- [ ] **9.7** Update login flow for 2FA
  - File: `src/pages/Auth.jsx`
  - If response has `requiresTwoFactor: true`, show 2FA input
  - Submit 2FA code for verification

- [ ] **9.8** Add 2FA settings to profile
  - File: `src/pages/ProfileSettings.jsx`
  - Toggle to enable/disable 2FA
  - Link to setup page

### Testing Tasks

- [ ] **9.9** Test 2FA setup and verification
  - File: `backend/test/two-factor.e2e-spec.ts`
  - Generate secret → verify token → login with 2FA

---

## 📦 Batch 10: Advanced NLU with Fine-Tuned BERT

**Estimated Time**: 7-10 days (includes model training)

### Backend Tasks

- [ ] **10.1** Set up Python service for NLU (separate from Node.js)
  - Directory: `backend/ml-services/nlu/`
  - Files:
    - `requirements.txt` (transformers, torch, fastapi)
    - `app.py` (FastAPI server)
    - `model.py` (DistilBERT/MedBERT)

- [ ] **10.2** Create training dataset for clinical intent classification
  - File: `backend/ml-services/nlu/data/train.jsonl`
  - Format: `{"text": "Check warfarin aspirin interaction", "intent": "drug-interactions"}`
  - Collect 500+ examples per intent class

- [ ] **10.3** Fine-tune DistilBERT on clinical intents
  - File: `backend/ml-services/nlu/train.py`
  - Base model: `distilbert-base-uncased` or `microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext`
  - Training: 3-5 epochs, learning rate 2e-5

- [ ] **10.4** Create FastAPI endpoint for NLU inference
  - File: `backend/ml-services/nlu/app.py`
  - Endpoint: `POST /predict` → returns intent + confidence

- [ ] **10.5** Dockerize NLU service
  - File: `backend/ml-services/nlu/Dockerfile`
  - Add to `docker-compose.yml`

- [ ] **10.6** Integrate NLU service with IntentClassifier
  - File: `backend/src/modules/medical-control-plane/intent-classifier/intent-classifier.service.ts`
  - Phase 2 of classification: call NLU service via HTTP
  - Fallback to GPT-4 if confidence < 0.7

### Testing Tasks

- [ ] **10.7** Test NLU model accuracy
  - File: `backend/ml-services/nlu/evaluate.py`
  - Target: >90% accuracy on test set

- [ ] **10.8** Benchmark NLU latency
  - Target: <50ms per prediction (p95)

---

## 📦 Batch 11: HIPAA Compliance Documentation

**Estimated Time**: 5-7 days

### Documentation Tasks

- [ ] **11.1** Create HIPAA Security Rule compliance matrix
  - File: `docs/compliance/HIPAA_SECURITY_RULE.md`
  - Map each Security Rule requirement to implementation

- [ ] **11.2** Document PHI data flows
  - File: `docs/compliance/PHI_DATA_FLOWS.md`
  - Diagram: User → Frontend → Backend → Database
  - Indicate encryption at each stage

- [ ] **11.3** Write incident response plan
  - File: `docs/compliance/INCIDENT_RESPONSE_PLAN.md`
  - Procedures for data breach, unauthorized access, system compromise

- [ ] **11.4** Create user training materials
  - File: `docs/training/HIPAA_TRAINING.md`
  - For clinical staff using CareDroid

- [ ] **11.5** Document Business Associate Agreements
  - File: `docs/compliance/BAA_LIST.md`
  - List all third-party services (OpenAI, Pinecone, AWS)
  - Status of BAA execution

- [ ] **11.6** Create risk assessment document
  - File: `docs/compliance/RISK_ASSESSMENT.md`
  - Identify risks, mitigation strategies, residual risk

- [ ] **11.7** Write policy documents
  - Files:
    - `docs/compliance/policies/ACCESS_CONTROL_POLICY.md`
    - `docs/compliance/policies/ENCRYPTION_POLICY.md`
    - `docs/compliance/policies/AUDIT_LOGGING_POLICY.md`
    - `docs/compliance/policies/BACKUP_RECOVERY_POLICY.md`

---

## 📦 Batch 12: Penetration Testing & Security Audit

**Estimated Time**: 5-7 days

### Security Tasks

- [ ] **12.1** Run automated security scans
  - Tools:
    - OWASP ZAP (web vulnerabilities)
    - Snyk (dependency vulnerabilities)
    - npm audit (Node.js packages)
    - Trivy (Docker image scanning)

- [ ] **12.2** Fix identified vulnerabilities
  - Prioritize: Critical > High > Medium > Low

- [ ] **12.3** Conduct manual penetration testing
  - Test vectors:
    - SQL injection attempts
    - XSS attacks
    - CSRF attacks
    - Authentication bypass
    - Authorization bypass (RBAC)
    - Session hijacking

- [ ] **12.4** Test audit log tampering resistance
  - Attempt to modify audit logs
  - Verify integrity check fails

- [ ] **12.5** Test encryption implementation
  - Verify TLS 1.3 enforcement
  - Verify database encryption
  - Test key rotation

- [ ] **12.6** Conduct social engineering test (optional)
  - Test staff awareness of phishing attempts

- [ ] **12.7** Document findings and remediation
  - File: `docs/security/PENTEST_REPORT.md`
  - Include: vulnerabilities found, severity, remediation steps

---

## 📦 Batch 13: Production Infrastructure & Monitoring

**Estimated Time**: 5-7 days

### Infrastructure Tasks

- [ ] **13.1** Set up production database (RDS PostgreSQL)
  - Enable encryption at rest
  - Configure automated backups (daily, 30-day retention)
  - Set up read replicas (if needed)

- [ ] **13.2** Set up Redis cluster (ElastiCache)
  - Enable encryption in transit
  - Configure high availability

- [ ] **13.3** Configure load balancer (ALB/NLB)
  - SSL/TLS termination
  - Health checks
  - Auto-scaling rules

- [ ] **13.4** Implement rate limiting at gateway level
  - Use: AWS WAF or CloudFlare
  - Rules: 100 requests/15min per IP

- [ ] **13.5** Set up CDN (CloudFront/CloudFlare)
  - Cache static assets
  - DDoS protection

### Monitoring Tasks

- [ ] **13.6** Set up application monitoring
  - Tool: New Relic, Datadog, or Prometheus + Grafana
  - Metrics: response time, error rate, throughput

- [ ] **13.7** Set up error tracking
  - Tool: Sentry
  - Integrate: `backend/src/main.ts` + `src/main.jsx`

- [ ] **13.8** Set up log aggregation
  - Tool: CloudWatch Logs, ELK stack, or Datadog
  - Centralize logs from all services

- [ ] **13.9** Configure alerting
  - Alerts for:
    - High error rate (>1%)
    - High latency (>2s p95)
    - Database connection pool exhaustion
    - Authentication failures spike
    - Audit log integrity violation

- [ ] **13.10** Create monitoring dashboard
  - Display:
    - Request rate
    - Error rate
    - Latency (p50, p95, p99)
    - Database query time
    - RAG retrieval latency
    - Active users

---

## 📦 Batch 14: Performance Optimization

**Estimated Time**: 4-5 days

### Backend Optimization

- [ ] **14.1** Add Redis caching for frequent queries
  - File: `backend/src/modules/cache/cache.service.ts`
  - Cache:
    - RAG retrieval results (TTL: 1 hour)
    - Clinical tool results (TTL: 1 day)
    - User profiles (TTL: 5 minutes)

- [ ] **14.2** Optimize database queries
  - Add indexes:
    - `conversations.user_id`
    - `messages.conversation_id`
    - `audit_logs.user_id`
    - `audit_logs.timestamp`

- [ ] **14.3** Implement connection pooling
  - File: `backend/src/config/database.config.ts`
  - Configure: max 20 connections, min 5

- [ ] **14.4** Optimize RAG retrieval
  - Reduce `topK` from 20 to 10
  - Cache embeddings for common queries
  - Implement async retrieval

- [ ] **14.5** Add compression middleware
  - File: `backend/src/main.ts`
  - Use: `compression` package for gzip

### Frontend Optimization

- [ ] **14.6** Implement code splitting
  - File: `src/App.jsx`
  - Use: `React.lazy()` for route-level splitting

- [ ] **14.7** Add service worker for offline support
  - File: `public/service-worker.js`
  - Cache critical resources

- [ ] **14.8** Optimize bundle size
  - Run: `npm run build --analyze`
  - Remove unused dependencies

### Testing Tasks

- [ ] **14.9** Load testing
  - Tool: k6, Artillery, or JMeter
  - Test: 1000 concurrent users
  - Target: <2s response time (p95)

- [ ] **14.10** Benchmark RAG retrieval latency
  - Target: <100ms (p95)

---

## 📦 Batch 15: Final Production Release

**Estimated Time**: 3-4 days

### Pre-Release Tasks

- [ ] **15.1** Code review and refactoring
  - Review all critical code paths
  - Ensure consistent error handling
  - Add missing comments/documentation

- [ ] **15.2** Update all dependencies to latest stable versions
  - Run: `npm update`
  - Test for breaking changes

- [ ] **15.3** Run full test suite
  - Frontend: `npm run test`
  - Backend: `cd backend && npm run test && npm run test:e2e`
  - Target: >80% code coverage

- [ ] **15.4** Create production environment variables
  - File: `backend/.env.production`
  - Use secrets manager (AWS Secrets Manager, HashiCorp Vault)

- [ ] **15.5** Build production Docker images
  - Tag: `caredroid-frontend:v1.0.0`
  - Tag: `caredroid-backend:v1.0.0`
  - Push to container registry

### Deployment Tasks

- [ ] **15.6** Deploy to staging environment
  - Run smoke tests
  - Verify all features work

- [ ] **15.7** Conduct user acceptance testing (UAT)
  - Invite pilot users (physicians, nurses)
  - Collect feedback

- [ ] **15.8** Deploy to production
  - Use blue-green deployment strategy
  - Monitor for errors

- [ ] **15.9** Configure DNS and SSL certificates
  - Domain: `app.caredroid.com`
  - SSL: Let's Encrypt or AWS Certificate Manager

### Post-Release Tasks

- [ ] **15.10** Monitor production for 48 hours
  - Watch for errors, performance issues
  - Check audit logs

- [ ] **15.11** Create incident response runbook
  - File: `docs/operations/RUNBOOK.md`
  - Procedures for common issues

- [ ] **15.12** Schedule weekly security updates
  - Automated: Dependabot or Renovate

---

## 📊 Success Metrics Dashboard

Track these KPIs throughout implementation:

### Clinical Accuracy
- [ ] Tool invocation accuracy: **>95%**
- [ ] RAG retrieval precision: **>90%**
- [ ] Emergency detection recall: **100%**

### Performance
- [ ] Intent classification latency: **<200ms (p95)**
- [ ] RAG retrieval latency: **<100ms (p95)**
- [ ] End-to-end response time: **<2s (p95)**

### Security
- [ ] Audit log completeness: **100%**
- [ ] Encryption coverage: **100%**
- [ ] Zero data breaches: **0 incidents**

### User Experience
- [ ] Clinical tool usage rate: **>40%**
- [ ] Emergency false positive rate: **<5%**
- [ ] User satisfaction: **>4.5/5.0**

---

## 🔄 Iteration & Maintenance

### Weekly Tasks
- [ ] Review audit logs for anomalies
- [ ] Update dependencies (security patches)
- [ ] Monitor performance metrics
- [ ] Review user feedback

### Monthly Tasks
- [ ] Audit log integrity verification
- [ ] Security vulnerability scan
- [ ] RAG knowledge base updates
- [ ] User training refresher

### Quarterly Tasks
- [ ] Full security audit
- [ ] HIPAA compliance review
- [ ] Disaster recovery drill
- [ ] User satisfaction survey

---

## 📚 References

- [PROJECT_SPEC.md](PROJECT_SPEC.md) - Complete technical specification
- [MEDICAL_CONTROL_PLANE.md](MEDICAL_CONTROL_PLANE.md) - AI middleware architecture
- [AI_CHAT_UI_SPEC.md](AI_CHAT_UI_SPEC.md) - Design system
- [LAYOUT_SPEC.md](LAYOUT_SPEC.md) - Shell architecture

---

**Document Owner**: CareDroid Engineering Team  
**Next Review**: Weekly during active development

---

## 🎯 Quick Start: Begin Implementation

```bash
# Start with Batch 1: Intent Classification System
git checkout -b feature/intent-classifier
cd backend/src/modules
mkdir -p medical-control-plane/intent-classifier
# Follow tasks 1.1 through 1.10
```

**Estimated Total Timeline**: 15-18 weeks for full implementation
