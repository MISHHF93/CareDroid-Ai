/**
 * Phase 3: Local Generation Service
 * 
 * Generates responses using a local healthcare-tuned model.
 * Interfaces with:
 * - Existing NLU service (at backend/ml-services/nlu)
 * - RAG service for clinical grounding
 * - Conversation history for coherence
 * 
 * Currently in shadow mode: generates but doesn't serve by default.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalGenerationRequest, LocalGenerationResponse } from '../dto/local-generation.dto';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class LocalGenerationService {
  private readonly logger = new Logger(LocalGenerationService.name);
  private mlServiceClient: AxiosInstance;

  private readonly config: {
    modelId: string;
    maxTokens: number;
    temperature: number;
    topP: number;
    mlServiceUrl: string;
    includeRag: boolean;
  };

  constructor(private configService: ConfigService) {
    this.config = {
      modelId: configService.get('safeSandwich.generation.modelId', 'phi-2-7b-medical'),
      maxTokens: configService.get('safeSandwich.generation.maxTokens', 512),
      temperature: configService.get('safeSandwich.generation.temperature', 0.7),
      topP: configService.get('safeSandwich.generation.topP', 0.95),
      mlServiceUrl: configService.get('mlServices.baseUrl', 'http://localhost:8001'),
      includeRag: configService.get('safeSandwich.generation.includeRag', true),
    };

    this.mlServiceClient = axios.create({
      baseURL: this.config.mlServiceUrl,
      timeout: 30000,
    });
  }

  /**
   * Generate response using local model
   * Returns draft with confidence and grounding info
   */
  async generate(
    request: LocalGenerationRequest,
    ragDocuments?: Array<{ source: string; content: string; relevanceScore: number }>,
  ): Promise<LocalGenerationResponse> {
    const startTime = Date.now();

    try {
      // Build system prompt with clinical context
      const systemPrompt = this.buildSystemPrompt(request);

      // Build user prompt with context and RAG grounding
      const userPrompt = this.buildUserPrompt(request, ragDocuments);

      // Build conversation context
      const conversationContext = this.buildConversationContext(request.conversationHistory || []);

      // Call local generation endpoint
      const response = await this.callLocalGenerator(
        systemPrompt,
        userPrompt,
        conversationContext,
      );

      const processingTime = Date.now() - startTime;

      // Extract response details
      const responseText = response.text || '';
      const confidence = response.confidence || this.estimateConfidence(response);
      const suggestedLimitations = this.identifyLimitations(responseText, request);

      // Check if response includes citations (if grounding was provided)
      const citedSources = ragDocuments
        ? this.extractCitedSources(responseText, ragDocuments)
        : [];

      const result: LocalGenerationResponse = {
        responseText,
        confidence,
        isGrounded: citedSources.length > 0 || this.hasGroundingLanguage(responseText),
        citedSources,
        identifiedLimitations: suggestedLimitations,
        suggestedTool: this.identifySuggestedTool(request.query, responseText),
        generatedAt: new Date(),
        modelVersion: this.config.modelId,
        processingTime,
      };

      this.logger.debug(
        `Generation completed: confidence=${result.confidence}, processingTime=${processingTime}ms`,
      );

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Generation failed: ${err?.message || 'unknown'}`, err?.stack);
      throw error;
    }
  }

  /**
   * Build system prompt with clinical context and safety guardrails
   */
  private buildSystemPrompt(request: LocalGenerationRequest): string {
    const role = request.userRole === 'clinician' ? 'experienced physician' : 'healthcare assistant';

    return `You are a ${role} providing healthcare information. Follow these rules strictly:

1. **Accuracy First**: Only provide information based on current medical evidence.
2. **Uncertainty**: Always express uncertainty when appropriate. Use phrases like "may", "could", "suggests".
3. **No Absolute Claims**: Never say "this WILL happen" without strong evidence. Use "this MAY happen" instead.
4. **Emergency Escalation**: For any life-threatening concern, immediately recommend calling 911 or emergency services.
5. **Scope Limitation**: Remember you are providing information, not medical diagnosis or treatment.
6. **Patient Safety**: If uncertain, recommend consulting a healthcare provider.
7. **Citation**: When providing specific medical facts, cite the source or guideline.

Intent: ${request.intendedIntent}
Risk Level: ${request.riskLevel || 'unknown'}
Requires Citation: ${request.requiresCitation ? 'yes' : 'no'}
`;
  }

  /**
   * Build user prompt with query and optional RAG grounding
   */
  private buildUserPrompt(
    request: LocalGenerationRequest,
    ragDocuments?: Array<{ source: string; content: string; relevanceScore: number }>,
  ): string {
    let prompt = `Question: ${request.query}`;

    // Add patient context if available
    if (request.context) {
      const contextParts = [];
      if (request.context.patientAge) contextParts.push(`Age: ${request.context.patientAge}`);
      if (request.context.patientGender) contextParts.push(`Gender: ${request.context.patientGender}`);
      if (request.context.primaryCondition) contextParts.push(`Condition: ${request.context.primaryCondition}`);
      if (request.context.medications?.length) contextParts.push(`Medications: ${request.context.medications.join(', ')}`);
      if (request.context.allergies?.length) contextParts.push(`Allergies: ${request.context.allergies.join(', ')}`);

      if (contextParts.length > 0) {
        prompt += `\n\nPatient Context:\n${contextParts.join('\n')}`;
      }
    }

    // Add RAG grounding
    if (ragDocuments && ragDocuments.length > 0 && this.config.includeRag) {
      prompt += '\n\nRelevant Medical Information:\n';
      ragDocuments
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3) // Top 3 documents
        .forEach((doc, idx) => {
          prompt += `\n[Source ${idx + 1}: ${doc.source}]\n${doc.content}\n`;
        });
      prompt += '\nProvide your answer based on the above information when relevant.';
    }

    return prompt;
  }

  /**
   * Build conversation context from history
   */
  private buildConversationContext(history: Array<{ role: string; content: string }>): string {
    if (history.length === 0) return '';

    // Keep only last 5 messages to stay within token limit
    const recentHistory = history.slice(-5);

    return recentHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Call the local generation model
   * Currently targets the existing ml-services infrastructure
   */
  private async callLocalGenerator(
    systemPrompt: string,
    userPrompt: string,
    conversationContext?: string,
  ): Promise<{ text: string; confidence?: number }> {
    try {
      // Option 1: Call generation-specific endpoint (if available)
      // Option 2: Simulate local generation (placeholder for actual model)
      // In production, this would call the actual local model via HTTP
      const response = await this.mlServiceClient.post('/generate', {
        model_id: this.config.modelId,
        prompt: this.formatPromptForModel(systemPrompt, userPrompt, conversationContext),
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
      }).catch(async (error) => {
        // Fallback: return mock generation for testing
        const err = error as any;
        this.logger.warn(`Local generation endpoint unavailable: ${err?.message || 'unknown'}. Using fallback.`);
        return this.generateFallbackResponse(userPrompt);
      });

      // Handle both Axios response and fallback object formats
      const responseData = (response as any).data || response;
      return {
        text: responseData.text || responseData.response || '',
        confidence: responseData.confidence || 0.6,
      };
    } catch (error) {
      const err = error as any;
      this.logger.error(`Local generator call failed: ${err?.message || 'unknown'}`, err?.stack);
      throw new Error(`Local generation failed: ${err?.message || 'unknown'}`);
    }
  }

  /**
   * Format prompt for the model
   */
  private formatPromptForModel(systemPrompt: string, userPrompt: string, conversationContext?: string): string {
    let formattedPrompt = systemPrompt + '\n\n';

    if (conversationContext) {
      formattedPrompt += 'Conversation History:\n' + conversationContext + '\n\n';
    }

    formattedPrompt += userPrompt;

    return formattedPrompt;
  }

  /**
   * Estimate confidence from response characteristics
   */
  private estimateConfidence(response: any): number {
    // Base confidence
    let confidence = 0.6;

    // Higher confidence if model provided explicit score
    if (response.confidence !== undefined) {
      confidence = response.confidence;
    }

    // Adjust based on response length (too short = uncertain)
    const textLength = (response.text || '').length;
    if (textLength < 50) {
      confidence *= 0.7; // Reduce confidence for very short responses
    } else if (textLength > 500) {
      confidence *= 0.9; // Slightly increase for well-developed response
    }

    // Adjust based on uncertainty language
    const uncertaintyPhrases = ['may', 'could', 'might', 'possibly', 'suggests', 'appears to'];
    const hasUncertaintyLanguage = uncertaintyPhrases.some(phrase =>
      response.text?.toLowerCase().includes(phrase),
    );

    if (hasUncertaintyLanguage) {
      confidence *= 0.85; // Reduce confidence when model is cautious
    }

    return Math.min(0.95, Math.max(0.4, confidence)); // Clamp between 0.4-0.95
  }

  /**
   * Extract cited sources from response
   */
  private extractCitedSources(
    response: string,
    ragDocuments: Array<{ source: string }>,
  ): string[] {
    const sources: Set<string> = new Set();

    // Look for source citations in brackets [Source: ...]
    const sourceMatches = response.match(/\[Source[:\s]+([^\]]+)\]/gi);
    if (sourceMatches) {
      sourceMatches.forEach(match => {
        const sourceName = match.replace(/\[Source[:\s]+|]/gi, '').trim();
        sources.add(sourceName);
      });
    }

    // Look for document names mentioned
    ragDocuments.forEach(doc => {
      if (response.includes(doc.source)) {
        sources.add(doc.source);
      }
    });

    return Array.from(sources);
  }

  /**
   * Check if response includes grounding language
   */
  private hasGroundingLanguage(response: string): boolean {
    const groundingPhrases = [
      'according to',
      'research shows',
      'evidence suggests',
      'clinical guidelines',
      'studies indicate',
      'medical literature',
    ];

    return groundingPhrases.some(phrase => response.toLowerCase().includes(phrase));
  }

  /**
   * Identify limitations in the response
   */
  private identifyLimitations(response: string, request: LocalGenerationRequest): string[] {
    const limitations: string[] = [];

    const lowerResponse = response.toLowerCase();

    // Check for missing acknowledgment of limitations
    if (!lowerResponse.includes('limitation') && !lowerResponse.includes('not a substitute')) {
      if (request.intendedIntent && 
          ['EMERGENCY_RISK', 'MEDICATION_SAFETY', 'TOOL_SELECTION'].includes(request.intendedIntent)) {
        limitations.push('Missing explicit acknowledgment of response limitations');
      }
    }

    // Check for missing escalation language for serious topics
    if (request.riskLevel === 'high' || request.riskLevel === 'critical') {
      if (!lowerResponse.includes('seek medical attention') &&
          !lowerResponse.includes('contact a doctor') &&
          !lowerResponse.includes('emergency')) {
        limitations.push('Missing escalation to professional medical attention');
      }
    }

    // Check for citation when required
    if (request.requiresCitation) {
      const hasCitation = this.extractCitedSources(response, []).length > 0;
      if (!hasCitation && !this.hasGroundingLanguage(response)) {
        limitations.push('No citations provided; response should reference medical sources');
      }
    }

    return limitations;
  }

  /**
   * Identify if a clinical tool would be beneficial
   */
  private identifySuggestedTool(
    query: string,
    response: string,
  ): { toolId: string; toolName: string; reason: string } | undefined {
    const lowerQuery = query.toLowerCase() + ' ' + response.toLowerCase();

    // Map keywords to tools
    const toolMappings = [
      {
        toolId: 'sofa',
        toolName: 'SOFA Score Calculator',
        keywords: ['organ failure', 'sofa', 'icu', 'dysfunction'],
        reason: 'Query suggests need for organ failure assessment',
      },
      {
        toolId: 'apache-ii',
        toolName: 'APACHE-II Calculator',
        keywords: ['icu mortality', 'apache', 'severity'],
        reason: 'Discussion of ICU severity assessment indicated',
      },
      {
        toolId: 'drug-checker',
        toolName: 'Drug Interaction Checker',
        keywords: ['drug interaction', 'medication conflict', 'contraindicated'],
        reason: 'Response discusses potential drug interactions',
      },
      {
        toolId: 'gcs',
        toolName: 'GCS Calculator',
        keywords: ['glasgow', 'consciousness', 'gcs', 'mental status'],
        reason: 'Neurological assessment suggested',
      },
    ];

    for (const tool of toolMappings) {
      if (tool.keywords.some(keyword => lowerQuery.includes(keyword))) {
        return tool;
      }
    }

    return undefined;
  }

  /**
   * Fallback generation for when local model is unavailable
   * Used for testing/shadow mode
   */
  private async generateFallbackResponse(userPrompt: string): Promise<{ text: string; confidence: number }> {
    // Simple template-based fallback
    const fallbackText = `Based on your question about ${userPrompt.split('\n')[0].slice(0, 50)}..., I recommend consulting with a healthcare professional for personalized medical advice. This response is informational only and should not substitute for professional medical consultation.`;

    return {
      text: fallbackText,
      confidence: 0.5, // Lower confidence for fallback
    };
  }
}
