/**
 * Phase 3: Local Generation Module
 * 
 * NestJS module for dependency injection of local generation services.
 * Exports all services for use in other modules.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PreCheckClassifier } from './services/pre-check.classifier';
import { LocalGenerationService } from './services/local-generation.service';
import { PostCheckVerifier } from './services/post-check.verifier';
import { GenerationOrchestrator } from './services/generation.orchestrator';

@Module({
  imports: [ConfigModule],
  providers: [
    PreCheckClassifier,
    LocalGenerationService,
    PostCheckVerifier,
    GenerationOrchestrator,
  ],
  exports: [
    PreCheckClassifier,
    LocalGenerationService,
    PostCheckVerifier,
    GenerationOrchestrator,
  ],
})
export class LocalGenerationModule {}
