/**
 * Intent Classifier Module
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntentClassifierService } from './intent-classifier.service';
import { AiModule } from '../../ai/ai.module';
import { MetricsModule } from '../../metrics/metrics.module';

@Module({
  imports: [AiModule, ConfigModule, MetricsModule],
  providers: [IntentClassifierService],
  exports: [IntentClassifierService],
})
export class IntentClassifierModule {}
