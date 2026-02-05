/**
 * Phase 2: Neural Heads DTOs
 * 
 * Task-specific lightweight models distilled from GPT/Claude outputs
 * and clinician-reviewed labels. These heads run in parallel and
 * enhance the primary intent classification.
 */

// ========================================
// EMERGENCY RISK HEAD
// ========================================

/**
 * Emergency Risk Severity Levels
 * Used for fine-grained triage beyond simple binary emergency detection
 */
export enum RiskSeverity {
  LOW = 'low',           // Stable, no immediate concern
  MODERATE = 'moderate', // Concerning but stable, monitor needed
  URGENT = 'urgent',     // Serious, requires relatively prompt action
  CRITICAL = 'critical', // Immediate life threat, escalate immediately
}

export interface EmergencyRiskPrediction {
  // Risk severity level
  severity: RiskSeverity;
  
  // Confidence in the prediction (0-1)
  confidence: number;
  
  // Risk factors detected
  riskFactors: string[];
  
  // Recommended escalation level
  escalationLevel: 'none' | 'flag' | 'alert' | 'critical';
  
  // Human-readable reasoning
  reasoning: string;
  
  // Which modeling method was used
  method: 'keyword' | 'distilled' | 'llm';
  
  // Timestamp
  predictedAt: Date;
}

// ========================================
// TOOL INVOCATION HEAD
// ========================================

export interface ToolInvocationPrediction {
  // Primary tool recommendation
  toolId: string;
  toolName: string;
  
  // Confidence in this tool being appropriate (0-1)
  confidence: number;
  
  // Alternative tools ranked by appropriateness
  alternatives: Array<{
    toolId: string;
    toolName: string;
    confidence: number;
    reason?: string;
  }>;
  
  // Parameters that should be extracted/requested
  requiredParameters: Array<{
    name: string;
    type: 'number' | 'string' | 'date' | 'boolean' | 'array';
    description: string;
    extractedValue?: any;
  }>;
  
  // Whether all required parameters are available
  parametersReady: boolean;
  
  // Which modeling method was used
  method: 'keyword' | 'distilled' | 'llm';
  
  // Timestamp
  predictedAt: Date;
}

// ========================================
// CITATION NEED HEAD
// ========================================

/**
 * Citation requirements indicate when a response needs RAG grounding
 * Critical for ensuring medical claims are backed by evidence
 */
export enum CitationRequirement {
  NOT_REQUIRED = 'not_required',     // General knowledge, no grounding needed
  OPTIONAL = 'optional',             // Nice to have citations
  REQUIRED = 'required',             // Medical claim, must include citations
  MANDATORY_CLINICAL = 'mandatory',  // Drug info, protocol, dosing - always ground
}

export interface CitationNeedPrediction {
  // What level of citation is needed
  requirement: CitationRequirement;
  
  // Confidence in this assessment (0-1)
  confidence: number;
  
  // Types of information that need grounding
  requiresGrounding: Array<{
    type: 'drug_info' | 'dosage' | 'protocol' | 'guideline' | 'diagnosis' | 'treatment' | 'other';
    reason: string;
  }>;
  
  // Suggested RAG query topics
  ragQueryTopics: string[];
  
  // Whether clinical information requires verification
  clinicalVerificationNeeded: boolean;
  
  // Which modeling method was used
  method: 'keyword' | 'distilled' | 'llm';
  
  // Timestamp
  predictedAt: Date;
}

// ========================================
// NEURAL HEADS RESULT (Bundled)
// ========================================

export interface NeuralHeadsResult {
  // Individual head predictions
  emergencyRisk: EmergencyRiskPrediction | null;
  toolInvocation: ToolInvocationPrediction | null;
  citationNeeds: CitationNeedPrediction | null;
  
  // Aggregated risk score (0-1, higher = more risky)
  aggregatedRiskScore: number;
  
  // Recommended actions based on all heads
  recommendedActions: Array<{
    action: 'escalate' | 'ground_response' | 'suggest_tool' | 'flag_for_review';
    priority: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
  }>;
  
  // Overall confidence in the neural heads predictions
  overallConfidence: number;
}

// ========================================
// DISTILLATION DATASET STRUCTURES
// ========================================

/**
 * Teacher-Student Distillation Dataset
 * Used to train student models (distilled heads) from teacher outputs (GPT/Claude)
 */
export interface DistillationSample {
  // Original user message
  message: string;
  
  // Context information
  context?: {
    previousMessages?: string[];
    userRole?: string;
    conversationId?: string;
  };
  
  // Teacher (GPT/Claude) output
  teacherOutput: {
    emergencyRiskPrediction: EmergencyRiskPrediction;
    toolInvocationPrediction: ToolInvocationPrediction;
    citationNeedPrediction: CitationNeedPrediction;
  };
  
  // Human clinician corrections/annotations (ground truth after validation)
  clinicianAnnotations?: {
    emergencyRiskActual?: RiskSeverity;
    toolIdActual?: string;
    citationRequirementActual?: CitationRequirement;
    comments?: string;
  };
  
  // Disagreement flags for active learning
  teacherDisagreement?: {
    emergencyRisk: boolean;
    toolInvocation: boolean;
    citationNeeds: boolean;
  };
  
  // Timestamp collected
  collectedAt: Date;
}

/**
 * Evaluation Metrics for Neural Heads
 * Used to track model quality and calibration
 */
export interface NeuralHeadEvaluationMetrics {
  headName: 'emergencyRisk' | 'toolInvocation' | 'citationNeeds';
  
  // Classification metrics
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  
  // Confidence calibration metrics
  ece: number;              // Expected Calibration Error (lower is better)
  mce: number;              // Maximum Calibration Error
  brier: number;            // Brier score
  
  // Per-class metrics
  perClassMetrics: Array<{
    className: string;
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
  }>;
  
  // AUC-ROC for binary classification heads
  aucRoc?: number;
  
  // Confusion matrix
  confusionMatrix: number[][];
  
  // Timestamp of evaluation
  evaluatedAt: Date;
  
  // Model version evaluated
  modelVersion: string;
}
