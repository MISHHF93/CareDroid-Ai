import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { AIQuery } from './entities/ai-query.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { AuditModule } from '../audit/audit.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [TypeOrmModule.forFeature([AIQuery, Subscription, User]), AuditModule, MetricsModule],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AiModule {}
