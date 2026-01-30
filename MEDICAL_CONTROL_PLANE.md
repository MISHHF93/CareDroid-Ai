# Medical Control Plane Architecture

> **The Clinical Brain of CareDroid**  
> Last Updated: January 30, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Intent Classification Pipeline](#intent-classification-pipeline)
4. [RAG Engine Architecture](#rag-engine-architecture)
5. [Clinical Tool Orchestration](#clinical-tool-orchestration)
6. [Emergency Detection & Escalation](#emergency-detection--escalation)
7. [Security & HIPAA Compliance](#security--hipaa-compliance)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

### Purpose
The **Medical Control Plane** is a sophisticated middleware layer that transforms CareDroid from a simple chatbot into an intelligent clinical co-pilot. It sits between user input and the AI model, performing real-time intent classification, knowledge retrieval, and clinical tool orchestration—all while maintaining a seamless conversational experience.

### Design Philosophy: "Security-First, HIPAA-By-Design"
Every component of the Medical Control Plane is architected with security and compliance as foundational requirements, not afterthoughts. This ensures:
- **Zero Trust Architecture**: Every request is authenticated, authorized, and logged
- **Data Minimization**: Only essential PHI is collected and processed
- **Encryption Everywhere**: TLS 1.3 in transit, AES-256 at rest
- **Immutable Audit Trails**: Every action is logged with cryptographic integrity
- **Fail-Safe Defaults**: System defaults to most restrictive permissions

### Key Capabilities
1. **Natural Language Intent Detection**: Understands when users need clinical tools without explicit commands
2. **Contextual Tool Invocation**: Executes calculators, protocols, and searches within conversation flow
3. **Evidence-Based Grounding**: Uses RAG to retrieve medical literature and institutional guidelines
4. **Real-Time Emergency Detection**: Identifies critical conditions and escalates appropriately
5. **Modular Service Architecture**: Independent clinical tool microservices for reliability and scalability

---

## Core Components

### 1. Intent Classifier (NLU Engine)

#### Purpose
Analyzes incoming user messages in real-time to determine:
- Is this a general clinical question?
- Does it require a specific clinical tool?
- Is it an emergency or critical situation?
- What parameters are present (e.g., lab values, symptoms)?

#### Implementation Strategy
```typescript
interface IntentClassification {
  primaryIntent: 'general_query' | 'clinical_tool' | 'emergency' | 'administrative';
  toolId?: string; // 'drug-interactions', 'sofa-calculator', etc.
  confidence: number; // 0-1
  extractedParameters: Record<string, any>;
  emergencyKeywords: string[];
}

class IntentClassifier {
  async classify(message: string, conversationContext: Message[]): Promise<IntentClassification> {
    // Phase 1: Keyword pattern matching (fast fallback)
    const keywordResult = this.keywordMatcher(message);
    
    // Phase 2: Lightweight NLU model (fine-tuned BERT/DistilBERT)
    const nluResult = await this.nluModel.predict(message);
    
    // Phase 3: LLM-based classification (GPT-4 for ambiguous cases)
    if (nluResult.confidence < 0.7) {
      return await this.llmClassifier(message, conversationContext);
    }
    
    return this.mergeResults(keywordResult, nluResult);
  }
  
  private keywordMatcher(message: string): Partial<IntentClassification> {
    const lowerMsg = message.toLowerCase();
    
    // Emergency detection
    const emergencyPatterns = [
      /chest pain|cardiac arrest|stroke|seizure/i,
      /severe bleeding|hemorrhage/i,
      /suicide|self-harm|suicidal/i,
      /not breathing|respiratory failure/i
    ];
    
    for (const pattern of emergencyPatterns) {
      if (pattern.test(message)) {
        return {
          primaryIntent: 'emergency',
          emergencyKeywords: message.match(pattern) || []
        };
      }
    }
    
    // Clinical tool detection
    if (/sofa|sequential organ failure/i.test(lowerMsg)) {
      return { primaryIntent: 'clinical_tool', toolId: 'sofa-calculator' };
    }
    if (/interaction.*between|drug.*interact/i.test(lowerMsg)) {
      return { primaryIntent: 'clinical_tool', toolId: 'drug-interactions' };
    }
    if (/interpret (lab|labs)|lab results/i.test(lowerMsg)) {
      return { primaryIntent: 'clinical_tool', toolId: 'lab-interpreter' };
    }
    
    return { primaryIntent: 'general_query' };
  }
}
```

#### Technology Stack (Proposed)
- **Phase 1**: Regex + keyword matching (sub-millisecond latency)
- **Phase 2**: Fine-tuned [DistilBERT](https://huggingface.co/distilbert-base-uncased) or [MedBERT](https://github.com/microsoft/BiomedNLP-PubMedBERT) for medical domain
- **Phase 3**: GPT-4 with function calling for complex disambiguation
- **Entity Extraction**: spaCy with custom medical entity recognizer

---

### 2. RAG Engine (Retrieval-Augmented Generation)

#### Purpose
Grounds AI responses in authoritative medical literature, institutional protocols, and current evidence-based guidelines. Prevents hallucination and ensures clinical accuracy.

#### Architecture
```
┌──────────────────────────────────────────────────┐
│         User Query: "Sepsis protocol?"          │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│     Query Embedding (text-embedding-ada-002)    │
│     Vector: [0.023, -0.145, 0.891, ...]         │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│      Vector Database (Pinecone/Weaviate)        │
│   ┌──────────────────────────────────────────┐ │
│   │  Medical Knowledge Corpus:                │ │
│   │  • UpToDate guidelines (licensed)         │ │
│   │  • ACLS/ATLS protocols                    │ │
│   │  • FDA drug information                   │ │
│   │  • Institutional protocols (hospital)     │ │
│   │  • PubMed abstracts (open access)         │ │
│   └──────────────────────────────────────────┘ │
│                                                  │
│   Semantic Search → Top 5 relevant chunks       │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│   Reranking (Cohere Rerank or cross-encoder)    │
│   Filters to Top 3 most relevant passages       │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│        Context Injection into GPT-4              │
│   Prompt:                                        │
│   "Based on the following medical guidelines:   │
│   [Retrieved Protocol Text]                     │
│   Answer: [User Query]"                         │
└──────────────────────────────────────────────────┘
```

#### Implementation
```typescript
interface RAGContext {
  chunks: RetrievedChunk[];
  sources: MedicalSource[];
  confidenceScore: number;
}

interface RetrievedChunk {
  content: string;
  source: MedicalSource;
  relevanceScore: number;
  embeddings?: number[];
}

interface MedicalSource {
  type: 'guideline' | 'protocol' | 'drug_info' | 'literature' | 'institutional';
  title: string;
  publisher: string;
  lastUpdated: Date;
  url?: string;
  citationFormat: string;
}

class RAGEngine {
  constructor(
    private vectorDB: VectorDatabase, // Pinecone/Weaviate/Qdrant
    private embeddingModel: EmbeddingService, // OpenAI text-embedding-ada-002
    private reranker: RerankingService // Cohere or custom
  ) {}
  
  async retrieve(query: string, options?: RAGOptions): Promise<RAGContext> {
    // 1. Generate query embedding
    const queryVector = await this.embeddingModel.embed(query);
    
    // 2. Vector similarity search
    const candidates = await this.vectorDB.query({
      vector: queryVector,
      topK: 20,
      filter: options?.sourceTypes || ['guideline', 'protocol'],
      namespace: options?.institution || 'general'
    });
    
    // 3. Rerank for precision
    const reranked = await this.reranker.rerank(query, candidates);
    
    // 4. Filter by confidence threshold
    const relevant = reranked.filter(c => c.relevanceScore > 0.7);
    
    return {
      chunks: relevant.slice(0, 5),
      sources: this.extractSources(relevant),
      confidenceScore: this.calculateConfidence(relevant)
    };
  }
  
  async ingest(document: MedicalDocument): Promise<void> {
    // Chunking strategy: 512 tokens with 50-token overlap
    const chunks = this.chunkDocument(document, { size: 512, overlap: 50 });
    
    // Generate embeddings for each chunk
    const embeddings = await this.embeddingModel.embedBatch(
      chunks.map(c => c.content)
    );
    
    // Upsert to vector DB with metadata
    await this.vectorDB.upsert(
      chunks.map((chunk, i) => ({
        id: `${document.id}-chunk-${i}`,
        vector: embeddings[i],
        metadata: {
          source: document.source,
          chunkIndex: i,
          document: document.title,
          lastVerified: document.lastUpdated
        }
      }))
    );
  }
}
```

#### Vector Database Options
| Provider | Pros | Cons | Best For |
|----------|------|------|----------|
| **Pinecone** | Managed, fast, easy setup | Cost at scale | MVP/prototyping |
| **Weaviate** | Open-source, GraphQL API, hybrid search | Complex config | Self-hosted |
| **Qdrant** | High performance, Rust-based | Smaller ecosystem | High-throughput |
| **pgvector** | PostgreSQL extension, no separate DB | Limited scale | Single DB stack |

**Recommendation**: Start with Pinecone for MVP, migrate to Weaviate for production self-hosted control.

---

### 3. Clinical Tool Orchestrator

#### Purpose
Dynamically routes requests to specialized clinical tool microservices, executes computations, and formats results for in-chat presentation—all without leaving the conversational flow.

#### Service Architecture (Modular Design)
```
┌────────────────────────────────────────────────────────┐
│            Medical Control Plane (Core)                │
└────────────────┬───────────────────────────────────────┘
                 │
        Tool Request Routing
                 │
    ┌────────────┼────────────┬────────────┐
    │            │            │            │
    ▼            ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│ SOFA   │  │ Drug   │  │ Lab    │  │Protocol│
│Calculator│  │Checker│  │Interpr.│  │ Finder │
│Service │  │Service│  │Service │  │Service │
└────────┘  └────────┘  └────────┘  └────────┘
   (API)       (API)       (API)       (API)
```

#### Tool Service Interface
```typescript
interface ClinicalToolService {
  id: string;
  name: string;
  version: string;
  
  execute(params: ToolParameters): Promise<ToolResult>;
  validate(params: ToolParameters): ValidationResult;
  getSchema(): JSONSchema;
}

interface ToolParameters {
  [key: string]: string | number | boolean;
}

interface ToolResult {
  success: boolean;
  data: any;
  interpretation?: string;
  warnings?: string[];
  citations?: MedicalSource[];
  disclaimer: string;
}

// Example: SOFA Calculator Service
class SOFACalculatorService implements ClinicalToolService {
  id = 'sofa-calculator';
  name = 'SOFA Score Calculator';
  version = '2.1.0';
  
  async execute(params: SOFAParameters): Promise<ToolResult> {
    const validation = this.validate(params);
    if (!validation.valid) {
      return { success: false, data: null, warnings: validation.errors };
    }
    
    const scores = {
      respiration: this.calculateRespirationScore(params.pao2_fio2),
      coagulation: this.calculateCoagulationScore(params.platelets),
      liver: this.calculateLiverScore(params.bilirubin),
      cardiovascular: this.calculateCardiovascularScore(params.map, params.vasopressors),
      cns: this.calculateCNSScore(params.gcs),
      renal: this.calculateRenalScore(params.creatinine, params.urine_output)
    };
    
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    
    return {
      success: true,
      data: {
        totalScore,
        breakdown: scores,
        mortality: this.predictMortality(totalScore),
        interpretation: this.interpretScore(totalScore)
      },
      interpretation: `SOFA Score: ${totalScore}/24. ${this.interpretScore(totalScore)}`,
      citations: [
        {
          type: 'literature',
          title: 'The SOFA Score: Development and validation',
          publisher: 'Intensive Care Medicine',
          lastUpdated: new Date('1996-07-01'),
          citationFormat: 'Vincent JL, et al. Intensive Care Med. 1996;22(7):707-10.'
        }
      ],
      disclaimer: 'For clinical decision support only. Not a substitute for clinical judgment.'
    };
  }
  
  validate(params: SOFAParameters): ValidationResult {
    const errors: string[] = [];
    
    if (params.pao2_fio2 < 0 || params.pao2_fio2 > 600) {
      errors.push('PaO2/FiO2 must be between 0 and 600');
    }
    if (params.platelets < 0 || params.platelets > 1000) {
      errors.push('Platelet count must be between 0 and 1000');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

#### Orchestration Flow
```typescript
class ClinicalToolOrchestrator {
  private services: Map<string, ClinicalToolService> = new Map();
  
  async executeInChat(
    toolId: string,
    params: ToolParameters,
    context: ConversationContext
  ): Promise<ChatResponse> {
    const service = this.services.get(toolId);
    if (!service) {
      return this.createErrorResponse(`Tool ${toolId} not found`);
    }
    
    // Execute tool
    const result = await service.execute(params);
    
    // Format for chat presentation
    const formattedResponse = this.formatForChat(result, service);
    
    // Log tool usage (HIPAA audit trail)
    await this.auditLog.logToolExecution({
      userId: context.user.id,
      toolId: service.id,
      params: this.sanitizeParams(params),
      timestamp: new Date(),
      result: result.success ? 'success' : 'failure'
    });
    
    return formattedResponse;
  }
  
  private formatForChat(result: ToolResult, service: ClinicalToolService): ChatResponse {
    if (!result.success) {
      return {
        role: 'assistant',
        content: `I encountered an issue with the ${service.name}:\n${result.warnings.join('\n')}`,
        type: 'error'
      };
    }
    
    // Create rich, structured response
    return {
      role: 'assistant',
      content: this.generateNarrativeExplanation(result),
      toolCard: {
        title: service.name,
        data: result.data,
        interpretation: result.interpretation,
        citations: result.citations,
        disclaimer: result.disclaimer
      },
      type: 'tool_result'
    };
  }
}
```

---

### 4. Emergency Detection & Escalation

#### Purpose
Identifies life-threatening conditions or mental health crises in real-time and triggers appropriate escalation protocols—potentially saving lives.

#### Critical Keyword Database
```typescript
const EMERGENCY_PATTERNS = {
  cardiac: {
    keywords: ['chest pain', 'heart attack', 'cardiac arrest', 'mi', 'stemi'],
    severity: 'critical',
    protocol: 'activate_code_blue',
    escalationMessage: '🚨 CARDIAC EMERGENCY DETECTED. Activating Code Blue protocol.'
  },
  neurological: {
    keywords: ['stroke', 'cva', 'seizure', 'altered mental status', 'unresponsive'],
    severity: 'critical',
    protocol: 'activate_stroke_alert',
    escalationMessage: '🚨 NEUROLOGICAL EMERGENCY DETECTED. Activating Stroke Alert.'
  },
  respiratory: {
    keywords: ['not breathing', 'respiratory arrest', 'severe shortness of breath', 'can\'t breathe'],
    severity: 'critical',
    protocol: 'activate_respiratory_team',
    escalationMessage: '🚨 RESPIRATORY EMERGENCY DETECTED. Activating Respiratory Team.'
  },
  psychiatric: {
    keywords: ['suicide', 'suicidal', 'kill myself', 'end my life', 'self-harm'],
    severity: 'urgent',
    protocol: 'psychiatric_consult',
    escalationMessage: '⚠️ MENTAL HEALTH CRISIS DETECTED. Connecting to crisis support.'
  },
  trauma: {
    keywords: ['severe bleeding', 'hemorrhage', 'traumatic injury', 'gunshot', 'stabbing'],
    severity: 'critical',
    protocol: 'activate_trauma_team',
    escalationMessage: '🚨 TRAUMA ALERT DETECTED. Activating Trauma Team.'
  }
};

class EmergencyDetector {
  async detect(message: string): Promise<EmergencyAlert | null> {
    const lowerMsg = message.toLowerCase();
    
    for (const [category, config] of Object.entries(EMERGENCY_PATTERNS)) {
      for (const keyword of config.keywords) {
        if (lowerMsg.includes(keyword)) {
          return {
            category,
            severity: config.severity,
            protocol: config.protocol,
            detectedKeyword: keyword,
            escalationMessage: config.escalationMessage,
            timestamp: new Date()
          };
        }
      }
    }
    
    return null;
  }
  
  async escalate(alert: EmergencyAlert, context: ConversationContext): Promise<void> {
    // 1. Immediately display emergency banner in UI
    await this.notificationService.sendUrgent({
      userId: context.user.id,
      message: alert.escalationMessage,
      type: 'emergency',
      actions: [
        { label: 'Call 911', action: 'dial_emergency' },
        { label: 'Page Rapid Response', action: 'page_rrt' },
        { label: 'False Alarm', action: 'dismiss' }
      ]
    });
    
    // 2. Log emergency detection (HIPAA audit trail)
    await this.auditLog.logEmergency({
      category: alert.category,
      severity: alert.severity,
      userId: context.user.id,
      conversationId: context.conversationId,
      detectedKeyword: alert.detectedKeyword,
      timestamp: alert.timestamp
    });
    
    // 3. Optional: Auto-escalate to human clinical team
    if (alert.severity === 'critical') {
      await this.escalationService.notifyTeam({
        protocol: alert.protocol,
        location: context.user.currentLocation,
        urgency: 'immediate'
      });
    }
    
    // 4. Insert crisis resources into chat
    const crisisResources = this.getCrisisResources(alert.category);
    await this.chatService.insertMessage({
      conversationId: context.conversationId,
      role: 'system',
      content: crisisResources,
      priority: 'urgent'
    });
  }
  
  private getCrisisResources(category: string): string {
    const resources = {
      psychiatric: `
🆘 **Immediate Crisis Support:**
• **National Suicide Prevention Lifeline**: 988
• **Crisis Text Line**: Text HOME to 741741
• **Veterans Crisis Line**: 1-800-273-8255 (Press 1)
      
If this is a medical emergency, call 911 immediately.
      `,
      cardiac: `
🚨 **CARDIAC EMERGENCY PROTOCOL:**
1. Call 911 immediately
2. Administer aspirin 325mg if available
3. Monitor vitals continuously
4. Prepare for CPR/AED if needed
      `,
      // ... other categories
    };
    
    return resources[category] || 'Call 911 for immediate assistance.';
  }
}
```

---

## Security & HIPAA Compliance

### Principle: "Security-First, HIPAA-By-Design"

Every component of the Medical Control Plane is built with security as a core requirement from day one, not retrofitted later.

### 1. Encryption Everywhere

#### Data in Transit (TLS 1.3)
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    ssl_protocols TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384';
    ssl_prefer_server_ciphers off;
    
    # HSTS (force HTTPS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
    
    # Certificate pinning
    add_header Public-Key-Pins 'pin-sha256="base64=="; max-age=5184000; includeSubDomains';
}
```

#### Data at Rest (AES-256)
```typescript
// Transparent database encryption
// PostgreSQL: pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive columns
CREATE TABLE patient_data (
  id UUID PRIMARY KEY,
  phi_encrypted BYTEA,  -- Encrypted with AES-256
  encryption_key_id VARCHAR(64),  -- Key rotation support
  created_at TIMESTAMP DEFAULT NOW()
);

-- Encrypt on insert
INSERT INTO patient_data (phi_encrypted, encryption_key_id)
VALUES (
  pgp_sym_encrypt('sensitive data', current_setting('app.encryption_key')),
  'key-version-2024-01'
);

-- Decrypt on read (only for authorized users)
SELECT pgp_sym_decrypt(phi_encrypted, current_setting('app.encryption_key'))
FROM patient_data WHERE id = $1;
```

### 2. Role-Based Access Control (RBAC)

```typescript
enum Permission {
  // Clinical Data
  READ_PHI = 'read:phi',
  WRITE_PHI = 'write:phi',
  EXPORT_PHI = 'export:phi',
  
  // Clinical Tools
  USE_CALCULATORS = 'use:calculators',
  USE_DRUG_CHECKER = 'use:drug_checker',
  
  // System Admin
  MANAGE_USERS = 'manage:users',
  VIEW_AUDIT_LOGS = 'view:audit_logs',
  CONFIGURE_SYSTEM = 'configure:system'
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: Object.values(Permission), // Full access
  CLINICIAN: [
    Permission.READ_PHI,
    Permission.WRITE_PHI,
    Permission.USE_CALCULATORS,
    Permission.USE_DRUG_CHECKER
  ],
  VIEWER: [
    Permission.READ_PHI,  // Read-only
    Permission.USE_CALCULATORS
  ],
  STUDENT: [
    Permission.USE_CALCULATORS,  // No PHI access
    Permission.USE_DRUG_CHECKER
  ]
};

class AuthorizationGuard {
  async checkPermission(userId: string, permission: Permission): Promise<boolean> {
    const user = await this.userService.findById(userId);
    const userPermissions = ROLE_PERMISSIONS[user.role];
    
    // Log access attempt (HIPAA audit)
    await this.auditLog.logAccessAttempt({
      userId,
      permission,
      granted: userPermissions.includes(permission),
      timestamp: new Date()
    });
    
    return userPermissions.includes(permission);
  }
}
```

### 3. Immutable Audit Logging

```typescript
@Entity()
class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  userId: string;
  
  @Column()
  action: AuditAction;  // 'login', 'view_conversation', 'execute_tool', 'export_data'
  
  @Column({ nullable: true })
  resourceType: string;  // 'conversation', 'tool', 'phi_record'
  
  @Column({ nullable: true })
  resourceId: string;
  
  @Column('jsonb')
  metadata: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    toolId?: string;
    result?: 'success' | 'failure';
    errorMessage?: string;
  };
  
  @Column()
  timestamp: Date;
  
  // Cryptographic integrity (prevent tampering)
  @Column()
  hash: string;  // SHA-256 hash of (userId + action + timestamp + previousHash)
  
  @Column({ nullable: true })
  previousHash: string;  // Blockchain-style chaining for immutability
}

class AuditService {
  async log(entry: Partial<AuditLog>): Promise<void> {
    // Get previous log entry for hash chaining
    const previousEntry = await this.auditRepository.findOne({
      order: { timestamp: 'DESC' }
    });
    
    // Calculate hash
    const dataToHash = JSON.stringify({
      userId: entry.userId,
      action: entry.action,
      timestamp: entry.timestamp,
      previousHash: previousEntry?.hash || 'genesis'
    });
    const hash = createHash('sha256').update(dataToHash).digest('hex');
    
    // Insert audit log (append-only, no updates/deletes allowed)
    await this.auditRepository.insert({
      ...entry,
      hash,
      previousHash: previousEntry?.hash || null
    });
  }
  
  async verifyIntegrity(): Promise<boolean> {
    // Verify entire audit chain is intact
    const logs = await this.auditRepository.find({ order: { timestamp: 'ASC' } });
    
    for (let i = 1; i < logs.length; i++) {
      const current = logs[i];
      const previous = logs[i - 1];
      
      // Verify hash chain
      if (current.previousHash !== previous.hash) {
        logger.error('Audit log tampering detected!', { logId: current.id });
        return false;
      }
    }
    
    return true;
  }
}
```

### 4. Data Minimization

```typescript
// Only collect PHI when absolutely necessary
interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;  // ⚠️ May contain PHI - redact on export
  timestamp: Date;
  metadata: {
    model?: string;
    tokens?: number;
    toolId?: string;
    // ❌ NO patient names, MRNs, or identifiable data stored here
  };
}

// Pseudonymization for analytics
class AnalyticsService {
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // Hash user ID for privacy
    const anonymousId = createHash('sha256')
      .update(event.userId + process.env.ANALYTICS_SALT)
      .digest('hex');
    
    await this.analyticsDB.insert({
      eventName: event.name,
      anonymousUserId: anonymousId,  // Not reversible
      timestamp: event.timestamp,
      properties: this.sanitizeProperties(event.properties) // Remove PHI
    });
  }
  
  private sanitizeProperties(props: any): any {
    // Remove any potential PHI
    const { patientName, mrn, dob, ssn, ...safe } = props;
    return safe;
  }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up Intent Classifier with keyword matching (fast MVP)
- [ ] Implement basic Clinical Tool Orchestrator
- [ ] Deploy 3 core tools as microservices (SOFA, Drug Interactions, Lab Interpreter)
- [ ] Add emergency keyword detection with UI alerts
- [ ] Implement immutable audit logging

### Phase 2: RAG Engine (Weeks 5-8)
- [ ] Set up vector database (Pinecone for MVP)
- [ ] Ingest medical knowledge corpus:
  - [ ] ACLS/ATLS protocols (open access)
  - [ ] FDA drug information (public API)
  - [ ] Sample institutional protocols
- [ ] Implement semantic search pipeline
- [ ] Integrate RAG context into GPT-4 prompts

### Phase 3: Advanced NLU (Weeks 9-12)
- [ ] Fine-tune DistilBERT/MedBERT on clinical intent classification
- [ ] Implement parameter extraction (entity recognition)
- [ ] Add confidence scoring and fallback logic
- [ ] Optimize latency (target <200ms for intent classification)

### Phase 4: Production Hardening (Weeks 13-16)
- [ ] Implement automated emergency escalation protocols
- [ ] Add multi-factor authentication (MFA) for all roles
- [ ] Set up automated security scanning (OWASP ZAP, Snyk)
- [ ] Complete HIPAA compliance documentation
- [ ] Conduct penetration testing and security audit
- [ ] Deploy to production with monitoring (Datadog/New Relic)

### Phase 5: Scale & Optimization (Weeks 17-20)
- [ ] Migrate to self-hosted vector DB (Weaviate)
- [ ] Add more clinical tool microservices (10+ total)
- [ ] Implement caching for frequently used protocols
- [ ] Optimize RAG retrieval latency (<100ms)
- [ ] Add institutional knowledge base multi-tenancy

---

## Success Metrics

### Clinical Accuracy
- **Tool Invocation Accuracy**: >95% correct tool routing
- **RAG Retrieval Precision**: >90% relevant results in top 3
- **Emergency Detection Recall**: 100% (zero missed critical conditions)

### Performance
- **Intent Classification Latency**: <200ms (p95)
- **RAG Retrieval Latency**: <100ms (p95)
- **End-to-End Response Time**: <2s (p95)

### Security & Compliance
- **Audit Log Completeness**: 100% of PHI access logged
- **Encryption Coverage**: 100% of data (in transit + at rest)
- **Zero Data Breaches**: Target 0 incidents/year

### User Experience
- **Clinical Tool Usage Rate**: >40% of conversations
- **Emergency Alert False Positive Rate**: <5%
- **User Satisfaction Score**: >4.5/5.0

---

## References

1. **HIPAA Compliance Guide**: [HHS.gov](https://www.hhs.gov/hipaa/for-professionals/security/guidance/index.html)
2. **RAG Best Practices**: [LangChain Documentation](https://python.langchain.com/docs/use_cases/question_answering/)
3. **Medical NLP Models**: [HuggingFace Med-BERT](https://huggingface.co/microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext)
4. **Vector Database Comparison**: [Vector Database Benchmark](https://github.com/zilliztech/VectorDBBench)
5. **OpenAI Function Calling**: [OpenAI API Reference](https://platform.openai.com/docs/guides/function-calling)

---

**Document Owner**: CareDroid Engineering Team  
**Next Review**: February 28, 2026
