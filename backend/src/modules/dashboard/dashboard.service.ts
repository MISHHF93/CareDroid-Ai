import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { PatientService } from '../patients/patient.service';
import {
  DashboardStatsDto,
  ActivityDto,
  AlertDto,
  AlertSeverity,
  ActivityType,
  WorkloadDto,
  MARMedicationDto,
  RosterEntryDto,
  BedBoardDto,
  BedStatus,
  LabEventDto,
  CDSReminderDto,
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
  private workloadTasks = [];
  private orderLog = [];

  /**
   * EventEmitter for real-time push notifications.
   * Events: 'activity', 'alert', 'stats', 'patients', 'workload'
   * The SSE controller subscribes to this to push updates instantly.
   */
  public readonly events = new EventEmitter();

  /** Handle for the automated clinical event simulator */
  private simulatorInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly patientService: PatientService) {
    this.initializeMockData();
    this.initializeWorkloadTasks();
    this.startClinicalSimulator();
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
      sparklines: {
        criticalPatients: [3, 2, 4, 3, 5, 4, 5],
        activePatients: [18, 20, 19, 22, 21, 23, 24],
        pendingLabs: [8, 5, 12, 9, 7, 11, 8],
        stablePatients: [12, 13, 11, 14, 15, 14, 12],
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
      // Push instant update
      this.events.emit('alert-acknowledged', alert);
      this.events.emit('stats-changed');
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
  }

  /**
   * Get workload tasks
   */
  async getWorkload(): Promise<WorkloadDto> {
    this.logger.log('Fetching workload');
    return {
      tasks: this.workloadTasks as any,
      shiftEnd: new Date(Date.now() + 3 * 3600000 + 22 * 60000).toISOString(),
    };
  }

  /**
   * Toggle a workload task
   */
  async toggleTask(taskId: string): Promise<boolean> {
    const task = this.workloadTasks.find((t: any) => t.id === taskId);
    if (task) {
      (task as any).done = !(task as any).done;
      this.logger.log(`Task ${taskId} toggled to ${(task as any).done}`);
      this.events.emit('workload-changed');
      return true;
    }
    return false;
  }

  /**
   * Get MAR preview (medications due in next 2 hours)
   */
  async getMARPreview(): Promise<MARMedicationDto[]> {
    this.logger.log('Fetching MAR preview');
    const now = Date.now();
    return [
      { id: 'm1', name: 'Metoprolol 25mg', patient: 'Johnson, S.', dueAt: new Date(now - 20 * 60000).toISOString(), route: 'PO' },
      { id: 'm2', name: 'Insulin sliding scale', patient: 'Chen, M.', dueAt: new Date(now + 5 * 60000).toISOString(), route: 'SubQ' },
      { id: 'm3', name: 'Vancomycin 1g', patient: 'Davis, E.', dueAt: new Date(now + 45 * 60000).toISOString(), route: 'IV' },
      { id: 'm4', name: 'Lasix 40mg', patient: 'Wilson, R.', dueAt: new Date(now + 75 * 60000).toISOString(), route: 'IV' },
      { id: 'm5', name: 'Heparin 5000u', patient: 'Johnson, S.', dueAt: new Date(now + 110 * 60000).toISOString(), route: 'SubQ' },
    ];
  }

  /**
   * Get on-call roster
   */
  async getOnCallRoster(): Promise<RosterEntryDto[]> {
    this.logger.log('Fetching on-call roster');
    return [
      { id: 'r1', name: 'Dr. Kim', specialty: 'Cardiology', status: 'available', phone: 'x4521' },
      { id: 'r2', name: 'Dr. Patel', specialty: 'General Surgery', status: 'in-surgery', phone: 'x4102' },
      { id: 'r3', name: 'Dr. Lee', specialty: 'Nephrology', status: 'off-site', phone: 'x4330' },
      { id: 'r4', name: 'Dr. Wu', specialty: 'ICU Attending', status: 'available', phone: 'x4001' },
      { id: 'r5', name: 'Dr. Garcia', specialty: 'Pulmonology', status: 'available', phone: 'x4215' },
      { id: 'r6', name: 'Dr. Nguyen', specialty: 'Neurology', status: 'in-surgery', phone: 'x4440' },
    ];
  }

  /**
   * Get bed board / census
   */
  async getBedBoard(): Promise<BedBoardDto> {
    this.logger.log('Fetching bed board');
    return {
      unit: 'Unit 3A',
      beds: [
        { id: 'b1', room: '201', status: BedStatus.OCCUPIED, patient: 'Johnson, S.', acuity: 'critical' },
        { id: 'b2', room: '202', status: BedStatus.OCCUPIED, patient: 'Chen, M.', acuity: 'urgent' },
        { id: 'b3', room: '203', status: BedStatus.AVAILABLE, patient: null, acuity: null },
        { id: 'b4', room: '204', status: BedStatus.OCCUPIED, patient: 'Davis, E.', acuity: 'critical' },
        { id: 'b5', room: '205', status: BedStatus.OCCUPIED, patient: 'Wilson, R.', acuity: 'stable' },
        { id: 'b6', room: '206', status: BedStatus.AVAILABLE, patient: null, acuity: null },
        { id: 'b7', room: '207', status: BedStatus.CLEANING, patient: null, acuity: null },
        { id: 'b8', room: '208', status: BedStatus.OCCUPIED, patient: 'Brown, A.', acuity: 'stable' },
        { id: 'b9', room: '209', status: BedStatus.OCCUPIED, patient: 'Garcia, M.', acuity: 'urgent' },
        { id: 'b10', room: '210', status: BedStatus.AVAILABLE, patient: null, acuity: null },
        { id: 'b11', room: '211', status: BedStatus.OCCUPIED, patient: 'Martinez, C.', acuity: 'stable' },
        { id: 'b12', room: '212', status: BedStatus.OCCUPIED, patient: 'Taylor, S.', acuity: 'stable' },
      ],
    };
  }

  /**
   * Get lab timeline events (last 12 hours)
   */
  async getLabTimeline(): Promise<LabEventDto[]> {
    this.logger.log('Fetching lab timeline');
    const now = Date.now();
    return [
      { id: 'l1', test: 'CBC', patient: 'Johnson, S.', status: 'resulted', orderedAt: new Date(now - 4 * 3600000).toISOString(), resultedAt: new Date(now - 2 * 3600000).toISOString(), critical: false },
      { id: 'l2', test: 'Troponin', patient: 'Davis, E.', status: 'resulted', orderedAt: new Date(now - 3 * 3600000).toISOString(), resultedAt: new Date(now - 1.5 * 3600000).toISOString(), critical: true },
      { id: 'l3', test: 'BMP', patient: 'Chen, M.', status: 'resulted', orderedAt: new Date(now - 2.5 * 3600000).toISOString(), resultedAt: new Date(now - 0.5 * 3600000).toISOString(), critical: false },
      { id: 'l4', test: 'Lactate', patient: 'Davis, E.', status: 'pending', orderedAt: new Date(now - 1 * 3600000).toISOString(), resultedAt: null, critical: false },
      { id: 'l5', test: 'UA + Culture', patient: 'Wilson, R.', status: 'pending', orderedAt: new Date(now - 0.5 * 3600000).toISOString(), resultedAt: null, critical: false },
      { id: 'l6', test: 'PT/INR', patient: 'Johnson, S.', status: 'pending', orderedAt: new Date(now - 0.25 * 3600000).toISOString(), resultedAt: null, critical: false },
    ];
  }

  /**
   * Get clinical decision support reminders
   */
  async getCDSReminders(): Promise<CDSReminderDto[]> {
    this.logger.log('Fetching CDS reminders');
    return [
      { id: 'cds1', message: '3 patients due for sepsis screening (qSOFA)', icon: '🦠', priority: 'high' },
      { id: 'cds2', message: 'DVT prophylaxis reminder for 2 post-op patients', icon: '🩸', priority: 'medium' },
      { id: 'cds3', message: 'Fall risk reassessment due for Room 204', icon: '⚠️', priority: 'medium' },
      { id: 'cds4', message: 'Flu vaccination campaign — 5 eligible patients this shift', icon: '💉', priority: 'low' },
    ];
  }

  /**
   * Place a quick order
   */
  async placeOrder(patientId: string, orderId: string, label: string): Promise<{ success: boolean; orderRef: string }> {
    this.logger.log(`Order placed: ${label} (${orderId}) for patient ${patientId}`);
    const orderRef = `ORD-${Date.now()}`;
    this.orderLog.push({ patientId, orderId, label, orderRef, timestamp: new Date() });

    // Add an activity for the order
    this.addActivity({
      id: `activity-${Date.now()}`,
      type: ActivityType.MEDICATION,
      message: `Order placed: ${label}`,
      patientName: patientId,
      timestamp: new Date(),
    });

    return { success: true, orderRef };
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
    // Push instant update to all SSE clients
    this.events.emit('activity', activity);
  }

  /**
   * Add new alert (for real-time updates)
   */
  addAlert(alert: AlertDto): void {
    this.mockAlerts.unshift(alert);
    // Push instant update to all SSE clients
    this.events.emit('alert', alert);
    this.events.emit('stats-changed');
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

  private initializeWorkloadTasks(): void {
    this.workloadTasks = [
      { id: 't1', label: 'Review CBC — Johnson, S.', done: false, priority: 'high' },
      { id: 't2', label: 'Sign heparin order — Chen, M.', done: false, priority: 'high' },
      { id: 't3', label: 'Respond to cardiology consult', done: true, priority: 'medium' },
      { id: 't4', label: 'Update care plan — Davis, E.', done: false, priority: 'medium' },
      { id: 't5', label: 'Document wound assessment — Wilson, R.', done: false, priority: 'low' },
    ];
  }

  /**
   * Automated Clinical Event Simulator
   * Generates realistic clinical events at randomized intervals (8–20s).
   * Events flow through the EventEmitter → SSE push → frontend instantly.
   */
  private startClinicalSimulator(): void {
    const patients = [
      'Sarah Johnson',
      'Michael Chen',
      'Emily Davis',
      'Robert Wilson',
      'Maria Garcia',
      'James Brown',
      'Lisa Martinez',
    ];

    const activityMessages: Record<string, string[]> = {
      [ActivityType.LAB]: [
        'New lab results available — CBC panel',
        'Troponin level resulted',
        'BMP resulted — review required',
        'Blood culture sensitivity ready',
        'HbA1c results posted',
      ],
      [ActivityType.MEDICATION]: [
        'Medication administered — Metoprolol 25mg PO',
        'IV antibiotic infusion started',
        'PRN pain medication given — Morphine 2mg IV',
        'Insulin sliding scale administered',
        'Heparin drip rate adjusted',
      ],
      [ActivityType.VITAL]: [
        'Vitals recorded — within normal limits',
        'Blood pressure trending up — 158/94',
        'Heart rate elevated — 112 bpm',
        'SpO2 dropped to 91% — O2 titrated',
        'Temperature spike — 38.9°C',
      ],
      [ActivityType.ADMISSION]: [
        'New patient admitted from ED',
        'Transfer accepted from PACU',
        'Direct admission — cardiology service',
      ],
      [ActivityType.PROCEDURE]: [
        'Central line placed — right IJ',
        'Chest X-ray completed',
        'Foley catheter inserted',
        'Wound care completed',
        'Arterial blood gas drawn',
      ],
      [ActivityType.NOTE]: [
        'Progress note signed',
        'Nursing assessment documented',
        'Discharge planning note added',
        'Consult note from cardiology',
        'Social work assessment completed',
      ],
    };

    const alertMessages = [
      { msg: 'Vital signs outside normal range', sev: AlertSeverity.HIGH },
      { msg: 'Lab values require immediate attention', sev: AlertSeverity.CRITICAL },
      { msg: 'Medication due — overdue by 15 min', sev: AlertSeverity.MEDIUM },
      { msg: 'Patient deterioration detected — early warning score elevated', sev: AlertSeverity.CRITICAL },
      { msg: 'Fall risk reassessment due', sev: AlertSeverity.LOW },
      { msg: 'Blood glucose critically low — 52 mg/dL', sev: AlertSeverity.CRITICAL },
      { msg: 'Oxygen saturation below threshold', sev: AlertSeverity.HIGH },
      { msg: 'New lab critical value — K+ 6.1 mEq/L', sev: AlertSeverity.CRITICAL },
    ];

    const generateEvent = () => {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const activityTypes = Object.values(ActivityType);
      const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const msgs = activityMessages[randomType] || ['Activity recorded'];
      const message = msgs[Math.floor(Math.random() * msgs.length)];

      // Always generate an activity
      this.addActivity({
        id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: randomType,
        message,
        patientName: patient,
        timestamp: new Date(),
      });

      // 25% chance to also generate an alert
      if (Math.random() < 0.25) {
        const alertDef = alertMessages[Math.floor(Math.random() * alertMessages.length)];
        this.addAlert({
          id: `alert-sim-${Date.now()}`,
          severity: alertDef.sev,
          message: alertDef.msg,
          patientName: patient,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      // Schedule next event at a random interval (8–20 seconds)
      const nextDelay = 8000 + Math.floor(Math.random() * 12000);
      this.simulatorInterval = setTimeout(() => generateEvent(), nextDelay);
    };

    // Start after a short initial delay
    this.simulatorInterval = setTimeout(() => generateEvent(), 5000);
    this.logger.log('Clinical event simulator started (8–20s intervals)');
  }
}
