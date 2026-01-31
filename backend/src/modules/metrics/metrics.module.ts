import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

/**
 * Metrics Module
 * Provides Prometheus metrics collection and exposure
 * Global module to allow injection of MetricsService into any service
 */

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
