import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { NluMetricsService } from './nlu-metrics.service';
import { ToolMetricsService } from './tool-metrics.service';

/**
 * Metrics Module
 * Provides Prometheus metrics collection and exposure
 * Global module to allow injection of MetricsService into any service
 */

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, NluMetricsService, ToolMetricsService],
  exports: [MetricsService, NluMetricsService, ToolMetricsService],
})
export class MetricsModule {}
