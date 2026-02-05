/**
 * Tool Invocation Head Service
 * 
 * Task-specific classifier for multi-class clinical tool routing.
 * Predicts which tool is most appropriate and what parameters are needed.
 * Distilled from GPT/Claude outputs and clinician-reviewed labels.
 * 
 * Inputs: User message, primary intent, context
 * Outputs: Tool ID, alternatives, required parameters
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../../../ai/ai.service';
import {
  ToolInvocationPrediction,
} from './neural-heads.dto';

export const CLINICAL_TOOLS_TAXONOMY = {
  'sofa-calculator': {
    name: 'SOFA Score Calculator',
    description: 'Sequential (Sepsis-related) Organ Failure Assessment',
    requiredParameters: [
      { name: 'resp', description: 'Respiratory rate or PaO2/FiO2 ratio' },
      { name: 'platelets', description: 'Platelet count' },
      { name: 'bilirubin', description: 'Serum bilirubin level' },
      { name: 'mapOrVasopressor', description: 'MAP or vasopressor use' },
      { name: 'gcs', description: 'Glasgow Coma Scale' },
      { name: 'creatinine', description: 'Serum creatinine' },
    ],
  },
  'apache2-calculator': {
    name: 'APACHE-II Calculator',
    description: 'Acute Physiology, Age, Chronic Health Evaluation II',
    requiredParameters: [
      { name: 'age', description: 'Patient age' },
      { name: 'temp', description: 'Core body temperature' },
      { name: 'map', description: 'Mean arterial pressure' },
      { name: 'hr', description: 'Heart rate' },
      { name: 'rr', description: 'Respiratory rate' },
    ],
  },
  'curb65-calculator': {
    name: 'CURB-65 Score',
    description: 'Pneumonia severity and mortality risk',
    requiredParameters: [
      { name: 'confusion', description: 'Acute confusion' },
      { name: 'urea', description: 'BUN > 7 mmol/L' },
      { name: 'rr', description: 'Respiratory rate >= 30' },
      { name: 'bp', description: 'BP systolic < 90 or diastolic <= 60' },
      { name: 'age', description: 'Age >= 65' },
    ],
  },
  'gcs-calculator': {
    name: 'Glasgow Coma Scale',
    description: 'Neurological status assessment',
    requiredParameters: [
      { name: 'eye', description: 'Eye opening response (1-4)' },
      { name: 'verbal', description: 'Verbal response (1-5)' },
      { name: 'motor', description: 'Motor response (1-6)' },
    ],
  },
  'drug-interactions': {
    name: 'Drug Interaction Checker',
    description: 'Check interactions between medications',
    requiredParameters: [
      { name: 'drugs', description: 'List of medications to check' },
    ],
  },
  'lab-interpreter': {
    name: 'Lab Result Interpreter',
    description: 'Interpret lab values and abnormalities',
    requiredParameters: [
      { name: 'tests', description: 'Lab test names and values' },
    ],
  },
  'dose-calculator': {
    name: 'Medication Dosing Calculator',
    description: 'Calculate appropriate medication doses',
    requiredParameters: [
      { name: 'medication', description: 'Medication name' },
      { name: 'weight', description: 'Patient weight' },
      { name: 'renal', description: 'Renal function (if applicable)' },
    ],
  },
  'cha2ds2vasc-calculator': {
    name: 'CHA2DS2-VASc Calculator',
    description: 'Stroke risk in atrial fibrillation',
    requiredParameters: [
      { name: 'chf', description: 'Congestive heart failure' },
      { name: 'htn', description: 'Hypertension history' },
      { name: 'age', description: 'Age >= 75' },
      { name: 'diabetes', description: 'Diabetes' },
      { name: 'stroke', description: 'Previous stroke/TIA' },
      { name: 'vascular', description: 'Vascular disease' },
      { name: 'female', description: 'Female sex' },
    ],
  },
  'wells-dvt-calculator': {
    name: 'Wells DVT Score',
    description: 'Deep vein thrombosis probability',
    requiredParameters: [
      { name: 'clinicalSuspicion', description: 'Clinical suspicion level' },
      { name: 'swelling', description: 'Leg swelling' },
      { name: 'calf', description: 'Calf swelling difference' },
    ],
  },
};

@Injectable()
export class ToolInvocationHeadService {
  private readonly logger = new Logger(ToolInvocationHeadService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.get<any>('neuralHeads') || {};
    this.enabled = config.toolInvocationHead?.enabled !== false;
  }

  /**
   * Predict which clinical tool is most appropriate
   */
  async predictToolInvocation(
    message: string,
    userRole?: string,
  ): Promise<ToolInvocationPrediction | null> {
    if (!this.enabled) {
      this.logger.debug('Tool Invocation Head disabled');
      return null;
    }

    try {
      // Keyword-based quick detection
      const keywordPrediction = this.detectToolByKeywords(message);
      if (keywordPrediction) {
        return keywordPrediction;
      }

      // LLM-based tool routing
      return await this.routeToolViaLLM(message, userRole);
    } catch (error) {
      this.logger.error(
        `Tool Invocation Head failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Quick tool detection based on keywords
   */
  private detectToolByKeywords(message: string): ToolInvocationPrediction | null {
    const lowerMessage = message.toLowerCase();
    const toolKeywords: Record<string, string[]> = {
      'sofa-calculator': ['sofa', 'organ failure', 'sepsis score'],
      'apache2-calculator': ['apache', 'apache-ii', 'apache2'],
      'curb65-calculator': [
        'curb-65',
        'curb65',
        'pneumonia severity',
        'pneumonia score',
      ],
      'gcs-calculator': ['gcs', 'glasgow coma', 'gcs score'],
      'drug-interactions': [
        'drug interaction',
        'medication interaction',
        'drug check',
        'interaction checker',
      ],
      'lab-interpreter': [
        'lab result',
        'lab value',
        'interpret lab',
        'abnormal lab',
        'lab work',
      ],
      'dose-calculator': ['dose', 'dosing', 'medication dose', 'calculate dose'],
      'cha2ds2vasc-calculator': ['cha2ds2', 'cha2ds2-vasc', 'stroke risk afib'],
      'wells-dvt-calculator': ['wells', 'dvt', 'dvt score', 'deep vein thrombosis'],
    };

    // Rank tools by keyword matches
    const toolScores = Object.entries(toolKeywords).map(([toolId, keywords]) => ({
      toolId,
      score: keywords.filter(k => lowerMessage.includes(k)).length,
    }));

    const bestMatch = toolScores.sort((a, b) => b.score - a.score)[0];

    if (bestMatch && bestMatch.score > 0) {
      const toolInfo = CLINICAL_TOOLS_TAXONOMY[bestMatch.toolId];
      const alternatives = toolScores
        .filter(t => t.toolId !== bestMatch.toolId && t.score > 0)
        .slice(0, 2)
        .map(alt => ({
          toolId: alt.toolId,
          toolName: CLINICAL_TOOLS_TAXONOMY[alt.toolId]?.name || alt.toolId,
          confidence: Math.min(0.9, 0.5 + (alt.score * 0.15)),
          reason: 'Keyword match',
        }));

      return {
        toolId: bestMatch.toolId,
        toolName: toolInfo?.name || bestMatch.toolId,
        confidence: Math.min(0.9, 0.6 + (bestMatch.score * 0.1)),
        alternatives,
        requiredParameters: (toolInfo?.requiredParameters || []).map(p => ({
          name: p.name,
          type: 'any' as any,
          description: p.description,
        })),
        parametersReady: false,
        method: 'keyword',
        predictedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * LLM-based tool routing for complex cases
   */
  private async routeToolViaLLM(
    message: string,
    userRole?: string,
  ): Promise<ToolInvocationPrediction> {
    const userId = userRole || 'system';
    const availableTools = Object.keys(CLINICAL_TOOLS_TAXONOMY).join(', ');

    const prompt = `You are a clinical tool router. Determine which clinical tool best matches the user's request.

Available tools: ${availableTools}

User message: "${message}"

Respond with JSON:
{
  "toolId": "tool-id",
  "confidence": number (0.0-1.0),
  "parametersNeeded": ["param1", "param2"],
  "reasoning": "brief explanation"
}`;

    try {
      const response = await this.aiService.generateStructuredJSON(
        userId,
        prompt,
        {
          toolId: 'string',
          confidence: 'number',
          parametersNeeded: 'array',
          reasoning: 'string',
        },
      );

      const toolInfo = CLINICAL_TOOLS_TAXONOMY[response.toolId];

      return {
        toolId: response.toolId || 'unknown',
        toolName: toolInfo?.name || response.toolId || 'Unknown Tool',
        confidence: response.confidence || 0.6,
        alternatives: [],
        requiredParameters: (toolInfo?.requiredParameters || []).map(p => ({
          name: p.name,
          type: 'string' as any,
          description: p.description,
        })),
        parametersReady: false,
        method: 'llm',
        predictedAt: new Date(),
      };
    } catch (error) {
      this.logger.warn(
        `LLM tool routing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        toolId: 'lab-interpreter',
        toolName: 'Lab Interpreter',
        confidence: 0.4,
        alternatives: [],
        requiredParameters: [],
        parametersReady: false,
        method: 'llm',
        predictedAt: new Date(),
      };
    }
  }
}
