/**
 * Phase 3: Generation Orchestrator (Safety Sandwich)
 * 
 * Orchestrates the complete controlled local generation system:
 * 1. Pre-check: Is this query safe to answer locally?
 * 2. Generation: Generate response using local model + RAG
 * 3. Post-check: Verify response is safe and high quality
 * 4. Action: Decide whether to serve local, escalate to API, or flag
 * 
 * Implements comprehensive safety sandwich with fallback to external API.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GenerationOrchestrationResult,
  LocalGenerationRequest,
  SafeSandwichConfig,
  EscalationEvent,
} from '../dto/local-generation.dto';
import { PreCheckClassifier } from './pre-check.classifier';
import { LocalGenerationService } from './local-generation.service';
import { PostCheckVerifier } from './post-check.verifier';

@Injectable()
export class GenerationOrchestrator {
  private readonly logger = new Logger(GenerationOrchestrator.name);
  private config: SafeSandwichConfig;

  constructor(
    private preCheckClassifier: PreCheckClassifier,
    private localGenerationService: LocalGenerationService,
    private postCheckVerifier: PostCheckVerifier,
    private configService: ConfigService,
  ) {
    this.loadConfig();
  }

  /**
   * Load configuration from ConfigService
   */
  private loadConfig(): void {
    this.config = {
      enabled: this.configService.get('safeSandwich.enabled', false), // Disabled by default (shadow mode)
      shadowMode: this.configService.get('safeSandwich.shadowMode', true), // Shadow mode by default
      preCheck: {
        enabled: this.configService.get('safeSandwich.preCheck.enabled', true),
        strictMode: this.configService.get('safeSandwich.preCheck.strictMode', false),
        confidenceThreshold: this.configService.get('safeSandwich.preCheck.confidenceThreshold', 0.75),
      },
      generation: {
        enabled: this.configService.get('safeSandwich.generation.enabled', true),
        modelId: this.configService.get('safeSandwich.generation.modelId', 'phi-2-7b-medical'),
        maxTokens: this.configService.get('safeSandwich.generation.maxTokens', 512),
        temperature: this.configService.get('safeSandwich.generation.temperature', 0.7),
        topP: this.configService.get('safeSandwich.generation.topP', 0.95),
        includeRag: this.configService.get('safeSandwich.generation.includeRag', true),
      },
      postCheck: {
        enabled: this.configService.get('safeSandwich.postCheck.enabled', true),
        strictMode: this.configService.get('safeSandwich.postCheck.strictMode', false),
        qualityThreshold: this.configService.get('safeSandwich.postCheck.qualityThreshold', 0.6),
      },
      orchestrator: {
        enableFallback: this.configService.get('safeSandwich.orchestrator.enableFallback', true),
        fallbackToApiOnAnyFailure: this.configService.get('safeSandwich.orchestrator.fallbackToApiOnAnyFailure', true),
        escalationThreshold: this.configService.get('safeSandwich.orchestrator.escalationThreshold', 0.7),
      },
    };

    this.logger.debug(`Safety Sandwich Config Loaded:`, this.config);
  }

  /**
   * Main entry point: orchestrate complete generation flow
   */
  async generateWithSafetySandwich(
    request: LocalGenerationRequest,
    ragDocuments?: Array<{ source: string; content: string; relevanceScore: number }>,
  ): Promise<GenerationOrchestrationResult> {
    const startTime = Date.now();
    const traceId = this.generateTraceId();

    this.logger.log(`[${traceId}] Starting generation orchestration for query: ${request.query.slice(0, 50)}...`);

    try {
      // If disabled, return clear indication
      if (!this.config.enabled) {
        this.logger.log(`[${traceId}] Local generation disabled in config`);
        return {
          query: request.query,
          preCheck: {
            isSafeForLocalGeneration: false,
            confidence: 0,
            reason: 'Local generation feature is currently disabled',
            riskFactors: [],
            method: 'fallback',
            predictedAt: new Date(),
          },
          proceededToGeneration: false,
          finalDecision: 'escalate_to_api',
          success: false,
          selectionReason: 'Feature disabled',
          totalDuration: Date.now() - startTime,
          metadata: {
            preCheckDuration: 0,
            fallbackUsed: true,
            fallbackReason: 'Local generation disabled',
          },
          decidedAt: new Date(),
        };
      }

      // Phase 1: Pre-Check
      this.logger.debug(`[${traceId}] Phase 1: Running pre-check...`);
      const preCheckStart = Date.now();
      const preCheck = await this.preCheckClassifier.assessQuery(
        request.query,
        request.intendedIntent,
        request.riskLevel,
        undefined, // requiresCitation not available at pre-check time
      );
      const preCheckDuration = Date.now() - preCheckStart;

      if (!preCheck.isSafeForLocalGeneration) {
        this.logger.warn(
          `[${traceId}] Pre-check failed: ${preCheck.reason}`,
        );

        // Log escalation event
        await this.logEscalationEvent({
          query: request.query,
          intent: request.intendedIntent || 'unknown',
          preCheckResult: {
            isSafeForLocalGeneration: false,
            reason: preCheck.reason,
          },
          reason: 'pre_check_failed',
          description: preCheck.reason,
          escalatedAt: new Date(),
          escalationSuccessful: true,
          traceId,
        });

        return {
          query: request.query,
          preCheck,
          proceededToGeneration: false,
          finalDecision: 'escalate_to_api',
          success: true,
          selectionReason: `Pre-check failed: ${preCheck.reason}`,
          totalDuration: Date.now() - startTime,
          metadata: {
            preCheckDuration,
            fallbackUsed: true,
            fallbackReason: 'Pre-check failed',
          },
          decidedAt: new Date(),
        };
      }

      // Phase 2: Local Generation
      this.logger.debug(`[${traceId}] Phase 2: Generating response...`);
      const generationStart = Date.now();

      let generation = null;
      try {
        generation = await this.localGenerationService.generate(request, ragDocuments);
        this.logger.debug(
          `[${traceId}] Generation succeeded: confidence=${generation.confidence}`,
        );
      } catch (error) {
        const err = error as any;
        this.logger.error(`[${traceId}] Generation failed: ${err.message}`);

        await this.logEscalationEvent({
          query: request.query,
          intent: request.intendedIntent || 'unknown',
          reason: 'generation_failed',
          description: err.message,
          escalatedAt: new Date(),
          escalationSuccessful: true,
          traceId,
        });

        return {
          query: request.query,
          preCheck,
          proceededToGeneration: true,
          finalDecision: 'escalate_to_api',
          success: true,
          selectionReason: `Generation failed: ${err.message}`,
          totalDuration: Date.now() - startTime,
          metadata: {
            preCheckDuration,
            generationDuration: Date.now() - generationStart,
            fallbackUsed: true,
            fallbackReason: err.message,
          },
          decidedAt: new Date(),
        };
      }

      const generationDuration = Date.now() - generationStart;

      // Phase 3: Post-Check
      this.logger.debug(`[${traceId}] Phase 3: Verifying response...`);
      const postCheckStart = Date.now();
      const postCheck = await this.postCheckVerifier.verify(
        generation.responseText,
        request.query,
        {
          intent: request.intendedIntent,
          riskLevel: request.riskLevel,
          requiresCitation: undefined, // Citation requirement not available at post-check time
          modelConfidence: generation.confidence,
        },
      );
      const postCheckDuration = Date.now() - postCheckStart;

      // Phase 4: Decision Logic
      this.logger.debug(
        `[${traceId}] Phase 4: Making final decision... postCheck.recommendedAction=${postCheck.recommendedAction}`,
      );

      let finalDecision: 'serve_local' | 'escalate_to_api' | 'use_fallback' | 'flag_for_human' = 'serve_local';
      let responseText = generation.responseText;
      let selectionReason = 'Response passed all checks';

      // Check post-check result
      if (postCheck.recommendedAction === 'escalate' || postCheck.recommendedAction === 'flag_for_review') {
        finalDecision = this.config.orchestrator.fallbackToApiOnAnyFailure ? 'escalate_to_api' : 'flag_for_human';
        selectionReason = `Post-check recommendation: ${postCheck.recommendedAction}`;

        this.logger.warn(
          `[${traceId}] Post-check recommended ${postCheck.recommendedAction}; escalating`,
        );

        await this.logEscalationEvent({
          query: request.query,
          intent: request.intendedIntent || 'unknown',
          generationResult: {
            confidence: generation.confidence,
            generatedAt: generation.generatedAt,
          },
          postCheckResult: {
            isVerified: postCheck.isVerified,
            recommendedAction: postCheck.recommendedAction,
          },
          reason: 'post_check_failed',
          description: `Quality score: ${postCheck.qualityScore}, Issues: ${postCheck.safety.issues.length + postCheck.quality.issues.length}`,
          escalatedAt: new Date(),
          escalationSuccessful: true,
          traceId,
        });
      }

      // Check risk aggregation
      if (request.riskLevel && ['critical', 'high'].includes(request.riskLevel)) {
        if (postCheck.qualityScore < 0.7) {
          finalDecision = 'escalate_to_api';
          selectionReason = `High/critical risk with low quality score (${postCheck.qualityScore})`;
          this.logger.warn(`[${traceId}] High risk + low quality → escalating`);
        }
      }

      // Check shadow mode
      if (this.config.shadowMode) {
        finalDecision = 'flag_for_human'; // In shadow mode, never serve; always flag for evaluation
        selectionReason = 'Shadow mode: Generated but not served (for evaluation)';
        this.logger.debug(`[${traceId}] Shadow mode: Generated but flagging for evaluation`);
      }

      const result: GenerationOrchestrationResult = {
        query: request.query,
        preCheck,
        proceededToGeneration: true,
        generation,
        postCheck,
        finalDecision,
        responseText: finalDecision === 'serve_local' ? responseText : undefined,
        success: true,
        selectionReason,
        totalDuration: Date.now() - startTime,
        metadata: {
          preCheckDuration,
          generationDuration,
          postCheckDuration,
          fallbackUsed: finalDecision !== 'serve_local',
          fallbackReason: finalDecision !== 'serve_local' ? selectionReason : undefined,
        },
        decidedAt: new Date(),
      };

      this.logger.log(
        `[${traceId}] Orchestration complete: ${finalDecision} (quality=${postCheck.qualityScore}, duration=${result.totalDuration}ms)`,
      );

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[${traceId}] Orchestration error: ${err?.message || 'unknown'}`, err?.stack);

      // Fail-safe: escalate on any error
      return {
        query: request.query,
        preCheck: {
          isSafeForLocalGeneration: false,
          confidence: 0,
          reason: `Orchestration error: ${err?.message || 'unknown'}`,
          riskFactors: [{
            factor: 'orchestration_error',
            severity: 'critical',
            reason: err?.message || 'unknown',
          }],
          method: 'fallback',
          predictedAt: new Date(),
        },
        proceededToGeneration: false,
        finalDecision: 'escalate_to_api',
        success: false,
        selectionReason: `System error: ${err?.message || 'unknown error'}`,
        totalDuration: Date.now() - startTime,
        metadata: {
          preCheckDuration: 0,
          fallbackUsed: true,
          fallbackReason: err?.message || 'unknown',
        },
        decidedAt: new Date(),
      };
    }
  }

  /**
   * Log escalation event for monitoring/audit
   */
  private async logEscalationEvent(event: EscalationEvent): Promise<void> {
    // In production, this would log to a persistent store
    this.logger.warn(`ESCALATION_EVENT [${event.traceId}]: ${event.reason} - ${event.description}`);

    // TODO: Integrate with audit logging system
  }

  /**
   * Generate trace ID for request
   */
  private generateTraceId(): string {
    return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
