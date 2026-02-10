import { Controller, Post, Body, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthorizationGuard } from '../auth/guards/authorization.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';
import { AnalyticsService } from './services/analytics.service';

interface AnalyticsEventDto {
  eventName?: string;
  event?: string;
  parameters?: Record<string, any>;
  properties?: Record<string, any>;
  timestamp?: number | string;
  sessionId?: string;
  userId?: string;
}

interface AnalyticsPayloadDto {
  events: AnalyticsEventDto[];
  sessionId?: string;
}

interface CrashReportDto {
  id: string;
  error: {
    name: string;
    message: string;
    stack: string[];
  };
  breadcrumbs: string[];
  timestamp: string;
  sessionId: string;
  environment: 'development' | 'staging' | 'production';
}

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  async submitAnalyticsEvents(@Body() payload: AnalyticsPayloadDto): Promise<{ status: string; recorded: number }> {
    const events = payload.events || [];

    const normalizedEvents = events.map((event) => {
      const eventName = event.eventName || event.event || 'unknown_event';
      const parameters = event.parameters || event.properties || {};
      const timestamp = event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString();

      return {
        event: eventName,
        userId: event.userId,
        sessionId: event.sessionId || payload.sessionId || 'unknown',
        properties: parameters,
        timestamp,
      };
    });

    if (normalizedEvents.length > 0) {
      await this.analyticsService.trackEventsBulk(normalizedEvents);
    }

    return { status: 'recorded', recorded: normalizedEvents.length };
  }

  @Get('metrics')
  @UseGuards(AuthGuard('jwt'), AuthorizationGuard)
  @RequirePermission(Permission.VIEW_ANALYTICS)
  async getMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
  ) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.analyticsService.getEventMetrics(start, end, userId);
  }

  @Get('trends')
  @UseGuards(AuthGuard('jwt'), AuthorizationGuard)
  @RequirePermission(Permission.VIEW_ANALYTICS)
  async getTrends(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: 'hour' | 'day',
  ) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return this.analyticsService.getTrends(start, end, granularity || 'day');
  }

  @Get('top-tools')
  @UseGuards(AuthGuard('jwt'), AuthorizationGuard)
  @RequirePermission(Permission.VIEW_ANALYTICS)
  async getTopTools(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.analyticsService.getTopTools(start, end, limit ? parseInt(limit) : 10);
  }

  @Get('funnel')
  @UseGuards(AuthGuard('jwt'), AuthorizationGuard)
  @RequirePermission(Permission.VIEW_ANALYTICS)
  async getFunnel(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const funnelEvents = ['login', 'tool_access', 'result_viewed', 'data_export'];

    return this.analyticsService.getFunnelAnalytics(funnelEvents, start, end);
  }

  @Get('retention')
  @UseGuards(AuthGuard('jwt'), AuthorizationGuard)
  @RequirePermission(Permission.VIEW_ANALYTICS)
  async getRetention(
    @Query('startDate') startDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.analyticsService.getRetentionMetrics(start);
  }

  @Post('crashes')
  async submitCrashReport(@Body() report: CrashReportDto): Promise<{ id: string; status: string }> {
    this.logger.log(`Crash Report ${report.id}: ${report.error.name} - ${report.error.message}`);
    return { id: report.id, status: 'submitted' };
  }
}
