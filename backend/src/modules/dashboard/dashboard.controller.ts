import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Sse,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardService } from './dashboard.service';
import {
  DashboardStatsDto,
  ActivityDto,
  AlertDto,
  ToolAccessDto,
  ActivityType,
  AlertSeverity,
} from './dto/dashboard.dto';

/**
 * DashboardController
 * Handles all dashboard-related API endpoints
 */
@ApiTags('dashboard')
@Controller('api/dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get dashboard statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats();
  }

  /**
   * Get recent activity
   */
  @Get('activity')
  @ApiOperation({ summary: 'Get recent activity feed' })
  @ApiResponse({ status: 200, type: [ActivityDto] })
  async getRecentActivity(
    @Query('limit') limit?: number,
  ): Promise<{ activities: ActivityDto[] }> {
    const activities = await this.dashboardService.getRecentActivity(
      limit || 10,
    );
    return { activities };
  }

  /**
   * Get active alerts
   */
  @Get('alerts')
  @ApiOperation({ summary: 'Get active alerts' })
  @ApiResponse({ status: 200, type: [AlertDto] })
  async getActiveAlerts(): Promise<{ alerts: AlertDto[] }> {
    const alerts = await this.dashboardService.getActiveAlerts();
    return { alerts };
  }

  /**
   * Acknowledge an alert
   */
  @Post('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200 })
  async acknowledgeAlert(@Param('id') alertId: string): Promise<{ success: boolean }> {
    const success = await this.dashboardService.acknowledgeAlert(alertId);
    return { success };
  }

  /**
   * Get critical patients
   */
  @Get('patients/critical')
  @ApiOperation({ summary: 'Get critical patients' })
  @ApiResponse({ status: 200 })
  async getCriticalPatients(): Promise<{ patients: any[] }> {
    const patients = await this.dashboardService.getCriticalPatients();
    return { patients };
  }

  /**
   * Track tool access
   */
  @Post('tools/access')
  @ApiOperation({ summary: 'Track tool access for analytics' })
  @ApiResponse({ status: 200 })
  async trackToolAccess(@Body() dto: ToolAccessDto): Promise<{ success: boolean }> {
    await this.dashboardService.trackToolAccess(dto.toolId);
    return { success: true };
  }

  /**
   * Server-Sent Events stream for real-time updates
   */
  @Sse('stream')
  @ApiOperation({ summary: 'Subscribe to real-time dashboard updates' })
  streamUpdates(): Observable<MessageEvent> {
    this.logger.log('Client connected to SSE stream');

    return interval(30000).pipe(
      map((index) => {
        // Generate random activity every 30 seconds
        const activityTypes = Object.values(ActivityType);
        const patients = [
          'Sarah Johnson',
          'Michael Chen',
          'Emily Davis',
          'Robert Wilson',
          'Maria Garcia',
        ];
        const messages = {
          [ActivityType.LAB]: 'New lab results available',
          [ActivityType.MEDICATION]: 'Medication administered',
          [ActivityType.VITAL]: 'Vitals recorded',
          [ActivityType.ADMISSION]: 'Patient admitted',
          [ActivityType.PROCEDURE]: 'Procedure completed',
          [ActivityType.NOTE]: 'Clinical note added',
        };

        const randomType =
          activityTypes[Math.floor(Math.random() * activityTypes.length)];
        const randomPatient =
          patients[Math.floor(Math.random() * patients.length)];

        const activity: ActivityDto = {
          id: `activity-${Date.now()}`,
          type: randomType,
          message: messages[randomType] || 'Activity recorded',
          patientName: randomPatient,
          timestamp: new Date(),
        };

        // Add to service for persistence
        this.dashboardService.addActivity(activity);

        // Occasionally generate alerts
        if (Math.random() < 0.3) {
          // 30% chance
          const alertMessages = [
            'Vital signs outside normal range',
            'Lab values require attention',
            'Medication due soon',
            'Patient deterioration detected',
          ];
          const severities = Object.values(AlertSeverity);

          const alert: AlertDto = {
            id: `alert-${Date.now()}`,
            severity:
              severities[Math.floor(Math.random() * severities.length)],
            message:
              alertMessages[Math.floor(Math.random() * alertMessages.length)],
            patientName: randomPatient,
            timestamp: new Date(),
            acknowledged: false,
          };

          // Add to service
          this.dashboardService.addAlert(alert);

          // Return alert event
          return {
            type: 'alert',
            data: JSON.stringify(alert),
          } as MessageEvent;
        }

        // Return activity event
        return {
          type: 'activity',
          data: JSON.stringify(activity),
        } as MessageEvent;
      }),
    );
  }
}
