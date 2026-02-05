/**
 * Citation Need Head Service
 * 
 * Task-specific classifier for determining RAG grounding requirements.
 * Ensures medical claims are backed by evidence.
 * Distilled from GPT/Claude outputs and clinician-reviewed labels.
 * 
 * Inputs: User message, primary intent, clinical terms
 * Outputs: Citation requirement level, topics needing grounding
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../../../ai/ai.service';
import {
  CitationNeedPrediction,
  CitationRequirement,
} from './neural-heads.dto';

// Clinical keywords that always require grounding
const MANDATORY_GROUNDING_KEYWORDS = [
  // Drug names and dosing
  'mg', 'mcg', 'ivermectin', 'hydroxychloroquine', 'remdesivir',
  // Diagnoses
  'diabetes', 'hypertension', 'pneumonia', 'covid', 'cancer',
  // Procedures
  'intubation', 'ventilation', 'dialysis', 'surgery',
  // Protocols
  'icu protocol', 'sepsis management', 'ards protocol',
  // Contraindications
  'contraindicated', 'contraindication', 'allergy', 'adverse effect',
];

const MEDICAL_TERMS = [
  'patient', 'clinical', 'diagnosis', 'treatment', 'therapy',
  'medication', 'drug', 'dosage', 'symptom', 'disease',
  'protocol', 'guideline', 'evidence', 'study', 'trial',
];

@Injectable()
export class CitationNeedHeadService {
  private readonly logger = new Logger(CitationNeedHeadService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.get<any>('neuralHeads') || {};
    this.enabled = config.citationNeedHead?.enabled !== false;
  }

  /**
   * Predict whether response content needs RAG grounding
   */
  async predictCitationNeeds(
    message: string,
    primaryIntent?: string,
    userRole?: string,
  ): Promise<CitationNeedPrediction | null> {
    if (!this.enabled) {
      this.logger.debug('Citation Need Head disabled');
      return null;
    }

    try {
      // Quick keyword-based check
      const keywordAssessment = this.assessByKeywords(message);
      if (
        keywordAssessment.requirement === CitationRequirement.MANDATORY_CLINICAL
      ) {
        return keywordAssessment;
      }

      // LLM-based assessment for complex cases
      const llmAssessment = await this.assessViaMML(message, userRole);
      
      // Take the more conservative (higher requirement) assessment
      return this.selectMoreConservativeAssessment(
        keywordAssessment,
        llmAssessment,
      );
    } catch (error) {
      this.logger.error(
        `Citation Need Head failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Conservative fallback: assume grounding needed
      return this.defaultConservativePrediction();
    }
  }

  /**
   * Quick assessment based on keywords
   */
  private assessByKeywords(message: string): CitationNeedPrediction {
    const lowerMessage = message.toLowerCase();

    // Check for mandatory grounding keywords
    const hasMandatoryKeywords = MANDATORY_GROUNDING_KEYWORDS.some(keyword =>
      lowerMessage.includes(keyword),
    );

    if (hasMandatoryKeywords) {
      return {
        requirement: CitationRequirement.MANDATORY_CLINICAL,
        confidence: 0.95,
        requiresGrounding: [
          { type: 'drug_info', reason: 'Specific medication mentioned' },
          { type: 'dosage', reason: 'Dosing information may be present' },
        ],
        ragQueryTopics: this.extractTopicsFromMessage(message),
        clinicalVerificationNeeded: true,
        method: 'keyword',
        predictedAt: new Date(),
      };
    }

    // Check for general medical terms
    const medicalTermCount = MEDICAL_TERMS.filter(term =>
      lowerMessage.includes(term),
    ).length;

    if (medicalTermCount >= 3) {
      return {
        requirement: CitationRequirement.REQUIRED,
        confidence: 0.85,
        requiresGrounding: [
          { type: 'diagnosis', reason: 'Clinical question detected' },
          { type: 'treatment', reason: 'Treatment/management context' },
        ],
        ragQueryTopics: this.extractTopicsFromMessage(message),
        clinicalVerificationNeeded: true,
        method: 'keyword',
        predictedAt: new Date(),
      };
    }

    if (medicalTermCount > 0) {
      return {
        requirement: CitationRequirement.OPTIONAL,
        confidence: 0.7,
        requiresGrounding: [
          { type: 'other', reason: 'Medical context detected' },
        ],
        ragQueryTopics: this.extractTopicsFromMessage(message),
        clinicalVerificationNeeded: false,
        method: 'keyword',
        predictedAt: new Date(),
      };
    }

    // Non-medical query
    return {
      requirement: CitationRequirement.NOT_REQUIRED,
      confidence: 0.9,
      requiresGrounding: [],
      ragQueryTopics: [],
      clinicalVerificationNeeded: false,
      method: 'keyword',
      predictedAt: new Date(),
    };
  }

  /**
   * LLM-based citation need assessment
   */
  private async assessViaMML(
    message: string,
    userRole?: string,
  ): Promise<CitationNeedPrediction> {
    const userId = userRole || 'system';

    const prompt = `Analyze whether this medical message requires evidence-based grounding (RAG).

Message: "${message}"

Respond with JSON:
{
  "requirement": "not_required" | "optional" | "required" | "mandatory",
  "confidence": number (0.0-1.0),
  "groundingTypes": ["drug_info", "dosage", "protocol", "guideline", "diagnosis", "treatment"],
  "needsVerification": boolean,
  "reasoning": "brief explanation"
}

Guidelines:
- mandatory: Drug dosing, protocols, clinical claims (always ground)
- required: Diagnosis/treatment questions (should ground)
- optional: General medical info (nice to have)
- not_required: General knowledge, non-medical`;

    try {
      const response = await this.aiService.generateStructuredJSON(
        userId,
        prompt,
        {
          requirement: 'string',
          confidence: 'number',
          groundingTypes: 'array',
          needsVerification: 'boolean',
          reasoning: 'string',
        },
      );

      return {
        requirement: this.parseRequirement(response.requirement),
        confidence: response.confidence || 0.75,
        requiresGrounding: (response.groundingTypes || []).map(type => ({
          type: type as any,
          reason: 'LLM assessment',
        })),
        ragQueryTopics: this.extractTopicsFromMessage(message),
        clinicalVerificationNeeded: response.needsVerification || false,
        method: 'llm',
        predictedAt: new Date(),
      };
    } catch (error) {
      this.logger.warn(
        `LLM citation assessment failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Conservative fallback
      return this.defaultConservativePrediction();
    }
  }

  /**
   * Select the more conservative (higher requirement) assessment
   */
  private selectMoreConservativeAssessment(
    assessment1: CitationNeedPrediction,
    assessment2: CitationNeedPrediction,
  ): CitationNeedPrediction {
    const requirement1 = this.requirementLevel(assessment1.requirement);
    const requirement2 = this.requirementLevel(assessment2.requirement);

    if (requirement2 > requirement1) {
      return assessment2;
    }
    return assessment1;
  }

  private requirementLevel(requirement: CitationRequirement): number {
    switch (requirement) {
      case CitationRequirement.MANDATORY_CLINICAL:
        return 4;
      case CitationRequirement.REQUIRED:
        return 3;
      case CitationRequirement.OPTIONAL:
        return 2;
      case CitationRequirement.NOT_REQUIRED:
        return 1;
      default:
        return 0;
    }
  }

  private parseRequirement(value: string): CitationRequirement {
    const lowerValue = value?.toLowerCase();
    if (lowerValue === 'mandatory' || lowerValue === 'mandatory_clinical') {
      return CitationRequirement.MANDATORY_CLINICAL;
    }
    if (lowerValue === 'required') {
      return CitationRequirement.REQUIRED;
    }
    if (lowerValue === 'optional') {
      return CitationRequirement.OPTIONAL;
    }
    return CitationRequirement.NOT_REQUIRED;
  }

  /**
   * Extract RAG query topics from message
   */
  private extractTopicsFromMessage(message: string): string[] {
    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Extract specific medical terms
    if (lowerMessage.includes('diabetes')) topics.push('diabetes management');
    if (lowerMessage.includes('pneumonia')) topics.push('pneumonia treatment');
    if (lowerMessage.includes('sepsis')) topics.push('sepsis management');
    if (lowerMessage.includes('covid') || lowerMessage.includes('covid-19'))
      topics.push('COVID-19 treatment');
    if (lowerMessage.includes('icu'))
      topics.push('ICU protocols');
    if (lowerMessage.includes('drug') || lowerMessage.includes('medication'))
      topics.push('medication interactions');

    return topics.length > 0 ? topics : ['clinical guidance'];
  }

  /**
   * Conservative default when assessment fails
   */
  private defaultConservativePrediction(): CitationNeedPrediction {
    return {
      requirement: CitationRequirement.REQUIRED,
      confidence: 0.5, // Low confidence indicates fallback
      requiresGrounding: [
        { type: 'other', reason: 'Unable to assess; conservative fallback' },
      ],
      ragQueryTopics: ['clinical guidance'],
      clinicalVerificationNeeded: true,
      method: 'llm',
      predictedAt: new Date(),
    };
  }
}
