/**
 * Intent Classification DTOs
 * 
 * Data transfer objects for the intent classification system.
 * Defines the structure of intent classification results.
 */

export enum PrimaryIntent {
  // Phase 1: Core intents (high criticality)
  EMERGENCY = 'emergency',           // Life-threatening situations
  EMERGENCY_RISK = 'emergency_risk', // Potential emergency (severity triage)
  MEDICATION_SAFETY = 'medication_safety', // Drug interactions, contraindications
  PROTOCOL_LOOKUP = 'protocol_lookup',     // Clinical protocol queries
  
  // Phase 1: Tool & documentation intents
  TOOL_SELECTION = 'tool_selection', // Clinical tool invocation (SOFA, APACHE, etc.)
  DOCUMENTATION = 'documentation',   // Medical record, documentation queries
  
  // Phase 1: General intent
  GENERAL_CHAT = 'general_chat',     // General conversation, educational queries
  
  // Fallback for backward compatibility
  CLINICAL_TOOL = 'clinical_tool',
  ADMINISTRATIVE = 'administrative',
  MEDICAL_REFERENCE = 'medical_reference',
  GENERAL_QUERY = 'general_query',
}

export enum EmergencySeverity {
  CRITICAL = 'critical',   // Immediate life threat (e.g., cardiac arrest, stroke)
  URGENT = 'urgent',       // Serious but not immediate (e.g., chest pain, severe bleeding)
  MODERATE = 'moderate',   // Concerning but stable (e.g., persistent pain, abnormal labs)
}

/**
 * Phase 1: Intent Criticality Levels
 * Used for calibrated confidence thresholds
 */
export enum IntentCriticality {
  CRITICAL = 'critical',   // Emergency, medication safety: high confidence bar (0.85+)
  HIGH = 'high',           // Tool selection, protocol lookup: moderate-high bar (0.75+)
  MEDIUM = 'medium',       // Documentation, medical reference: moderate bar (0.70+)
  LOW = 'low',             // General chat: lower bar (0.60+)
}

export interface EmergencyKeyword {
  keyword: string;
  category: string;
  severity: EmergencySeverity;
}

export interface ExtractedParameter {
  name: string;
  value: any;
  confidence: number;
}

export interface IntentClassification {
  // Primary intent classification
  primaryIntent: PrimaryIntent;
  
  // Tool identification (if clinical_tool/tool_selection intent)
  toolId?: string;
  
  // Confidence score (0-1)
  confidence: number;
  
  // Phase 1: Confidence threshold used for this intent
  confidenceThreshold: number;
  
  // Classification method used
  method: 'keyword' | 'nlu' | 'llm' | 'abstain';
  
  // Phase 1: Intent criticality level (for risk-aware thresholds)
  criticality: IntentCriticality;
  
  // Phase 1: Abstain flag - when confidence < threshold, defer to LLM + human-safe prompts
  shouldAbstain: boolean;
  
  // Extracted parameters from the message
  extractedParameters: Record<string, any>;
  
  // Emergency detection
  isEmergency: boolean;
  emergencyKeywords: EmergencyKeyword[];
  emergencySeverity?: EmergencySeverity;
  
  // Supporting information
  matchedPatterns: string[];
  alternativeIntents?: Array<{
    intent: PrimaryIntent;
    toolId?: string;
    confidence: number;
  }>;
  
  // Phase 2: Neural Heads Results (optional - populated if heads are enabled)
  neuralHeads?: {
    emergencyRiskScore?: number;  // Fine-grained risk severity from Emergency Risk Head
    toolSuggestions?: Array<{     // Tool recommendations from Tool Invocation Head
      toolId: string;
      toolName: string;
      confidence: number;
    }>;
    citationRequirement?: string; // 'not_required' | 'optional' | 'required' | 'mandatory'
    recommendedActions?: Array<{  // Aggregated actions from all heads
      action: string;
      priority: string;
      reason: string;
    }>;
  };
  
  // Timestamp
  classifiedAt: Date;
}

export interface IntentClassificationContext {
  userId: string;
  conversationId?: number;
  previousMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  userRole?: string;
  sessionContext?: Record<string, any>;
}

export class ClassifyIntentDto {
  message: string;
  context?: IntentClassificationContext;
}

export class IntentClassificationResultDto {
  classification: IntentClassification;
  requiresEscalation: boolean;
  suggestedAction?: string;
  warningMessage?: string;
}

/**
 * Phase 1: Helper functions for intent criticality and thresholds
 */

/**
 * Map PrimaryIntent to criticality level
 * CRITICAL intents require high confidence (0.85+)
 * HIGH require 0.75+, MEDIUM require 0.70+, LOW require 0.60+
 */
export function getIntentCriticality(intent: PrimaryIntent): IntentCriticality {
  const criticalIntents = [PrimaryIntent.EMERGENCY, PrimaryIntent.EMERGENCY_RISK, PrimaryIntent.MEDICATION_SAFETY];
  const highIntents = [PrimaryIntent.TOOL_SELECTION, PrimaryIntent.PROTOCOL_LOOKUP];
  const mediumIntents = [PrimaryIntent.DOCUMENTATION, PrimaryIntent.MEDICAL_REFERENCE];
  
  if (criticalIntents.includes(intent)) return IntentCriticality.CRITICAL;
  if (highIntents.includes(intent)) return IntentCriticality.HIGH;
  if (mediumIntents.includes(intent)) return IntentCriticality.MEDIUM;
  return IntentCriticality.LOW;
}

/**
 * Get confidence threshold for a given intent criticality
 * Higher criticality = higher threshold
 */
export function getConfidenceThreshold(criticality: IntentCriticality, userRole?: string): number {
  // Admin/clinician users may have slightly lower thresholds
  const roleMultiplier = userRole === 'admin' || userRole === 'clinician' ? 0.95 : 1.0;
  
  const baseThresholds = {
    [IntentCriticality.CRITICAL]: 0.85,
    [IntentCriticality.HIGH]: 0.75,
    [IntentCriticality.MEDIUM]: 0.70,
    [IntentCriticality.LOW]: 0.60,
  };
  
  return baseThresholds[criticality] * roleMultiplier;
}

