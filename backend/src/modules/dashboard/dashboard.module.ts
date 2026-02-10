import { Module } from '@nestjs/common';
import { PatientModule } from '../patients/patient.module';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SettingsModule } from '../settings/settings.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

/**
 * DashboardModule
 * Provides dashboard functionality including stats, activity feed, alerts,
 * and the SSE stream (includes team:presence, audit:new, analytics:event, settings:sync).
 */
@Module({
  imports: [PatientModule, UsersModule, AuditModule, AnalyticsModule, SettingsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
