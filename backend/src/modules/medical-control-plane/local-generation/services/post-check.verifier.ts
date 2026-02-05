/**
 * Phase 3: Post-Check Verifier
 * 
 * Verifies safety and quality of locally-generated responses.
 * Implements comprehensive safety checks:
 * - Medical safety: contraindications, appropriate uncertainty, escalation
 * - PHI safety: no personally identifiable health information exposed
 * - Quality checks: coherence, terminology, caveats
 * 
 * Conservative by default: prefers false positives (flag for review) over false negatives (miss issue).
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostCheckResult } from '../dto/local-generation.dto';

@Injectable()
export class PostCheckVerifier {
  private readonly logger = new Logger(PostCheckVerifier.name);

  private readonly config: {
    enabled: boolean;
    strictMode: boolean;
    qualityThreshold: number;
  };

  // Keywords that suggest contraindications or medical mismatch
  private readonly contraindictionKeywords = {
    absolute: [
      'never', 'never do', 'absolutely no', 'do not', 'should not', 'cannot',
      'contraindicated', 'contraindication', 'dangerous', 'fatal', 'lethal',
    ],
    concerning: [
      'probably', 'likely', 'usually', 'often', 'might', 'could be',
    ],
  };

  // Keywords indicating proper uncertainty language
  private readonly uncertaintyKeywords = [
    'might', 'could', 'may', 'appear', 'suggests', 'indicate',
    'seems', 'possibly', 'potentially', 'reportedly', 'according to',
  ];

  // PHI patterns to check for
  private readonly phiPatterns = {
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    medicalRecordNumber: /\b(MRN|mrn|medical record)\s*:?\s*\d+/gi,
    dateOfBirth: /\b(DOB|dob|date of birth|born)\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  };

  // Medical terminology patterns
  private readonly medicalTerms = new Set([
    'cardiac', 'hypertension', 'diabetes', 'thrombosis', 'stenosis',
    'infarction', 'ischemia', 'hemorrhage', 'edema', 'dyspnea',
    'arrhythmia', 'fibrillation', 'necrosis', 'aortic', 'systolic',
    'diastolic', 'pathology', 'syndrome', 'pneumonia', 'sepsis',
  ]);

  constructor(private configService: ConfigService) {
    this.config = {
      enabled: configService.get('safeSandwich.postCheck.enabled', true),
      strictMode: configService.get('safeSandwich.postCheck.strictMode', false),
      qualityThreshold: configService.get('safeSandwich.postCheck.qualityThreshold', 0.6),
    };
  }

  /**
   * Main entry point: verify response safety and quality
   */
  async verify(
    responseText: string,
    originalQuery: string,
    context?: {
      intent?: string;
      riskLevel?: string;
      requiresCitation?: boolean;
      modelConfidence?: number;
    },
  ): Promise<PostCheckResult> {
    const startTime = Date.now();

    try {
      // Run all checks in parallel
      const [safetyResult, qualityResult] = await Promise.all([
        this.checkSafety(responseText, originalQuery, context),
        this.checkQuality(responseText, originalQuery, context),
      ]);

      // Determine final decision
      const isVerified = safetyResult.issues.length === 0 &&
                         qualityResult.issues.filter(i => i.severity === 'high').length === 0;
      const qualityScore = this.calculateQualityScore(qualityResult);
      const recommendedAction = this.calculateRecommendedAction(
        isVerified,
        qualityScore,
        safetyResult,
        context,
      );

      const result: PostCheckResult = {
        isVerified,
        qualityScore,
        safety: safetyResult,
        quality: qualityResult,
        recommendedAction,
        verifiedAt: new Date(),
        method: 'rules_engine',
      };

      if (!isVerified) {
        result.suggestedRevisions = this.suggestRevisions(responseText, safetyResult, qualityResult);
      }

      this.logger.debug(
        `Post-check completed: verified=${isVerified}, quality=${qualityScore}, duration=${Date.now() - startTime}ms`,
      );

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Post-check failed: ${err?.message || 'unknown'}`, err?.stack);

      // Fail-safe: flag for review on error
      return {
        isVerified: false,
        qualityScore: 0,
        safety: {
          noContraindications: false,
          appropriateUncertainty: false,
          properEscalation: false,
          noPhiExposure: false,
          issues: [{
            type: 'other',
            severity: 'high',
            description: `Post-check error: ${err?.message || 'unknown'}`,
          }],
        },
        quality: {
          coherenceScore: 0,
          terminologyAppropriate: false,
          limitationsAcknowledged: false,
          issues: [{
            type: 'other',
            severity: 'high',
            description: `Post-check error: ${err?.message || 'unknown'}`,
          }],
        },
        recommendedAction: 'flag_for_review',
        verifiedAt: new Date(),
        method: 'rules_engine',
      };
    }
  }

  /**
   * Check medical safety of response
   */
  private async checkSafety(
    responseText: string,
    originalQuery: string,
    context?: any,
  ): Promise<PostCheckResult['safety']> {
    const issues: PostCheckResult['safety']['issues'] = [];
    const lowerResponse = responseText.toLowerCase();
    const lowerQuery = originalQuery.toLowerCase();

    // 1. Check for PHI exposure
    const phiExposed = this.detectPHI(responseText);
    if (phiExposed.found) {
      issues.push({
        type: 'phi_exposure',
        severity: 'critical',
        description: `Potential PHI exposure detected: ${phiExposed.types.join(', ')}`,
        suggestedFix: 'Remove or de-identify all personal identifiers',
      });
    }

    // 2. Check for contraindications (absolute statements without proper caveats)
    const hasContradicationConcern = this.checkForContraindications(lowerResponse);
    if (hasContradicationConcern) {
      issues.push({
        type: 'contraindication',
        severity: 'high',
        description: 'Response contains absolute medical statements without appropriate uncertainty',
        suggestedFix: 'Add qualifiers like "may", "could", "appears to" instead of absolute statements',
      });
    }

    // 3. Check for appropriate uncertainty language
    const uncertaintyCheck = this.checkUncertaintyLanguage(lowerResponse, context?.riskLevel);
    if (!uncertaintyCheck.hasAppropriate) {
      issues.push({
        type: 'absolute_claim',
        severity: uncertaintyCheck.severity,
        description: uncertaintyCheck.reason,
        suggestedFix: 'Include appropriate hedging language for medical claims',
      });
    }

    // 4. Check for proper escalation
    if (context?.riskLevel === 'high' || context?.riskLevel === 'critical') {
      const hasEscalation = this.checkForEscalation(lowerResponse, lowerQuery);
      if (!hasEscalation) {
        issues.push({
          type: 'escalation_miss',
          severity: 'high',
          description: 'High-risk query detected but response does not recommend professional medical attention',
          suggestedFix: 'Add explicit recommendation to seek medical attention or call emergency services',
        });
      }
    }

    // 5. Check for medical claim without grounding (when required)
    if (context?.requiresCitation) {
      const hasGrounding = this.hasGroundingOrCitations(responseText);
      if (!hasGrounding) {
        issues.push({
          type: 'contraindication',
          severity: 'medium',
          description: 'Medical claims present but no citations or grounding provided',
          suggestedFix: 'Add citations to medical sources or RAG documents',
        });
      }
    }

    return {
      noContraindications: issues.filter(i => i.type === 'contraindication').length === 0,
      appropriateUncertainty: issues.filter(i => i.type === 'absolute_claim').length === 0,
      properEscalation: issues.filter(i => i.type === 'escalation_miss').length === 0,
      noPhiExposure: !phiExposed.found,
      issues,
    };
  }

  /**
   * Check quality of response
   */
  private async checkQuality(
    responseText: string,
    originalQuery: string,
    context?: any,
  ): Promise<PostCheckResult['quality']> {
    const issues: PostCheckResult['quality']['issues'] = [];

    // 1. Check coherence and relevance
    const coherenceScore = this.calculateCoherence(responseText, originalQuery);
    if (coherenceScore < 0.5) {
      issues.push({
        type: 'incoherence',
        severity: 'high',
        description: 'Response appears incoherent or off-topic',
      });
    }

    // 2. Check terminology appropriateness
    const terminologyCheck = this.checkTerminology(responseText);
    if (!terminologyCheck.appropriate) {
      issues.push({
        type: 'terminology',
        severity: terminologyCheck.severity,
        description: terminologyCheck.reason,
      });
    }

    // 3. Check for acknowledgment of limitations
    const limitationsCheck = this.checkLimitations(responseText, context?.intent);
    if (!limitationsCheck.acknowledged) {
      issues.push({
        type: 'missing_caveat',
        severity: limitationsCheck.severity,
        description: limitationsCheck.reason,
      });
    }

    // 4. Check response length
    if (responseText.length < 50) {
      issues.push({
        type: 'length',
        severity: 'medium',
        description: 'Response is too brief; may lack necessary detail',
      });
    }

    if (responseText.length > 2000) {
      issues.push({
        type: 'length',
        severity: 'low',
        description: 'Response is very long; consider summarizing key points',
      });
    }

    return {
      coherenceScore,
      terminologyAppropriate: terminologyCheck.appropriate,
      limitationsAcknowledged: limitationsCheck.acknowledged,
      issues,
    };
  }

  /**
   * Detect PHI in response
   */
  private detectPHI(text: string): { found: boolean; types: string[] } {
    const types: Set<string> = new Set();

    if (this.phiPatterns.ssn.test(text)) types.add('SSN');
    if (this.phiPatterns.medicalRecordNumber.test(text)) types.add('MRN');
    if (this.phiPatterns.dateOfBirth.test(text)) types.add('DOB');
    if (this.phiPatterns.phone.test(text)) types.add('Phone');
    if (this.phiPatterns.email.test(text)) types.add('Email');

    return {
      found: types.size > 0,
      types: Array.from(types),
    };
  }

  /**
   * Check for problematic contraindications or absolute statements
   */
  private checkForContraindications(lowerResponse: string): boolean {
    // Count absolute statement patterns
    let absoluteCount = 0;
    for (const keyword of this.contraindictionKeywords.absolute) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      absoluteCount += (lowerResponse.match(regex) || []).length;
    }

    // If many absolute statements without many uncertainty qualifiers, flag it
    const uncertaintyCount = this.countOccurrences(lowerResponse, this.uncertaintyKeywords);
    if (absoluteCount > 3 && uncertaintyCount < absoluteCount / 2) {
      return true;
    }

    return false;
  }

  /**
   * Check for appropriate uncertainty language
   */
  private checkUncertaintyLanguage(
    lowerResponse: string,
    riskLevel?: string,
  ): { hasAppropriate: boolean; severity: 'low' | 'medium' | 'high'; reason: string } {
    const uncertaintyCount = this.countOccurrences(lowerResponse, this.uncertaintyKeywords);

    // For high-risk queries, MUST have uncertainty language
    if (riskLevel === 'critical' || riskLevel === 'high') {
      if (uncertaintyCount === 0) {
        return {
          hasAppropriate: false,
          severity: 'high',
          reason: 'High-risk query must include uncertainty qualifiers (may, could, etc.)',
        };
      }
    }

    // For any medical response, should have some uncertainty
    const sentences = lowerResponse.split(/[.!?]+/).length;
    const uncertaintyPerSentence = sentences > 0 ? uncertaintyCount / sentences : 0;

    if (uncertaintyPerSentence < 0.1 && uncertaintyCount === 0) {
      return {
        hasAppropriate: false,
        severity: 'medium',
        reason: 'Medical response should include appropriate uncertainty language',
      };
    }

    return {
      hasAppropriate: true,
      severity: 'low',
      reason: '',
    };
  }

  /**
   * Check for escalation to professional help
   */
  private checkForEscalation(lowerResponse: string, lowerQuery: string): boolean {
    const escalationPhrases = [
      'seek medical attention',
      'consult',
      'healthcare provider',
      'doctor',
      'physician',
      'emergency',
      'hospital',
      'call 911',
      'professional',
      'urgent care',
    ];

    return escalationPhrases.some(phrase => lowerResponse.includes(phrase));
  }

  /**
   * Check if response has grounding or citations
   */
  private hasGroundingOrCitations(responseText: string): boolean {
    const lowerText = responseText.toLowerCase();
    const groundingIndicators = [
      '[source',
      'according to',
      'research shows',
      'studies indicate',
      'guidelines',
      'evidence suggests',
    ];

    return groundingIndicators.some(indicator => lowerText.includes(indicator));
  }

  /**
   * Calculate coherence score based on relevance to query
   */
  private calculateCoherence(responseText: string, originalQuery: string): number {
    // Simple heuristic: check for key term overlap
    const queryTerms = originalQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);

    const responseTerms = responseText
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);

    if (queryTerms.length === 0) return 0.8;

    const overlap = queryTerms.filter(term => responseTerms.some(rt => rt.includes(term))).length;
    const coherenceScore = overlap / queryTerms.length;

    return Math.min(1, Math.max(0, coherenceScore));
  }

  /**
   * Check terminology appropriateness
   */
  private checkTerminology(responseText: string): {
    appropriate: boolean;
    severity: 'low' | 'medium' | 'high';
    reason: string;
  } {
    const lowerResponse = responseText.toLowerCase();
    let medicalTermCount = 0;

    for (const term of this.medicalTerms) {
      if (lowerResponse.includes(term)) {
        medicalTermCount++;
      }
    }

    // If response discusses medical topics but uses no medical terminology, it might be too simplified
    if (medicalTermCount === 0 &&
        (lowerResponse.includes('disease') || lowerResponse.includes('treatment') || lowerResponse.includes('medication'))) {
      return {
        appropriate: true, // Not necessarily wrong, but potentially too simplified
        severity: 'low',
        reason: 'Response uses simplified language; may be appropriate for patient audience',
      };
    }

    return {
      appropriate: true,
      severity: 'low',
      reason: '',
    };
  }

  /**
   * Check for acknowledgment of limitations
   */
  private checkLimitations(responseText: string, intent?: string): {
    acknowledged: boolean;
    severity: 'low' | 'medium' | 'high';
    reason: string;
  } {
    const lowerResponse = responseText.toLowerCase();

    const limitationPhrases = [
      'not a substitute',
      'not medical advice',
      'limitation',
      'assumes',
      'general',
      'consult a healthcare',
      'personal medical',
    ];

    const hasLimitation = limitationPhrases.some(phrase => lowerResponse.includes(phrase));

    // For critical intents, MUST acknowledge limitations
    if (!hasLimitation && intent && ['EMERGENCY', 'EMERGENCY_RISK', 'MEDICATION_SAFETY'].includes(intent)) {
      return {
        acknowledged: false,
        severity: 'high',
        reason: `Intent ${intent} requires explicit acknowledgment of response limitations`,
      };
    }

    // For other intents, good practice but not critical
    if (!hasLimitation) {
      return {
        acknowledged: false,
        severity: 'medium',
        reason: 'Response should acknowledge its limitations as informational only',
      };
    }

    return {
      acknowledged: true,
      severity: 'low',
      reason: '',
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(qualityResult: PostCheckResult['quality']): number {
    let score = 1.0;

    // Deduct for high-severity issues
    const highSeverityCount = qualityResult.issues.filter(i => i.severity === 'high').length;
    score -= highSeverityCount * 0.2;

    // Deduct for medium-severity issues
    const mediumSeverityCount = qualityResult.issues.filter(i => i.severity === 'medium').length;
    score -= mediumSeverityCount * 0.1;

    // Adjust based on coherence
    score = score * ((qualityResult.coherenceScore + 1) / 2);

    // Adjust for terminology
    if (!qualityResult.terminologyAppropriate) {
      score *= 0.8;
    }

    // Adjust for missing limitations
    if (!qualityResult.limitationsAcknowledged) {
      score *= 0.9;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate recommended action
   */
  private calculateRecommendedAction(
    isVerified: boolean,
    qualityScore: number,
    safetyResult: PostCheckResult['safety'],
    context?: any,
  ): 'approve' | 'revise' | 'escalate' | 'flag_for_review' {
    // Critical safety issues → escalate
    const criticalIssues = safetyResult.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      return 'escalate';
    }

    // High safety issues + strict mode → escalate
    const highIssues = safetyResult.issues.filter(i => i.severity === 'high');
    if (this.config.strictMode && highIssues.length > 0) {
      return 'escalate';
    }

    // High safety issues → flag for review
    if (highIssues.length > 0) {
      return 'flag_for_review';
    }

    // Low quality → revise or flag
    if (qualityScore < this.config.qualityThreshold) {
      return this.config.strictMode ? 'flag_for_review' : 'revise';
    }

    // Verified and good quality → approve
    if (isVerified) {
      return 'approve';
    }

    // Default: flag for review
    return 'flag_for_review';
  }

  /**
   * Suggest revisions for response
   */
  private suggestRevisions(
    responseText: string,
    safetyResult: PostCheckResult['safety'],
    qualityResult: PostCheckResult['quality'],
  ): Array<{ original: string; revised: string; reason: string }> {
    const revisions = [];

    // Suggest fixes for safety issues
    for (const issue of safetyResult.issues) {
      if (issue.suggestedFix) {
        revisions.push({
          original: responseText.slice(0, 100), // Placeholder
          revised: `[${issue.suggestedFix}]`,
          reason: issue.description,
        });
      }
    }

    // Add general quality suggestions
    if (qualityResult.issues.length > 0) {
      revisions.push({
        original: responseText.slice(0, 100),
        revised: '[Review and improve response based on quality issues]',
        reason: `${qualityResult.issues.length} quality issues found`,
      });
    }

    return revisions.slice(0, 3); // Limit to top 3 suggestions
  }

  /**
   * Count occurrences of phrases in text
   */
  private countOccurrences(text: string, phrases: string[]): number {
    let count = 0;
    for (const phrase of phrases) {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      count += (text.match(regex) || []).length;
    }
    return count;
  }
}
