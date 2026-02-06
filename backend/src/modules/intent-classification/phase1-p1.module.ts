import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DistillationPipelineService } from './distillation-pipeline.service';
import { CalibrationMetricsService } from './calibration-metrics.service';
import { DriftDetectionService } from './drift-detection.service';

/**
 * Phase 1 Phase 1 (P1) Module: Distillation, Calibration, & Drift Detection
 *
 * This module provides complete infrastructure for:
 * 1. Teacher-student distillation (GPT/Claude → local model)
 * 2. Calibration metrics (ECE, Brier, per-intent evaluation)
 * 3. Drift detection & dashboard
 *
 * All services are file-based for simplicity and don't require database:
 * - Distillation data: /data/distillation/{teacher_outputs,annotations,samples}
 * - Calibration metrics: /data/calibration_metrics
 * - Drift detection: /data/drift_detection/snapshots
 */
@Module({
  imports: [ConfigModule],
  providers: [
    DistillationPipelineService,
    CalibrationMetricsService,
    DriftDetectionService,
  ],
  exports: [
    DistillationPipelineService,
    CalibrationMetricsService,
    DriftDetectionService,
  ],
})
export class Phase1P1Module {}
