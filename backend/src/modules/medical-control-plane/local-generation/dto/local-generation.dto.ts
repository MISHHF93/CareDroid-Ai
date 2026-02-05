/**
 * Phase 3: Local Generation DTOs
 * 
 * Defines data structures for the controlled local generation system with safety sandwich.
 * - Pre-check: Validates question suitability for local generation
 * - Generation: Produces draft response with confidence and grounding
 * - Post-check: Verifies response quality and safety
 * - Orchestrator: Coordinates all three components
 */

/**
 * Pre-Check Classification Result
 * Determines if a question is safe to answer using the local generation model
 */
export interface PreCheckResult {
  // Whether the question is safe for local generation
  isSafeForLocalGeneration: boolean;

  // Confidence that this decision is correct (0-1)
  confidence: number;

  // Reason for the decision
  reason: string;

  // Risk factors that guided the decision
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high' | 'critical',
    reason: string;
  }>;

  // Recommended action if not safe
  recommendedAction?: 'escalate' | 'use_rag_only' | 'flag_for_review';

  // Method used for decision: keyword/rule-based or LLM
  method: 'keyword' | 'llm' | 'fallback';

  // Timestamp of prediction
  predictedAt: Date;
}

/**
 * Local Generation Request
 * Input to the local generation service
 */
export interface LocalGenerationRequest {
  // Original user query
  query: string;

  // Intent classification result (from Phase 1)
  intendedIntent: string;

  // Risk context (from Phase 2 neural heads)
  riskLevel?: 'critical' | 'high' | 'medium' | 'low';

  // Citation requirement (from Phase 2)
  requiresCitation?: boolean;

  // Clinical context / patient info (de-identified)
  context?: {
    patientAge?: number;
    patientGender?: 'M' | 'F' | 'Other';
    primaryCondition?: string;
    medications?: string[];
    allergies?: string[];
  };

  // Conversation history (limited context window)
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;

  // RAG-retrieved documents (if grounding is required)
  groundingDocuments?: Array<{
    source: string;
    content: string;
    relevanceScore: number;
  }>;

  // User role for safety adjustments
  userRole?: 'patient' | 'clinician' | 'admin';
}

/**
 * Local Generation Response
 * Output from local generation service
 */
export interface LocalGenerationResponse {
  // Generated response text
  responseText: string;

  // Model's confidence in the response (0-1)
  confidence: number;

  // Whether response includes grounding/citations
  isGrounded: boolean;

  // Sources referenced (if grounded)
  citedSources?: string[];

  // Identified limitations or caveats in response
  identifiedLimitations: string[];

  // Whether specialized clinical tool might be beneficial
  suggestedTool?: {
    toolId: string;
    toolName: string;
    reason: string;
  };

  // Timestamp of generation
  generatedAt: Date;

  // Model version used
  modelVersion: string;

  // Processing tokens for this generation
  processingTime: number;
}

/**
 * Post-Check Verification Result
 * Safety and quality verification of generated response
 */
export interface PostCheckResult {
  // Whether response passes all safety checks
  isVerified: boolean;

  // Overall quality score (0-1)
  qualityScore: number;

  // Safety assessment results
  safety: {
    // Response contains no contradictions to medical guidelines
    noContraindications: boolean;

    // Response doesn't make absolute medical claims without uncertainty language
    appropriateUncertainty: boolean;

    // Response doesn't substitute for emergency action
    properEscalation: boolean;

    // Response doesn't expose PHI
    noPhiExposure: boolean;

    // Issues found in safety checks
    issues: Array<{
      type: 'contraindication' | 'absolute_claim' | 'escalation_miss' | 'phi_exposure' | 'other';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      suggestedFix?: string;
    }>;
  };

  // Quality assessment results
  quality: {
    // Response is coherent and relevant to query
    coherenceScore: number;

    // Response includes proper medical terminology
    terminologyAppropriate: boolean;

    // Response acknowledges limitations
    limitationsAcknowledged: boolean;

    // Issues found in quality checks
    issues: Array<{
      type: 'incoherence' | 'terminology' | 'missing_caveat' | 'length' | 'other';
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };

  // Recommended action
  recommendedAction: 'approve' | 'revise' | 'escalate' | 'flag_for_review';

  // Suggested revisions if applicable
  suggestedRevisions?: Array<{
    original: string;
    revised: string;
    reason: string;
  }>;

  // Timestamp of verification
  verifiedAt: Date;

  // Verification method
  method: 'automated' | 'llm_review' | 'rules_engine';
}

/**
 * Generation Orchestrator Result
 * Complete safety sandwich result
 */
export interface GenerationOrchestrationResult {
  // Original query
  query: string;

  // Pre-check result
  preCheck: PreCheckResult;

  // Whether we proceeded to local generation
  proceededToGeneration: boolean;

  // Local generation result (if applicable)
  generation?: LocalGenerationResponse;

  // Post-check result (if generation was performed)
  postCheck?: PostCheckResult;

  // Final decision on response
  finalDecision: 'serve_local' | 'escalate_to_api' | 'use_fallback' | 'flag_for_human';

  // Final response to user (either local, API, or fallback)
  responseText?: string;

  // Success indicator
  success: boolean;

  // Why the response was selected (if not served locally)
  selectionReason?: string;

  // Duration of entire orchestration
  totalDuration: number;

  // Metadata for logging/audit
  metadata: {
    preCheckDuration: number;
    generationDuration?: number;
    postCheckDuration?: number;
    fallbackUsed: boolean;
    fallbackReason?: string;
  };

  // Timestamp of final decision
  decidedAt: Date;
}

/**
 * Safety Sandwich Configuration
 * Controls behavior of pre-check, generation, post-check, and orchestrator
 */
export interface SafeSandwichConfig {
  // Enable/disable local generation entirely
  enabled: boolean;

  // Shadow mode: generate but always escalate (for evaluation)
  shadowMode: boolean;

  // Pre-check config
  preCheck: {
    enabled: boolean;
    strictMode: boolean; // Conservative threshold
    confidenceThreshold: number;
  };

  // Generation config
  generation: {
    enabled: boolean;
    modelId: string; // e.g., 'phi-2', 'medalpaca', 'llama-2-7b-med'
    maxTokens: number;
    temperature: number;
    topP: number;
    includeRag: boolean;
  };

  // Post-check config
  postCheck: {
    enabled: boolean;
    strictMode: boolean; // Fail on low quality
    qualityThreshold: number;
  };

  // Orchestrator config
  orchestrator: {
    enableFallback: boolean;
    fallbackToApiOnAnyFailure: boolean;
    escalationThreshold: number; // Escalate if risk > threshold
  };
}

/**
 * Distillation Sample for Local Generation Model
 * For fine-tuning with local model outputs + clinician validation
 */
export interface LocalGenerationDistillationSample {
  // Original user query
  query: string;

  // Intent classification
  intent: string;

  // Risk level context
  riskLevel: string;

  // Requires citation
  requiresCitation: boolean;

  // Teacher model output (GPT/Claude or previous generation)
  teacherOutput: {
    responseText: string;
    confidence: number;
  };

  // Student model (local) output
  studentOutput: {
    responseText: string;
    confidence: number;
  };

  // Clinician validation
  clinicianValidation?: {
    approvedResponse?: string;
    preferredModel: 'teacher' | 'student' | 'clinician_revised' | 'neither';
    reasoning: string;
    correctionNeeded: boolean;
    submittedBy: string; // clinician ID
    submittedAt: Date;
  };

  // Final labeled response (for training)
  finalLabel: {
    text: string;
    confidence: number;
    qualityScore: number;
  };

  // Metadata
  datasetSplit: 'train' | 'val' | 'test';
  source: 'distillation' | 'clinician_correction' | 'manual_annotation';
  createdAt: Date;
}

/**
 * Local Generation Evaluation Metrics
 * For assessing model quality and safety
 */
export interface LocalGenerationEvaluationMetrics {
  // Sample count
  totalSamples: number;

  // Response generation success rate
  generationSuccessRate: number;

  // Safety metrics
  safety: {
    // Percentage passing all safety checks
    passRate: number;

    // Contraindication miss rate
    contradictionMissRate: number;

    // PHI exposure rate
    phiExposureRate: number;

    // Escalation appropriateness
    escalationAppropriatenessScore: number;
  };

  // Quality metrics
  quality: {
    // Average coherence score
    averageCoherenceScore: number;

    // Average relevance score
    averageRelevanceScore: number;

    // Average expert rating (1-5)
    averageExpertRating: number;

    // BLEU/ROUGE scores vs clinician-approved responses
    bleuScore: number;
    rougeScore: number;
  };

  // Confidence calibration metrics
  calibration: {
    // Expected Calibration Error
    expectedCalibrationError: number;

    // Brier score
    brierScore: number;

    // Confidence distribution
    confidenceHistogram: Record<string, number>; // bucket -> count
  };

  // Comparison with API fallback
  comparisonWithFallback: {
    // Local model better than API
    localBetterRate: number;

    // Same quality as API
    equivalentRate: number;

    // API better than local
    apiBetterRate: number;

    // Cost savings (local vs API)
    estimatedCostSavings: number;
  };

  // Per-intent metrics
  perIntentMetrics: Record<string, {
    accuracy: number;
    qualityScore: number;
    safetyScore: number;
    confidenceAverage: number;
  }>;

  // Timestamp
  evaluatedAt: Date;

  // Metadata
  modelVersion: string;
  evaluationPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Escalation Event
 * Logged when generation is escalated to API
 */
export interface EscalationEvent {
  // Original query
  query: string;

  // Intent
  intent: string;

  // Pre-check result if available
  preCheckResult?: {
    isSafeForLocalGeneration: boolean;
    reason: string;
  };

  // Generation result if available
  generationResult?: {
    confidence: number;
    generatedAt: Date;
  };

  // Post-check result if available
  postCheckResult?: {
    isVerified: boolean;
    recommendedAction: string;
  };

  // Escalation reason: which component failed
  reason: 'pre_check_failed' | 'generation_failed' | 'post_check_failed' | 'risk_too_high' | 'shadow_mode';

  // Description
  description: string;

  // Was escalation successful
  escalationSuccessful: boolean;

  // API response if escalated
  apiResponseReceived?: boolean;

  // Timestamp
  escalatedAt: Date;

  // Tracing ID for audit
  traceId: string;
}
