/**
 * Neural Heads Orchestrator Service
 * 
 * Coordinates all Phase 2 specialized neural heads:
 * - Emergency Risk Head
 * - Tool Invocation Head  
 * - Citation Need Head
 * 
 * Returns aggregated predictions and recommended actions.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EmergencyRiskHeadService } from './emergency-risk.head';
import { ToolInvocationHeadService } from './tool-invocation.head';
import { CitationNeedHeadService } from './citation-need.head';
import {
  NeuralHeadsResult,
  EmergencyRiskPrediction,
  ToolInvocationPrediction,
  CitationNeedPrediction,
  CitationRequirement,
} from './neural-heads.dto';

@Injectable()
export class NeuralHeadsOrchestratorService {
  private readonly logger = new Logger(NeuralHeadsOrchestratorService.name);

  constructor(
    private readonly emergencyRiskHead: EmergencyRiskHeadService,
    private readonly toolInvocationHead: ToolInvocationHeadService,
    private readonly citationNeedHead: CitationNeedHeadService,
  ) {}

  /**
   * Run all neural heads and aggregate results
   */
  async predictWithAllHeads(
    message: string,
    emergencyKeywords: Array<{ category: string; severity: string }>,
    primaryIntent?: string,
    userRole?: string,
  ): Promise<NeuralHeadsResult> {
    const startMs = Date.now();

    // Run heads in parallel for efficiency
    const [emergencyRisk, toolInvocation, citationNeeds] = await Promise.all([
      this.emergencyRiskHead.predictRiskSeverity(
        message,
        emergencyKeywords,
        userRole,
      ),
      this.toolInvocationHead.predictToolInvocation(message, userRole),
      this.citationNeedHead.predictCitationNeeds(message, primaryIntent, userRole),
    ]);

    const durationMs = Date.now() - startMs;
    this.logger.debug(
      `Neural heads completed in ${durationMs}ms: risk=${emergencyRisk?.severity}, tool=${toolInvocation?.toolId}, citation=${citationNeeds?.requirement}`,
    );

    // Aggregate results
    return this.aggregateHeadResults(
      emergencyRisk,
      toolInvocation,
      citationNeeds,
    );
  }

  /**
   * Aggregate individual head predictions into unified result
   */
  private aggregateHeadResults(
    emergencyRisk: EmergencyRiskPrediction | null,
    toolInvocation: ToolInvocationPrediction | null,
    citationNeeds: CitationNeedPrediction | null,
  ): NeuralHeadsResult {
    // Calculate aggregated risk score
    const aggregatedRiskScore = this.calculateAggregatedRisk(
      emergencyRisk,
      toolInvocation,
      citationNeeds,
    );

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(
      emergencyRisk,
      toolInvocation,
      citationNeeds,
    );

    // Calculate overall confidence (average of non-null predictions)
    const confidences = [
      emergencyRisk?.confidence,
      toolInvocation?.confidence,
      citationNeeds?.confidence,
    ].filter(c => c !== undefined) as number[];

    const overallConfidence =
      confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0.5;

    return {
      emergencyRisk,
      toolInvocation,
      citationNeeds,
      aggregatedRiskScore,
      recommendedActions,
      overallConfidence,
    };
  }

  /**
   * Calculate combined risk score from all heads
   * Higher = more risky
   */
  private calculateAggregatedRisk(
    emergencyRisk: EmergencyRiskPrediction | null,
    toolInvocation: ToolInvocationPrediction | null,
    citationNeeds: CitationNeedPrediction | null,
  ): number {
    let riskScore = 0;

    // Emergency risk contribution (highest weight)
    if (emergencyRisk) {
      const riskLevel = {
        critical: 1.0,
        urgent: 0.75,
        moderate: 0.4,
        low: 0.1,
      }[emergencyRisk.severity];
      riskScore += riskLevel * emergencyRisk.confidence * 0.6; // 60% weight
    }

    // Citation needs contribution (medium weight)
    if (citationNeeds) {
      const citationLevel = {
        mandatory_clinical: 0.8,
        required: 0.5,
        optional: 0.2,
        not_required: 0.0,
      }[citationNeeds.requirement];
      riskScore += citationLevel * citationNeeds.confidence * 0.3; // 30% weight
    }

    // Tool complexity contribution (lower weight)
    if (toolInvocation) {
      // Complex tools (calculators) slightly increase risk due to dependency
      const complexTools = [
        'sofa-calculator',
        'apache2-calculator',
        'curb65-calculator',
      ];
      const isComplex = complexTools.includes(toolInvocation.toolId) ? 0.1 : 0;
      riskScore += isComplex * toolInvocation.confidence * 0.1; // 10% weight
    }

    return Math.min(1.0, riskScore); // Cap at 1.0
  }

  /**
   * Generate recommended actions based on predictions
   */
  private generateRecommendedActions(
    emergencyRisk: EmergencyRiskPrediction | null,
    toolInvocation: ToolInvocationPrediction | null,
    citationNeeds: CitationNeedPrediction | null,
  ): Array<{
    action: 'escalate' | 'ground_response' | 'suggest_tool' | 'flag_for_review';
    priority: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
  }> {
    const actions: Array<{
      action: 'escalate' | 'ground_response' | 'suggest_tool' | 'flag_for_review';
      priority: 'low' | 'medium' | 'high' | 'critical';
      reason: string;
    }> = [];

    // Emergency escalation
    if (emergencyRisk) {
      if (
        emergencyRisk.severity === 'critical' &&
        emergencyRisk.confidence > 0.8
      ) {
        actions.push({
          action: 'escalate',
          priority: 'critical',
          reason: `Critical risk detected: ${emergencyRisk.reasoning}`,
        });
      } else if (
        emergencyRisk.severity === 'urgent' &&
        emergencyRisk.confidence > 0.75
      ) {
        actions.push({
          action: 'escalate',
          priority: 'high',
          reason: `Urgent risk: ${emergencyRisk.riskFactors.join(', ')}`,
        });
      } else if (
        emergencyRisk.severity === 'moderate' &&
        emergencyRisk.confidence > 0.7
      ) {
        actions.push({
          action: 'flag_for_review',
          priority: 'medium',
          reason: `Moderate risk detected: ${emergencyRisk.reasoning}`,
        });
      }
    }

    // Tool suggestion
    if (toolInvocation && toolInvocation.confidence > 0.7) {
      actions.push({
        action: 'suggest_tool',
        priority: toolInvocation.confidence > 0.85 ? 'high' : 'medium',
        reason: `${toolInvocation.toolName} recommended (confidence: ${(toolInvocation.confidence * 100).toFixed(0)}%)`,
      });
    }

    // Citation/grounding requirement
    if (citationNeeds) {
      if (citationNeeds.requirement === CitationRequirement.MANDATORY_CLINICAL) {
        actions.push({
          action: 'ground_response',
          priority: 'critical',
          reason: `Clinical evidence required: ${citationNeeds.requiresGrounding.map(r => r.type).join(', ')}`,
        });
      } else if (citationNeeds.requirement === CitationRequirement.REQUIRED) {
        actions.push({
          action: 'ground_response',
          priority: 'high',
          reason: `Medical claim requires evidence grounding`,
        });
      } else if (
        citationNeeds.requirement === CitationRequirement.OPTIONAL &&
        citationNeeds.confidence > 0.75
      ) {
        actions.push({
          action: 'ground_response',
          priority: 'low',
          reason: `Optional: Cite supporting evidence if available`,
        });
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    actions.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );

    return actions;
  }
}
