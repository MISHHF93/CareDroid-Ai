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
import { Observable, Subject, merge, interval } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { DashboardService } from './dashboard.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { SettingsService } from '../settings/settings.service';
import {
  DashboardStatsDto,
  ActivityDto,
  AlertDto,
  ToolAccessDto,
  WorkloadDto,
  MARMedicationDto,
  RosterEntryDto,
  BedBoardDto,
  LabEventDto,
  CDSReminderDto,
  ToggleTaskDto,
  PlaceOrderDto,
} from './dto/dashboard.dto';

/**
 * DashboardController
 * Handles all dashboard-related API endpoints
 */
@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly analyticsService: AnalyticsService,
    private readonly settingsService: SettingsService,
  ) {}

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
   * Get clinician workload
   */
  @Get('workload')
  @ApiOperation({ summary: 'Get current workload tasks and shift info' })
  @ApiResponse({ status: 200, type: WorkloadDto })
  async getWorkload(): Promise<WorkloadDto> {
    return this.dashboardService.getWorkload();
  }

  /**
   * Toggle a workload task
   */
  @Post('workload/toggle')
  @ApiOperation({ summary: 'Toggle a workload task done/undone' })
  @ApiResponse({ status: 200 })
  async toggleTask(@Body() dto: ToggleTaskDto): Promise<{ success: boolean }> {
    const success = await this.dashboardService.toggleTask(dto.taskId);
    return { success };
  }

  /**
   * Get MAR preview
   */
  @Get('mar-preview')
  @ApiOperation({ summary: 'Get medication administration record preview (next 2h)' })
  @ApiResponse({ status: 200, type: [MARMedicationDto] })
  async getMARPreview(): Promise<{ medications: MARMedicationDto[] }> {
    const medications = await this.dashboardService.getMARPreview();
    return { medications };
  }

  /**
   * Get on-call roster
   */
  @Get('on-call')
  @ApiOperation({ summary: 'Get on-call roster' })
  @ApiResponse({ status: 200, type: [RosterEntryDto] })
  async getOnCallRoster(): Promise<{ roster: RosterEntryDto[] }> {
    const roster = await this.dashboardService.getOnCallRoster();
    return { roster };
  }

  /**
   * Get bed board
   */
  @Get('beds')
  @ApiOperation({ summary: 'Get bed board / census data' })
  @ApiResponse({ status: 200, type: BedBoardDto })
  async getBedBoard(): Promise<BedBoardDto> {
    return this.dashboardService.getBedBoard();
  }

  /**
   * Get lab timeline
   */
  @Get('lab-timeline')
  @ApiOperation({ summary: 'Get lab results timeline (last 12h)' })
  @ApiResponse({ status: 200, type: [LabEventDto] })
  async getLabTimeline(): Promise<{ events: LabEventDto[] }> {
    const events = await this.dashboardService.getLabTimeline();
    return { events };
  }

  /**
   * Get CDS reminders
   */
  @Get('cds-reminders')
  @ApiOperation({ summary: 'Get clinical decision support reminders' })
  @ApiResponse({ status: 200, type: [CDSReminderDto] })
  async getCDSReminders(): Promise<{ reminders: CDSReminderDto[] }> {
    const reminders = await this.dashboardService.getCDSReminders();
    return { reminders };
  }

  /**
   * Place a quick order
   */
  @Post('orders')
  @ApiOperation({ summary: 'Place a quick order' })
  @ApiResponse({ status: 200 })
  async placeOrder(@Body() dto: PlaceOrderDto): Promise<{ success: boolean; orderRef: string }> {
    return this.dashboardService.placeOrder(dto.patientId, dto.orderId, dto.label);
  }

  /**
   * Server-Sent Events stream for real-time updates.
   *
   * Push-based: events are emitted instantly when data changes
   * (e.g. new activity, new alert, alert acknowledged, task toggled).
   * A 60-second heartbeat keeps the connection alive.
   */
  @Sse('stream')
  @ApiOperation({ summary: 'Subscribe to real-time dashboard updates' })
  streamUpdates(): Observable<MessageEvent> {
    this.logger.log('Client connected to SSE stream');

    const subject = new Subject<MessageEvent>();
    const emitter = this.dashboardService.events;
    const teamEmitter = this.usersService.events;

    // Audit events from AuditService
    const auditEmitter = this.auditService.events;
    const onAuditNew = (data: any) => {
      subject.next({
        type: 'audit:new',
        data: JSON.stringify(data),
      } as MessageEvent);
    };
    auditEmitter.on('audit:new', onAuditNew);

    // Analytics events from AnalyticsService
    const analyticsEmitter = this.analyticsService.events;
    const onAnalyticsEvent = (data: any) => {
      subject.next({
        type: 'analytics:event',
        data: JSON.stringify(data),
      } as MessageEvent);
    };
    analyticsEmitter.on('analytics:event', onAnalyticsEvent);

    // Settings sync events from SettingsService
    const settingsEmitter = this.settingsService.events;
    const onSettingsSync = (data: any) => {
      subject.next({
        type: 'settings:sync',
        data: JSON.stringify(data),
      } as MessageEvent);
    };
    settingsEmitter.on('settings:sync', onSettingsSync);

    // === Instant push handlers ===

    const onActivity = (activity: ActivityDto) => {
      subject.next({
        type: 'activity',
        data: JSON.stringify(activity),
      } as MessageEvent);
    };

    const onAlert = (alert: AlertDto) => {
      subject.next({
        type: 'alert',
        data: JSON.stringify(alert),
      } as MessageEvent);
    };

    const onAlertAcknowledged = (alert: AlertDto) => {
      subject.next({
        type: 'alert-acknowledged',
        data: JSON.stringify(alert),
      } as MessageEvent);
    };

    const onStatsChanged = async () => {
      try {
        const stats = await this.dashboardService.getStats();
        const alerts = await this.dashboardService.getActiveAlerts();
        subject.next({
          type: 'stats',
          data: JSON.stringify({ stats, activeAlertCount: alerts.length }),
        } as MessageEvent);
      } catch (err) {
        this.logger.error('Failed to push stats update', err);
      }
    };

    const onWorkloadChanged = async () => {
      try {
        const workload = await this.dashboardService.getWorkload();
        subject.next({
          type: 'workload',
          data: JSON.stringify(workload),
        } as MessageEvent);
      } catch (err) {
        this.logger.error('Failed to push workload update', err);
      }
    };

    // Subscribe to service events
    emitter.on('activity', onActivity);
    emitter.on('alert', onAlert);
    emitter.on('alert-acknowledged', onAlertAcknowledged);
    emitter.on('stats-changed', onStatsChanged);
    emitter.on('workload-changed', onWorkloadChanged);

    // Team presence events from UsersService
    const onTeamPresence = (data: any) => {
      subject.next({
        type: 'team:presence',
        data: JSON.stringify(data),
      } as MessageEvent);
    };
    teamEmitter.on('team:presence', onTeamPresence);

    // 60-second heartbeat to keep the connection alive
    const heartbeat$ = interval(60000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: JSON.stringify({ time: new Date().toISOString() }),
      } as MessageEvent)),
    );

    // Merge the push subject with the heartbeat
    return merge(subject.asObservable(), heartbeat$).pipe(
      finalize(() => {
        // Clean up listeners when client disconnects
        this.logger.log('Client disconnected from SSE stream');
        emitter.off('activity', onActivity);
        emitter.off('alert', onAlert);
        emitter.off('alert-acknowledged', onAlertAcknowledged);
        emitter.off('stats-changed', onStatsChanged);
        emitter.off('workload-changed', onWorkloadChanged);
        teamEmitter.off('team:presence', onTeamPresence);
        auditEmitter.off('audit:new', onAuditNew);
        analyticsEmitter.off('analytics:event', onAnalyticsEvent);
        settingsEmitter.off('settings:sync', onSettingsSync);
        subject.complete();
      }),
    );
  }
}
