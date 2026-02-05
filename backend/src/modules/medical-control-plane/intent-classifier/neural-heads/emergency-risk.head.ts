/**
 * Emergency Risk Head Service
 * 
 * Task-specific classifier for fine-grained emergency severity triage.
 * Distilled from GPT/Claude outputs and clinician-reviewed labels.
 * 
 * Inputs: User message, emergency keywords, context
 * Outputs: RiskSeverity, escalation level, risk factors
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../../../ai/ai.service';
import {
  EmergencyRiskPrediction,
  RiskSeverity,
} from './neural-heads.dto';

@Injectable()
export class EmergencyRiskHeadService {
  private readonly logger = new Logger(EmergencyRiskHeadService.name);
  private readonly llmUrl: string;
  private readonly enabled: boolean;

  constructor(
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.get<any>('neuralHeads') || {};
    this.enabled = config.emergencyRiskHead?.enabled !== false;
    this.llmUrl = config.emergencyRiskHead?.url || '';
  }

  /**
   * Predict emergency risk severity using distilled model
   * Falls back to LLM if distilled model unavailable
   */
  async predictRiskSeverity(
    message: string,
    emergencyKeywords: Array<{ category: string; severity: string }>,
    userRole?: string,
  ): Promise<EmergencyRiskPrediction | null> {
    if (!this.enabled) {
      this.logger.debug('Emergency Risk Head disabled');
      return null;
    }

    try {
      // Check for keyword-based high-confidence signs
      const keywordRisk = this.assessKeywordRisk(emergencyKeywords);
      if (keywordRisk) {
        return keywordRisk;
      }

      // Try distilled model (when available)
      // TODO: Call local distilled model endpoint
      // const distilledPrediction = await this.callDistilledModel(message);

      // Fallback to LLM-based assessment
      return await this.assessRiskViaLLM(message, userRole);
    } catch (error) {
      this.logger.error(
        `Emergency Risk Head failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Quick risk assessment based on detected emergency keywords
   */
  private assessKeywordRisk(
    emergencyKeywords: Array<{ category: string; severity: string }>,
  ): EmergencyRiskPrediction | null {
    if (emergencyKeywords.length === 0) {
      return null;
    }

    // Map highest severity keyword to RiskSeverity
    const highestSeverity = emergencyKeywords[0]?.severity || 'moderate';
    let severity: RiskSeverity;

    switch (highestSeverity) {
      case 'critical':
        severity = RiskSeverity.CRITICAL;
        break;
      case 'urgent':
        severity = RiskSeverity.URGENT;
        break;
      case 'moderate':
        severity = RiskSeverity.MODERATE;
        break;
      default:
        severity = RiskSeverity.LOW;
    }

    return {
      severity,
      confidence: 0.95, // High confidence from keyword matching
      riskFactors: emergencyKeywords.map(k => k.category),
      escalationLevel: this.mapToEscalationLevel(severity),
      reasoning: `Keyword-based risk detection: ${emergencyKeywords.map(k => k.category).join(', ')}`,
      method: 'keyword',
      predictedAt: new Date(),
    };
  }

  /**
   * LLM-based risk assessment for complex cases
   */
  private async assessRiskViaLLM(
    message: string,
    userRole?: string,
  ): Promise<EmergencyRiskPrediction> {
    const userId = userRole || 'system';

    const prompt = `You are an emergency triage assistant. Analyze the clinical message for risk severity.

Message: "${message}"

Respond with a JSON object containing:
{
  "severity": "low" | "moderate" | "urgent" | "critical",
  "confidence": number (0.0-1.0),
  "riskFactors": ["factor1", "factor2"],
  "escalationLevel": "none" | "flag" | "alert" | "critical",
  "reasoning": "brief explanation"
}

Guidelines:
- CRITICAL: Immediate life threat (arrest, acute stroke, severe bleeding, anaphylaxis)
- URGENT: Serious, needs prompt action (chest pain, severe dyspnea, altered mental status)
- MODERATE: Concerning but stable (persistent pain, abnormal labs, chronic worsening)
- LOW: Stable, routine questions`;

    try {
      const response = await this.aiService.generateStructuredJSON(
        userId,
        prompt,
        {
          severity: 'string',
          confidence: 'number',
          riskFactors: 'array',
          escalationLevel: 'string',
          reasoning: 'string',
        },
      );

      const severity = this.parseSeverity(response.severity);

      return {
        severity,
        confidence: response.confidence || 0.7,
        riskFactors: response.riskFactors || [],
        escalationLevel: response.escalationLevel || 'none',
        reasoning: response.reasoning || 'LLM assessment',
        method: 'llm',
        predictedAt: new Date(),
      };
    } catch (error) {
      this.logger.warn(
        `LLM risk assessment failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Conservative fallback
      return {
        severity: RiskSeverity.MODERATE,
        confidence: 0.5,
        riskFactors: [],
        escalationLevel: 'flag',
        reasoning: 'Unable to assess; conservative fallback',
        method: 'llm',
        predictedAt: new Date(),
      };
    }
  }

  private parseSeverity(value: string): RiskSeverity {
    const lowerValue = value?.toLowerCase();
    if (lowerValue === 'critical') return RiskSeverity.CRITICAL;
    if (lowerValue === 'urgent') return RiskSeverity.URGENT;
    if (lowerValue === 'moderate') return RiskSeverity.MODERATE;
    return RiskSeverity.LOW;
  }

  private mapToEscalationLevel(
    severity: RiskSeverity,
  ): 'none' | 'flag' | 'alert' | 'critical' {
    switch (severity) {
      case RiskSeverity.CRITICAL:
        return 'critical';
      case RiskSeverity.URGENT:
        return 'alert';
      case RiskSeverity.MODERATE:
        return 'flag';
      default:
        return 'none';
    }
  }
}
