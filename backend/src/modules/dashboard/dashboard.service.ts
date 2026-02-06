import { Injectable, Logger } from '@nestjs/common';
import { PatientService } from '../patients/patient.service';
import {
  DashboardStatsDto,
  ActivityDto,
  AlertDto,
  AlertSeverity,
  ActivityType,
} from './dto/dashboard.dto';

/**
 * DashboardService
 * Handles dashboard data aggregation and business logic
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private mockActivities: ActivityDto[] = [];
  private mockAlerts: AlertDto[] = [];

  constructor(private readonly patientService: PatientService) {
    // Initialize with some mock data
    this.initializeMockData();
  }

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStatsDto> {
    this.logger.log('Fetching dashboard stats');

    // In production, this would query the database
    return {
      criticalPatients: 5,
      activePatients: 24,
      stablePatients: 12,
      pendingLabs: 8,
      trends: {
        criticalPatients: { value: 2, direction: 'up' },
        activePatients: { value: -1, direction: 'down' },
      },
    };
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityDto[]> {
    this.logger.log(`Fetching recent activity (limit: ${limit})`);

    // Return most recent activities
    return this.mockActivities.slice(0, limit);
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<AlertDto[]> {
    this.logger.log('Fetching active alerts');

    // Filter out acknowledged alerts
    return this.mockAlerts.filter((alert) => !alert.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    this.logger.log(`Acknowledging alert: ${alertId}`);

    const alert = this.mockAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }

    return false;
  }

  /**
   * Get critical patients
   */
  async getCriticalPatients(): Promise<any[]> {
    this.logger.log('Fetching critical patients');

    return this.patientService.getCriticalPatients(10);
  }

  /**
   * Track tool access
   */
  async trackToolAccess(toolId: string, userId?: string): Promise<void> {
    this.logger.log(`Tool accessed: ${toolId} by user: ${userId || 'unknown'}`);
    // In production, this would log to database/analytics
  }

  /**
   * Add new activity (for real-time updates)
   */
  addActivity(activity: ActivityDto): void {
    this.mockActivities.unshift(activity);
    // Keep only last 50 activities
    if (this.mockActivities.length > 50) {
      this.mockActivities = this.mockActivities.slice(0, 50);
    }
  }

  /**
   * Add new alert (for real-time updates)
   */
  addAlert(alert: AlertDto): void {
    this.mockAlerts.unshift(alert);
  }

  /**
   * Initialize mock data
   */
  private initializeMockData(): void {
    const now = new Date();

    // Initialize mock activities
    this.mockActivities = [
      {
        id: '1',
        type: ActivityType.LAB,
        message: 'Lab results received for complete blood count',
        patientName: 'Sarah Johnson',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
      },
      {
        id: '2',
        type: ActivityType.VITAL,
        message: 'Blood pressure reading recorded',
        patientName: 'Michael Chen',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 min ago
        severity: 'high',
      },
      {
        id: '3',
        type: ActivityType.MEDICATION,
        message: 'Medication administered',
        patientName: 'Emily Davis',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
      },
      {
        id: '4',
        type: ActivityType.ADMISSION,
        message: 'New patient admitted to ICU',
        patientName: 'Robert Wilson',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 min ago
      },
      {
        id: '5',
        type: ActivityType.CONSULT,
        message: 'Cardiology consult requested',
        patientName: 'Maria Garcia',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      },
    ];

    // Initialize mock alerts
    this.mockAlerts = [
      {
        id: 'alert-1',
        severity: AlertSeverity.CRITICAL,
        message: 'Sepsis criteria met - immediate attention required',
        patientName: 'Sarah Johnson',
        timestamp: new Date(now.getTime() - 10 * 60 * 1000),
        acknowledged: false,
        location: 'Room 312A',
      },
      {
        id: 'alert-2',
        severity: AlertSeverity.HIGH,
        message: 'Lab values critical: Potassium 6.2 mEq/L',
        patientName: 'Michael Chen',
        timestamp: new Date(now.getTime() - 25 * 60 * 1000),
        acknowledged: false,
        location: 'Room 205B',
      },
      {
        id: 'alert-3',
        severity: AlertSeverity.MEDIUM,
        message: 'Medication due in 15 minutes',
        patientName: 'Emily Davis',
        timestamp: new Date(now.getTime() - 40 * 60 * 1000),
        acknowledged: false,
        location: 'Room 118C',
      },
    ];
  }
}
