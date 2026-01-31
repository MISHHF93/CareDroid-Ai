import { Module } from '@nestjs/common';
import { EmergencyEscalationService } from './emergency-escalation.service';
import { AuditModule } from '../../audit/audit.module';
import { MetricsModule } from '../../metrics/metrics.module';

@Module({
  imports: [AuditModule, MetricsModule],
  providers: [EmergencyEscalationService],
  exports: [EmergencyEscalationService],
})
export class EmergencyEscalationModule {}
