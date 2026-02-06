import { Module } from '@nestjs/common';
import { PatientModule } from '../patients/patient.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

/**
 * DashboardModule
 * Provides dashboard functionality including stats, activity feed, alerts
 */
@Module({
  imports: [PatientModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
