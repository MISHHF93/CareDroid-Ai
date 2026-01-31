import { Controller, Get, Response } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Response as ExpressResponse } from 'express';

/**
 * Metrics Controller
 * Exposes Prometheus metrics endpoint at GET /metrics
 * Compatible with Prometheus scraper
 */

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * GET /metrics
   * Returns all collected metrics in Prometheus text exposition format
   */
  @Get()
  getMetrics(@Response() res: ExpressResponse): void {
    const metrics = this.metricsService.getMetricsAsString();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics);
  }
}
