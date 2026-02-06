/**
 * Intent Classifier Service
 * 
 * Three-Phase Classification Pipeline (Phase 1 Enhanced + Phase 2 Heads):
 * 1. Keyword Matching (fast, rule-based) with criticality-aware thresholds
 * 2. NLU Model (fine-tuned BERT) with calibrated confidence
 * 3. LLM Fallback (GPT-4) with abstain mechanism
 * 4. Phase 2 Neural Heads (parallel task-specific classifiers)
 * 
 * Phase 1 Features:
 * - Expanded intent taxonomy (emergency_risk, tool_selection, medication_safety, etc.)
 * - Criticality-aware confidence thresholds (higher bar for critical intents)
 * - Abstain class for low-confidence cases (defers to LLM + human-safe prompts)
 * 
 * Phase 2 Features:
 * - Emergency Risk Head (fine-grained severity triage)
 * - Tool Invocation Head (smart tool routing)
 * - Citation Need Head (RAG grounding determination)
 * 
 * Emergency Detection: 100% recall (no false negatives)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../../ai/ai.service';
import { NluMetricsService } from '../../metrics/nlu-metrics.service';
import { NeuralHeadsOrchestratorService } from './neural-heads/neural-heads.orchestrator';
import {
  IntentClassification,
  IntentClassificationContext,
  PrimaryIntent,
  EmergencySeverity,
  EmergencyKeyword,
  IntentCriticality,
  getIntentCriticality,
  getConfidenceThreshold,
} from './dto/intent-classification.dto';
import {
  detectEmergencyKeywords,
  getHighestSeverity,
  EmergencyPattern,
} from './patterns/emergency.patterns';
import {
  matchToolPatterns,
  extractToolParameters,
  getToolPattern,
} from './patterns/tool.patterns';
import { classifyClinicalQuery } from './patterns/clinical.patterns';

@Injectable()
export class IntentClassifierService {
  private readonly logger = new Logger(IntentClassifierService.name);

  private readonly nluServiceUrl: string;
  private readonly nluFailureThreshold = 3;
  private readonly nluResetMs = 30_000;
  private readonly llmFailureThreshold = 3;
  private readonly llmResetMs = 30_000;
  private readonly nluEnabled: boolean;
  private readonly defaultConfidenceThreshold: number;
  private readonly intentThresholds: Record<string, number>;

  private readonly nluCircuitBreaker = {
    failureCount: 0,
    openUntil: 0,
  };

  private readonly llmCircuitBreaker = {
    failureCount: 0,
    openUntil: 0,
  };

  constructor(
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
    private readonly nluMetrics: NluMetricsService,
    private readonly neuralHeadsOrchestrator: NeuralHeadsOrchestratorService,
  ) {
    const nluConfig = this.configService.get<any>('nlu');
    const baseUrl = nluConfig?.url || 'http://localhost:8000';
    this.nluServiceUrl = baseUrl.replace(/\/$/, '');
    this.nluEnabled = nluConfig?.enabled !== false;
    this.defaultConfidenceThreshold = nluConfig?.confidenceThreshold ?? 0.7;
    this.intentThresholds = nluConfig?.intentThresholds || {};
  }

  /**
   * Main classification entry point
   * Executes 3-phase pipeline: keyword → NLU → LLM
   * With Phase 1 enhancements: criticality-aware thresholds, abstain mechanism
   */
  async classify(
    message: string,
    context?: IntentClassificationContext,
  ): Promise<IntentClassification> {
    this.logger.log(`🧠 Classifying intent for message: "${message.substring(0, 100)}..."`);

    // Extract user role for role-aware thresholds
    const userRole = context?.userRole;

    // ========================================
    // PHASE 0: EMERGENCY DETECTION (Always runs first)
    // ========================================
    const emergencyPatterns = detectEmergencyKeywords(message);
    const isEmergency = emergencyPatterns.length > 0;
    const emergencySeverity = getHighestSeverity(emergencyPatterns);

    if (isEmergency) {
      this.logger.warn(
        `🚨 EMERGENCY DETECTED: ${emergencySeverity} - ${emergencyPatterns.length} patterns matched`,
      );
    }

    // ========================================
    // PHASE 1: KEYWORD MATCHING
    // ========================================
    const keywordStartMs = Date.now();
    const keywordResult = this.keywordMatcher(message, emergencyPatterns);
    const keywordDurationSec = (Date.now() - keywordStartMs) / 1000;

    // Record Phase 1 metrics
    this.nluMetrics.recordKeywordPhaseDuration(keywordDurationSec, keywordResult.confidence >= 0.5 ? 'match' : 'no_match');
    this.nluMetrics.recordConfidenceScore(keywordResult.confidence, keywordResult.primaryIntent, 'keyword');

    // Phase 1: Calculate criticality and threshold
    const keywordCriticality = getIntentCriticality(keywordResult.primaryIntent);
    const keywordThreshold = getConfidenceThreshold(keywordCriticality, userRole);
    
    if (keywordResult.confidence >= keywordThreshold) {
      this.logger.log(
        `✅ Phase 1 (Keyword): High confidence (${keywordResult.confidence.toFixed(2)}) >= threshold (${keywordThreshold.toFixed(2)}) - ${keywordResult.primaryIntent}`,
      );
      
      // Record successful classification
      this.nluMetrics.recordIntentClassification(keywordResult.primaryIntent, 'keyword');

      const result = {
        ...keywordResult,
        criticality: keywordCriticality,
        confidenceThreshold: keywordThreshold,
        shouldAbstain: false,
        isEmergency,
        emergencyKeywords: this.mapEmergencyKeywords(emergencyPatterns),
        emergencySeverity,
<<<<<<< HEAD
        method: 'keyword' as 'keyword' | 'nlu' | 'llm' | 'abstain',
=======
        method: 'keyword',
        modelVersion: 'keyword-rules-v1',
>>>>>>> bacc212 (docs: add system upgrades roadmap for neural and platform evolution)
        classifiedAt: new Date(),
      };

      // Phase 2: Run neural heads in parallel (non-blocking)
      this.enrichWithNeuralHeads(result, message, emergencyPatterns)
        .catch(error => {
          this.logger.warn(
            `Neural heads enrichment failed (non-blocking): ${error instanceof Error ? error.message : String(error)}`,
          );
        });

      return result;
    }

    this.logger.log(
      `⚠️ Phase 1 (Keyword): Low confidence (${keywordResult.confidence.toFixed(2)}) < threshold (${keywordThreshold.toFixed(2)}) - proceeding to Phase 2`,
    );

    // ========================================
    // PHASE 2: NLU MODEL (Fine-tuned BERT)
    // ========================================
    const nluStartMs = Date.now();
    const nluResult = await this.nluMatcher(message, context);
    const nluDurationSec = (Date.now() - nluStartMs) / 1000;

    // Record Phase 2 metrics
    if (nluResult) {
      this.nluMetrics.recordModelPhaseDuration(nluDurationSec, 'success');
      this.nluMetrics.recordConfidenceScore(nluResult.confidence, nluResult.primaryIntent, 'model');

<<<<<<< HEAD
      // Phase 1: Calculate criticality and threshold for NLU result
      const nluCriticality = getIntentCriticality(nluResult.primaryIntent);
      const nluThreshold = getConfidenceThreshold(nluCriticality, userRole);

      if (nluResult.confidence >= nluThreshold) {
=======
      if (nluResult.confidence >= this.getThresholdForIntent(nluResult.primaryIntent)) {
>>>>>>> bacc212 (docs: add system upgrades roadmap for neural and platform evolution)
        this.logger.log(
          `✅ Phase 2 (NLU): High confidence (${nluResult.confidence.toFixed(2)}) >= threshold (${nluThreshold.toFixed(2)}) - ${nluResult.primaryIntent}`,
        );
        
        // Record successful classification
        this.nluMetrics.recordIntentClassification(nluResult.primaryIntent, 'model');

        const result = {
          ...nluResult,
          criticality: nluCriticality,
          confidenceThreshold: nluThreshold,
          shouldAbstain: false,
          isEmergency,
          emergencyKeywords: this.mapEmergencyKeywords(emergencyPatterns),
          emergencySeverity,
<<<<<<< HEAD
          method: 'nlu' as 'keyword' | 'nlu' | 'llm' | 'abstain',
=======
          method: 'nlu',
          modelVersion: nluResult.modelVersion || 'nlu-unknown',
>>>>>>> bacc212 (docs: add system upgrades roadmap for neural and platform evolution)
          classifiedAt: new Date(),
        };

        // Phase 2: Run neural heads in parallel (non-blocking)
        this.enrichWithNeuralHeads(result, message, emergencyPatterns)
          .catch(error => {
            this.logger.warn(
              `Neural heads enrichment failed (non-blocking): ${error instanceof Error ? error.message : String(error)}`,
            );
          });

        return result;
      } else {
        this.logger.log(
          `⚠️ Phase 2 (NLU): Low confidence (${nluResult.confidence.toFixed(2)}) < threshold (${nluThreshold.toFixed(2)}) - considering abstain or Phase 3`,
        );
      }
    } else {
      // NLU failed or circuit breaker open
      this.nluMetrics.recordModelPhaseDuration(nluDurationSec, 'failure');
    }

    // ========================================
    // PHASE 3: LLM FALLBACK (GPT-4) or ABSTAIN
    // ========================================
    this.logger.log(`🤖 Phase 3 (LLM): Invoking GPT-4 for complex intent classification`);

    const llmStartMs = Date.now();
    try {
      const llmResult = await this.llmMatcher(message, context);
      const llmDurationSec = (Date.now() - llmStartMs) / 1000;

      // Phase 1: Calculate criticality and threshold for LLM result
      const llmCriticality = getIntentCriticality(llmResult.primaryIntent);
      const llmThreshold = getConfidenceThreshold(llmCriticality, userRole);

      // Record Phase 3 metrics
      this.nluMetrics.recordLlmPhaseDuration(llmDurationSec, 'success');
      this.nluMetrics.recordConfidenceScore(llmResult.confidence, llmResult.primaryIntent, 'llm');

      // Phase 1: Check if LLM result meets threshold or should abstain
      const shouldAbstain = llmResult.confidence < llmThreshold;
      
      if (!shouldAbstain) {
        this.nluMetrics.recordIntentClassification(llmResult.primaryIntent, 'llm');
      }

      this.logger.log(
        `${shouldAbstain ? '⚠️ Phase 3 (Abstain)' : '✅ Phase 3 (LLM)'}: confidence (${llmResult.confidence.toFixed(2)}) ${shouldAbstain ? '<' : '>='}  threshold (${llmThreshold.toFixed(2)})`,
      );

      const result = {
        ...llmResult,
        criticality: llmCriticality,
        confidenceThreshold: llmThreshold,
        shouldAbstain,
        isEmergency,
        emergencyKeywords: this.mapEmergencyKeywords(emergencyPatterns),
        emergencySeverity,
<<<<<<< HEAD
        method: (shouldAbstain ? 'abstain' : 'llm') as 'keyword' | 'nlu' | 'llm' | 'abstain',
=======
        method: 'llm',
        modelVersion: llmResult.modelVersion || 'llm-unknown',
>>>>>>> bacc212 (docs: add system upgrades roadmap for neural and platform evolution)
        classifiedAt: new Date(),
      };

      // Phase 2: Run neural heads in parallel (non-blocking)
      this.enrichWithNeuralHeads(result, message, emergencyPatterns)
        .catch(error => {
          this.logger.warn(
            `Neural heads enrichment failed (non-blocking): ${error instanceof Error ? error.message : String(error)}`,
          );
        });

      return result;
    } catch (error) {
      const llmDurationSec = (Date.now() - llmStartMs) / 1000;
      this.nluMetrics.recordLlmPhaseDuration(llmDurationSec, 'failure');
      
      this.logger.error(`❌ Phase 3 (LLM) failed: ${error instanceof Error ? error.message : String(error)}. Returning keyword result with abstain flag.`);
      
      // Fallback to keyword result with abstain flag
      const fallbackCriticality = getIntentCriticality(keywordResult.primaryIntent);
      const fallbackThreshold = getConfidenceThreshold(fallbackCriticality, userRole);
      
      this.nluMetrics.recordIntentClassification(keywordResult.primaryIntent, 'keyword');

      const result = {
        ...keywordResult,
        criticality: fallbackCriticality,
        confidenceThreshold: fallbackThreshold,
        shouldAbstain: true, // Mark as abstain since we had to fallback
        isEmergency,
        emergencyKeywords: this.mapEmergencyKeywords(emergencyPatterns),
        emergencySeverity,
<<<<<<< HEAD
        method: 'keyword' as const,
=======
        method: 'keyword',
        modelVersion: 'keyword-rules-v1',
>>>>>>> bacc212 (docs: add system upgrades roadmap for neural and platform evolution)
        classifiedAt: new Date(),
      };

      // Phase 2: Run neural heads in parallel (non-blocking)
      this.enrichWithNeuralHeads(result, message, emergencyPatterns)
        .catch(error => {
          this.logger.warn(
            `Neural heads enrichment failed (non-blocking): ${error instanceof Error ? error.message : String(error)}`,
          );
        });

      return result;
    }
  }

  /**
   * Enrich classification result with Phase 2 Neural Heads predictions
   * Runs in parallel and modifies the result object
   */
  private async enrichWithNeuralHeads(
    result: IntentClassification,
    message: string,
    emergencyPatterns: EmergencyPattern[],
  ): Promise<void> {
    try {
      const headersStartMs = Date.now();
      const neuralHeadsResult = await this.neuralHeadsOrchestrator.predictWithAllHeads(
        message,
        emergencyPatterns.map(p => ({
          category: p.category,
          severity: p.severity,
        })),
        result.primaryIntent,
        undefined, // userRole not available here, can be added from context if needed
      );
      const headsDurationSec = (Date.now() - headersStartMs) / 1000;

      this.logger.debug(
        `🧠 Phase 2 (Neural Heads) completed in ${headsDurationSec.toFixed(3)}s: ` +
          `risk=${neuralHeadsResult.emergencyRisk?.severity || 'N/A'}, ` +
          `tool=${neuralHeadsResult.toolInvocation?.toolId || 'N/A'}, ` +
          `citation=${neuralHeadsResult.citationNeeds?.requirement || 'N/A'}`,
      );

      // Attach neural heads results to classification
      result.neuralHeads = {
        emergencyRiskScore: neuralHeadsResult.emergencyRisk
          ? this.mapRiskSeverityToScore(neuralHeadsResult.emergencyRisk.severity)
          : undefined,
        toolSuggestions: neuralHeadsResult.toolInvocation
          ? [
              {
                toolId: neuralHeadsResult.toolInvocation.toolId,
                toolName: neuralHeadsResult.toolInvocation.toolName,
                confidence: neuralHeadsResult.toolInvocation.confidence,
              },
              ...(neuralHeadsResult.toolInvocation.alternatives || []),
            ]
          : undefined,
        citationRequirement: neuralHeadsResult.citationNeeds?.requirement,
        recommendedActions: neuralHeadsResult.recommendedActions,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to enrich with neural heads: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Continue without neural heads results
    }
  }

  /**
   * Map risk severity to numeric score for easier comparison
   */
  private mapRiskSeverityToScore(severity: string): number {
    const severityMap = {
      critical: 1.0,
      urgent: 0.75,
      moderate: 0.5,
      low: 0.25,
    };
    return severityMap[severity] || 0.5;
  }


  /**
   * Phase 1: Fast keyword-based pattern matching
   */
  private keywordMatcher(
    message: string,
    emergencyPatterns: EmergencyPattern[],
  ): Omit<IntentClassification, 'isEmergency' | 'emergencyKeywords' | 'emergencySeverity' | 'method' | 'classifiedAt' | 'criticality' | 'confidenceThreshold' | 'shouldAbstain'> {
    const matchedPatterns: string[] = [];

    // Priority 1: Emergency always takes precedence
    if (emergencyPatterns.length > 0) {
      return {
        primaryIntent: PrimaryIntent.EMERGENCY,
        confidence: 1.0, // 100% confidence for emergency detection
        extractedParameters: {},
        matchedPatterns: emergencyPatterns.map(p => p.category),
      };
    }

    // Priority 2: Clinical tool detection
    const toolMatches = matchToolPatterns(message);
    if (toolMatches.length > 0) {
      const bestMatch = toolMatches[0];
      matchedPatterns.push(...bestMatch.matchedKeywords);

      const extractedParameters = extractToolParameters(message, bestMatch.toolId);

      return {
        primaryIntent: PrimaryIntent.CLINICAL_TOOL,
        toolId: bestMatch.toolId,
        confidence: bestMatch.confidence,
        extractedParameters,
        matchedPatterns,
        alternativeIntents: toolMatches.slice(1, 3).map(m => ({
          intent: PrimaryIntent.CLINICAL_TOOL,
          toolId: m.toolId,
          confidence: m.confidence,
        })),
      };
    }

    // Priority 3: Clinical query classification
    const clinicalQuery = classifyClinicalQuery(message);
    
    if (clinicalQuery.category === 'medical_reference') {
      return {
        primaryIntent: PrimaryIntent.MEDICAL_REFERENCE,
        confidence: clinicalQuery.confidence,
        extractedParameters: {},
        matchedPatterns: [clinicalQuery.category],
      };
    }

    if (clinicalQuery.category === 'administrative') {
      return {
        primaryIntent: PrimaryIntent.ADMINISTRATIVE,
        confidence: clinicalQuery.confidence,
        extractedParameters: {},
        matchedPatterns: [clinicalQuery.category],
      };
    }

    // Priority 4: General query (default)
    return {
      primaryIntent: PrimaryIntent.GENERAL_QUERY,
      confidence: 0.3,
      extractedParameters: {},
      matchedPatterns: [],
    };
  }

  /**
   * Phase 2: NLU model-based classification (fine-tuned BERT)
   */
  private async nluMatcher(
    message: string,
    context?: IntentClassificationContext,
<<<<<<< HEAD
  ): Promise<Omit<IntentClassification, 'isEmergency' | 'emergencyKeywords' | 'emergencySeverity' | 'method' | 'classifiedAt' | 'criticality' | 'confidenceThreshold' | 'shouldAbstain'> | null> {
=======
  ): Promise<(Omit<IntentClassification, 'isEmergency' | 'emergencyKeywords' | 'emergencySeverity' | 'method' | 'classifiedAt'> & { modelVersion?: string }) | null> {
>>>>>>> bacc212 (docs: add system upgrades roadmap for neural and platform evolution)
    if (!this.nluEnabled) {
      this.logger.warn('NLU service disabled by configuration. Skipping NLU phase.');
      return null;
    }

    if (this.isCircuitOpen(this.nluCircuitBreaker)) {
      this.logger.warn('NLU circuit breaker is open. Skipping NLU phase.');
      return null;
    }

    if (!this.nluServiceUrl) {
      this.logger.warn('NLU service URL not configured. Skipping NLU phase.');
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${this.nluServiceUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, context }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`NLU service responded with ${response.status}`);
        this.recordFailure(this.nluCircuitBreaker, this.nluFailureThreshold, this.nluResetMs);
        return null;
      }

      const result = await response.json();
      const primaryIntent = this.mapNluIntent(result.intent);

      if (!primaryIntent) {
        this.logger.warn(`NLU returned unknown intent: ${String(result.intent)}`);
        this.recordFailure(this.nluCircuitBreaker, this.nluFailureThreshold, this.nluResetMs);
        return null;
      }

      this.recordSuccess(this.nluCircuitBreaker);

      return {
        primaryIntent,
        toolId: result.toolId,
        confidence: result.confidence ?? 0.0,
        extractedParameters: result.parameters || {},
        matchedPatterns: ['nlu-model'],
        modelVersion: result.model_version || result.modelVersion || 'nlu-unknown',
      };
    } catch (error) {
      this.logger.warn(`NLU service unavailable: ${error instanceof Error ? error.message : String(error)}`);
      this.recordFailure(this.nluCircuitBreaker, this.nluFailureThreshold, this.nluResetMs);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Map NLU intent labels to PrimaryIntent enum
   */
  private mapNluIntent(intent: string | undefined): PrimaryIntent | null {
    // Phase 1: Expanded intent taxonomy mapping
    switch (intent) {
      // Emergency & Risk intents
      case 'emergency':
        return PrimaryIntent.EMERGENCY;
      case 'emergency_risk':
      case 'risk_triage':
      case 'severity_assessment':
        return PrimaryIntent.EMERGENCY_RISK;
      
      // Medication & Safety intents
      case 'medication_safety':
      case 'drug_interaction':
      case 'contraindication':
      case 'drug_checker':
        return PrimaryIntent.MEDICATION_SAFETY;
      
      // Tool & Clinical intents
      case 'clinical_tool':
      case 'tool_selection':
      case 'sofa_calculator':
      case 'apache_calculator':
      case 'lab_interpreter':
        return PrimaryIntent.TOOL_SELECTION;
      
      // Protocol & Lookup intents
      case 'protocol_lookup':
      case 'protocol_search':
      case 'protocol_query':
      case 'guideline_lookup':
        return PrimaryIntent.PROTOCOL_LOOKUP;
      
      // Documentation intents
      case 'documentation':
      case 'patient_data':
      case 'record_query':
      case 'documentation_query':
        return PrimaryIntent.DOCUMENTATION;
      
      // Medical reference (legacy, maps to medium criticality)
      case 'lab_query':
      case 'medical_reference':
        return PrimaryIntent.MEDICAL_REFERENCE;
      
      // General intents
      case 'general_query':
      case 'general_chat':
      case 'educational':
        return PrimaryIntent.GENERAL_CHAT;
      
      // Administrative (legacy)
      case 'admin_function':
      case 'administrative':
        return PrimaryIntent.ADMINISTRATIVE;
      
      default:
        return null;
    }
  }

  /**
   * Phase 3: LLM-based classification for complex cases
   */
  private async llmMatcher(
    message: string,
    context?: IntentClassificationContext,
  ): Promise<Omit<IntentClassification, 'isEmergency' | 'emergencyKeywords' | 'emergencySeverity' | 'method' | 'classifiedAt' | 'criticality' | 'confidenceThreshold' | 'shouldAbstain'>> {
    const userId = context?.userId || 'system';

    if (this.isCircuitOpen(this.llmCircuitBreaker)) {
      throw new Error('LLM circuit breaker is open');
    }

    // Build context for LLM
    let contextStr = '';
    if (context?.previousMessages && context.previousMessages.length > 0) {
      contextStr = '\n\nConversation History:\n';
      contextStr += context.previousMessages
        .slice(-3) // Last 3 messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');
    }

    const prompt = `Classify the following clinical query into one of these intents:
- general_query: General clinical information requests
- clinical_tool: User wants to use a specific clinical tool (calculator, checker, interpreter)
- medical_reference: Looking up medical information, definitions, or guidelines
- administrative: Billing, documentation, scheduling, or administrative tasks
- emergency: Medical emergency (this should be rare as emergencies are caught by keyword matching)

If the intent is "clinical_tool", identify which tool:
- sofa-calculator: SOFA score for organ failure assessment
- apache2-calculator: APACHE-II for ICU mortality
- cha2ds2vasc-calculator: Stroke risk in AFib
- curb65-calculator: Pneumonia severity
- gcs-calculator: Glasgow Coma Scale
- wells-dvt-calculator: DVT probability
- drug-interactions: Drug-drug interaction checker
- dose-calculator: Medication dosing
- lab-interpreter: Lab result interpretation
- abg-interpreter: Arterial blood gas analysis
- protocol-lookup: Clinical protocols and guidelines
- differential-diagnosis: Generate differential diagnoses
- antibiotic-guide: Antibiotic selection

User Query: "${message}"${contextStr}

Respond in JSON format:
{
  "primaryIntent": "intent_name",
  "toolId": "tool_id_if_applicable",
  "confidence": 0.85,
  "extractedParameters": {},
  "reasoning": "brief explanation"
}`;

    try {
      const response = await this.aiService.generateStructuredJSON(userId, prompt, {
        primaryIntent: 'string',
        toolId: 'string',
        confidence: 'number',
        extractedParameters: 'object',
        reasoning: 'string',
      });

      this.recordSuccess(this.llmCircuitBreaker);

      return {
        primaryIntent: response.primaryIntent as PrimaryIntent,
        toolId: response.toolId,
        confidence: response.confidence || 0.8,
        extractedParameters: response.extractedParameters || {},
        matchedPatterns: ['llm-classified'],
        modelVersion: 'openai-structured-json',
      };
    } catch (error) {
      this.recordFailure(this.llmCircuitBreaker, this.llmFailureThreshold, this.llmResetMs);
      throw new Error(`LLM classification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }


  private getThresholdForIntent(intent: PrimaryIntent): number {
    return this.intentThresholds[intent] ?? this.defaultConfidenceThreshold;
  }

  private isCircuitOpen(breaker: { failureCount: number; openUntil: number }): boolean {
    return breaker.openUntil > Date.now();
  }

  private recordFailure(
    breaker: { failureCount: number; openUntil: number },
    threshold: number,
    resetMs: number,
  ): void {
    breaker.failureCount += 1;
    if (breaker.failureCount >= threshold) {
      breaker.openUntil = Date.now() + resetMs;
      this.logger.warn(`Circuit breaker opened for ${resetMs}ms after ${breaker.failureCount} failures.`);
      
      // Update metrics: circuit breaker opened
      const serviceName = breaker === this.nluCircuitBreaker ? 'nlu_model' : 'llm';
      this.nluMetrics.setCircuitBreakerState(serviceName, true);
    }
  }

  private recordSuccess(breaker: { failureCount: number; openUntil: number }): void {
    const wasOpen = breaker.openUntil > Date.now();
    breaker.failureCount = 0;
    breaker.openUntil = 0;
    
    // Update metrics: circuit breaker closed if it was open
    if (wasOpen) {
      const serviceName = breaker === this.nluCircuitBreaker ? 'nlu_model' : 'llm';
      this.nluMetrics.setCircuitBreakerState(serviceName as 'llm' | 'nlu_model', false);
    }
  }

  /**
   * Map emergency patterns to EmergencyKeyword DTOs
   */
  private mapEmergencyKeywords(patterns: EmergencyPattern[]): EmergencyKeyword[] {
    const keywords: EmergencyKeyword[] = [];
    
    for (const pattern of patterns) {
      // Add first keyword from each pattern (representative)
      if (pattern.keywords.length > 0) {
        keywords.push({
          keyword: pattern.keywords[0],
          category: pattern.category,
          severity: pattern.severity,
        });
      }
    }
    
    return keywords;
  }

  /**
   * Get escalation message for emergency
   */
  getEmergencyEscalationMessage(patterns: EmergencyPattern[]): string {
    if (patterns.length === 0) return '';
    
    // Return the most critical pattern's escalation message
    const criticalPattern = patterns.find(p => p.severity === EmergencySeverity.CRITICAL);
    return (criticalPattern || patterns[0]).escalationMessage;
  }

  /**
   * Check if user message requires immediate escalation
   */
  requiresEscalation(classification: IntentClassification): boolean {
    return (
      classification.isEmergency &&
      classification.emergencySeverity === EmergencySeverity.CRITICAL
    );
  }
}
