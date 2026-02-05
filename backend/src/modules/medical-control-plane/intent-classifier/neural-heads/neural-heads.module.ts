/**
 * Neural Heads Module (Phase 2)
 * 
 * Provides task-specific lightweight models for:
 * - Emergency Risk assessment
 * - Tool Invocation routing
 * - Citation Need prediction
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../../../ai/ai.module';
import { EmergencyRiskHeadService } from './emergency-risk.head';
import { ToolInvocationHeadService } from './tool-invocation.head';
import { CitationNeedHeadService } from './citation-need.head';
import { NeuralHeadsOrchestratorService } from './neural-heads.orchestrator';

@Module({
  imports: [AiModule, ConfigModule],
  providers: [
    EmergencyRiskHeadService,
    ToolInvocationHeadService,
    CitationNeedHeadService,
    NeuralHeadsOrchestratorService,
  ],
  exports: [
    EmergencyRiskHeadService,
    ToolInvocationHeadService,
    CitationNeedHeadService,
    NeuralHeadsOrchestratorService,
  ],
})
export class NeuralHeadsModule {}
