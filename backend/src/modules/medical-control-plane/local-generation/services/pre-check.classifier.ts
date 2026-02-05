/**
 * Phase 3: Pre-Check Classifier
 * 
 * Determines whether a user query is safe for local generation.
 * Uses multi-method approach: keyword rules, intent-based rules, LLM fallback.
 * 
 * Safety-first: Conservative by default. Escalates on uncertainty.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PreCheckResult } from '../dto/local-generation.dto';

@Injectable()
export class PreCheckClassifier {
  private readonly logger = new Logger(PreCheckClassifier.name);
  private readonly config: {
    enabled: boolean;
    strictMode: boolean;
    confidenceThreshold: number;
  };

  // Keywords that indicate UNSAFE for local generation
  private readonly unsafeKeywords = {
    critical: [
      'chest pain', 'heart attack', 'mi', 'cardiac arrest',
      'stroke', 'cva', 'tia', 'bleed', 'hemorrhage',
      'anaphylaxis', 'allergic reaction', 'angioedema',
      'respiratory arrest', 'apnea', 'choking',
      'unable to breathe', 'can\'t breathe', 'dyspnea',
      'unconscious', 'unresponsive', 'coma',
      'suicide', 'homicide', 'self harm',
      'overdose', 'poisoning', 'toxin',
      'severe burn', 'severe injury', 'trauma',
      'losing blood', 'massive bleed',
    ],
    high: [
      'fever', 'infection', 'sepsis', 'severe pain',
      'severe headache', 'meningitis', 'encephalitis',
      'severe vomiting', 'severe diarrhea',
      'allergic', 'reaction', 'rash', 'hives',
      'difficulty', 'shortness', 'swallow',
      'pregnancy', 'labor', 'delivery',
      'miscarriage', 'bleed', 'vaginal bleed',
      'chest', 'twine', 'pressure', 'tightness',
      'fall', 'accident', 'injury',
      'medication', 'took too much', 'overdosed',
    ],
  };

  // Intents that are SAFER for local generation
  private readonly saferIntents = [
    'GENERAL_CHAT',
    'DOCUMENTATION',
    'PROTOCOL_LOOKUP',
    'MEDICAL_REFERENCE',
    'GENERAL_QUERY',
  ];

  // Intents that are UNSAFE for local generation (require escalation)
  private readonly unsaferIntents = [
    'EMERGENCY',
    'EMERGENCY_RISK',
    'MEDICATION_SAFETY',
    'TOOL_SELECTION',
  ];

  constructor(private configService: ConfigService) {
    this.config = {
      enabled: configService.get('safeSandwich.preCheck.enabled', true),
      strictMode: configService.get('safeSandwich.preCheck.strictMode', false),
      confidenceThreshold: configService.get('safeSandwich.preCheck.confidenceThreshold', 0.75),
    };
  }

  /**
   * Main entry point: determine if query is safe for local generation
   */
  async assessQuery(
    query: string,
    intent?: string,
    riskLevel?: string,
    requiresCitation?: boolean,
  ): Promise<PreCheckResult> {
    const startTime = Date.now();
    const riskFactors: PreCheckResult['riskFactors'] = [];

    try {
      // Step 1: Quick keyword-based assessment
      const keywordCheck = this.assessByKeywords(query);
      if (keywordCheck.foundRiskKeywords) {
        this.logger.warn(`Pre-check: Found risk keywords in query: ${keywordCheck.riskKeywords.join(', ')}`);
        riskFactors.push({
          factor: 'risk_keywords_detected',
          severity: keywordCheck.severity,
          reason: `Contains keywords: ${keywordCheck.riskKeywords.join(', ')}`,
        });
      }

      // Step 2: Intent-based assessment
      if (intent) {
        const intentCheck = this.assessByIntent(intent);
        if (!intentCheck.isSafe) {
          this.logger.warn(`Pre-check: Intent ${intent} is not safe for local generation`);
          riskFactors.push({
            factor: 'unsafe_intent',
            severity: intentCheck.severity,
            reason: `Intent '${intent}' requires careful medical oversight`,
          });
        }
      }

      // Step 3: Risk level assessment
      if (riskLevel && ['critical', 'high'].includes(riskLevel)) {
        this.logger.warn(`Pre-check: High/critical risk level detected`);
        riskFactors.push({
          factor: 'high_risk_level',
          severity: riskLevel === 'critical' ? 'critical' : 'high',
          reason: `Risk level is ${riskLevel}; local generation not appropriate`,
        });
      }

      // Step 4: Citation requirement check
      if (requiresCitation) {
        this.logger.warn(`Pre-check: Citation required for this query`);
        riskFactors.push({
          factor: 'citation_required',
          severity: 'medium',
          reason: 'Query requires RAG grounding; verify local model can provide accurate citations',
        });
      }

      // Calculate confidence and decision
      const decision = this.makeDecision(riskFactors, keywordCheck);

      const result: PreCheckResult = {
        isSafeForLocalGeneration: decision.isSafe,
        confidence: decision.confidence,
        reason: decision.reason,
        riskFactors,
        recommendedAction: decision.recommendedAction,
        method: 'keyword',
        predictedAt: new Date(),
      };

      this.logger.debug(`Pre-check completed: safe=${result.isSafeForLocalGeneration}, confidence=${result.confidence}`);
      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Pre-check failed: ${err?.message || 'unknown'}`, err?.stack);

      // Fail-safe: escalate on error
      return {
        isSafeForLocalGeneration: false,
        confidence: 0.0,
        reason: `Pre-check error: ${err?.message || 'unknown'}. Escalating for safety.`,
        riskFactors: [{
          factor: 'pre_check_error',
          severity: 'high',
          reason: err?.message || 'unknown',
        }],
        recommendedAction: 'escalate',
        method: 'fallback',
        predictedAt: new Date(),
      };
    }
  }

  /**
   * Keyword-based assessment
   * Scans for critical, high-risk keywords that suggest local generation is unsafe
   */
  private assessByKeywords(query: string): {
    foundRiskKeywords: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    riskKeywords: string[];
  } {
    const lowerQuery = query.toLowerCase();
    const foundRiskKeywords: string[] = [];

    // Check critical keywords
    for (const keyword of this.unsafeKeywords.critical) {
      if (lowerQuery.includes(keyword)) {
        foundRiskKeywords.push(keyword);
      }
    }

    // If critical keywords found, escalate immediately
    if (foundRiskKeywords.length > 0) {
      return {
        foundRiskKeywords: true,
        severity: 'critical',
        riskKeywords: foundRiskKeywords,
      };
    }

    // Check high-risk keywords
    for (const keyword of this.unsafeKeywords.high) {
      if (lowerQuery.includes(keyword)) {
        foundRiskKeywords.push(keyword);
      }
    }

    return {
      foundRiskKeywords: foundRiskKeywords.length > 0,
      severity: foundRiskKeywords.length > 0 ? 'high' : 'low',
      riskKeywords: foundRiskKeywords,
    };
  }

  /**
   * Intent-based assessment
   * Determines if the intent is appropriate for local generation
   */
  private assessByIntent(intent: string): {
    isSafe: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    // Explicitly unsafe intents must be escalated
    if (this.unsaferIntents.includes(intent)) {
      return {
        isSafe: false,
        severity: intent === 'EMERGENCY' ? 'critical' : 'high',
      };
    }

    // Safer intents are OK
    if (this.saferIntents.includes(intent)) {
      return {
        isSafe: true,
        severity: 'low',
      };
    }

    // Unknown intent: be conservative
    return {
      isSafe: false,
      severity: 'medium',
    };
  }

  /**
   * Make final decision based on all risk factors
   */
  private makeDecision(
    riskFactors: PreCheckResult['riskFactors'],
    keywordCheck: { foundRiskKeywords: boolean; severity: string },
  ): {
    isSafe: boolean;
    confidence: number;
    reason: string;
    recommendedAction?: 'escalate' | 'use_rag_only' | 'flag_for_review';
  } {
    // In strict mode, any risk factor means escalate
    if (this.config.strictMode && riskFactors.length > 0) {
      return {
        isSafe: false,
        confidence: 0.95,
        reason: 'Strict mode: Any risk factor triggers escalation',
        recommendedAction: 'escalate',
      };
    }

    // Critical keywords always mean escalate
    if (keywordCheck.foundRiskKeywords && keywordCheck.severity === 'critical') {
      return {
        isSafe: false,
        confidence: 0.98,
        reason: `Critical risk keywords detected. Escalating for immediate human review.`,
        recommendedAction: 'escalate',
      };
    }

    // High-risk factors: escalate
    const highRiskCount = riskFactors.filter(f => f.severity === 'high' || f.severity === 'critical').length;
    if (highRiskCount > 0) {
      return {
        isSafe: false,
        confidence: 0.85,
        reason: `${highRiskCount} high/critical risk factors detected. Escalating.`,
        recommendedAction: 'escalate',
      };
    }

    // Medium risk with citation reqirement: use RAG only
    const mediumRiskCount = riskFactors.filter(f => f.severity === 'medium').length;
    if (mediumRiskCount > 0) {
      return {
        isSafe: false,
        confidence: 0.70,
        reason: `${mediumRiskCount} medium-risk factors detected. Recommend RAG-only or escalation.`,
        recommendedAction: 'use_rag_only',
      };
    }

    // Low risk: safe for local generation
    return {
      isSafe: true,
      confidence: this.config.confidenceThreshold,
      reason: 'Query appears safe for local generation: no critical keywords, appropriate intent, low risk.',
    };
  }
}
