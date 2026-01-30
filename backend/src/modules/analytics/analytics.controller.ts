import { Controller, Post, Body } from '@nestjs/common';

interface AnalyticsEventDto {
  eventName: string;
  parameters?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface AnalyticsPayloadDto {
  events: AnalyticsEventDto[];
  sessionId: string;
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

@Controller()
export class AnalyticsController {
  @Post('analytics/events')
  async submitAnalyticsEvents(@Body() payload: AnalyticsPayloadDto): Promise<{ status: string }> {
    console.log(`📊 Received ${payload.events.length} analytics events from session ${payload.sessionId}`);

    payload.events.forEach((event) => {
      console.log(`  [${event.eventName}]`, event.parameters);
    });

    return { status: 'recorded' };
  }

  @Post('crashes')
  async submitCrashReport(@Body() report: CrashReportDto): Promise<{ id: string; status: string }> {
    console.log(`🚨 Crash Report ${report.id}`);
    console.log(`   Error: ${report.error.name} - ${report.error.message}`);
    console.log(`   Session: ${report.sessionId}`);
    console.log(`   Environment: ${report.environment}`);

    if (report.breadcrumbs.length > 0) {
      console.log(`   Breadcrumbs:`);
      report.breadcrumbs.slice(-5).forEach((crumb) => {
        console.log(`     - ${crumb}`);
      });
    }

    return {
      id: report.id,
      status: 'submitted',
    };
  }

  @Post('health')
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    return {
      status: 'healthy',
      timestamp: Date.now(),
    };
  }
}
