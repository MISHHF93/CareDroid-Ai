/**
 * Intent Classifier Module
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntentClassifierService } from './intent-classifier.service';
import { AiModule } from '../../ai/ai.module';

@Module({
  imports: [AiModule, ConfigModule],
  providers: [IntentClassifierService],
  exports: [IntentClassifierService],
})
export class IntentClassifierModule {}
