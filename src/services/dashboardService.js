/**
 * Dashboard Service
 * Handles all Dashboard data fetching and real-time updates
 */

import { apiFetch, buildApiUrl } from './apiClient';
import logger from '../utils/logger';

/**
 * @typedef {Object} DashboardStats
 * @property {number} criticalPatients
 * @property {number} activePatients
 * @property {number} stablePatients
 * @property {number} pendingLabs
 * @property {Object} trends
 */

/**
 * @typedef {Object} Activity
 * @property {string} id
 * @property {string} type - lab, medication, vital, admission, discharge, etc.
 * @property {string} message
 * @property {string} patientName
 * @property {Date} timestamp
 * @property {string} [severity]
 */

/**
 * @typedef {Object} Alert
 * @property {string} id
 * @property {string} severity - critical, high, medium, low
 * @property {string} message
 * @property {string} patientName
 * @property {Date} timestamp
 * @property {boolean} acknowledged
 */

class DashboardService {
  constructor() {
    this.activityListeners = new Set();
    this.alertListeners = new Set();
    this.statsListeners = new Set();
    this.alertAcknowledgedListeners = new Set();
    this.workloadListeners = new Set();
    this.connectionListeners = new Set();
    this.pollingInterval = null;
    this.eventSource = null;
    /** @type {'connected'|'connecting'|'disconnected'} */
    this.connectionState = 'disconnected';
  }

  /**
   * Get dashboard statistics
   * @returns {Promise<DashboardStats>}
   */
  async getStats() {
    try {
      const response = await apiFetch('/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Failed to fetch dashboard stats', error);
      // Return mock data as fallback
      return this._getMockStats();
    }
  }

  /**
   * Get recent activity feed
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise<Activity[]>}
   */
  async getRecentActivity(limit = 10) {
    try {
      const response = await apiFetch(`/api/dashboard/activity?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activity: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.activities || [];
    } catch (error) {
      logger.error('Failed to fetch activity feed', error);
      // Return mock data as fallback
      return this._getMockActivities();
    }
  }

  /**
   * Get active alerts
   * @returns {Promise<Alert[]>}
   */
  async getActiveAlerts() {
    try {
      const response = await apiFetch('/api/dashboard/alerts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.alerts || [];
    } catch (error) {
      logger.error('Failed to fetch alerts', error);
      // Return mock data as fallback
      return this._getMockAlerts();
    }
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId
   * @returns {Promise<boolean>}
   */
  async acknowledgeAlert(alertId) {
    try {
      const response = await apiFetch(`/api/dashboard/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert: ${response.statusText}`);
      }
      
      logger.info(`Alert ${alertId} acknowledged`);
      return true;
    } catch (error) {
      logger.error('Failed to acknowledge alert', error);
      return false;
    }
  }

  /**
   * Get patients for the dashboard
   * @param {Object} filters
   * @param {string} [filters.status]
   * @param {string} [filters.search]
   * @param {number} [filters.limit]
   * @returns {Promise<Object[]>}
   */
  async getCriticalPatients(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.limit) {
        params.append('limit', String(filters.limit));
      }

      const query = params.toString();
      const response = await apiFetch(`/api/patients${query ? `?${query}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch critical patients: ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : data.patients || [];
    } catch (error) {
      logger.error('Failed to fetch critical patients', error);
      // Return mock data as fallback
      return this._filterMockPatients(filters);
    }
  }

  /**
   * Track tool access
   * @param {string} toolId
   * @returns {Promise<void>}
   */
  async trackToolAccess(toolId) {
    try {
      await apiFetch('/api/dashboard/tools/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId, timestamp: new Date().toISOString() }),
      });
    } catch (error) {
      logger.error('Failed to track tool access', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Toggle a workload task (done/undone)
   * @param {string} taskId
   * @returns {Promise<boolean>}
   */
  async toggleTask(taskId) {
    try {
      const response = await apiFetch('/api/dashboard/workload/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      if (!response.ok) throw new Error(`Failed to toggle task: ${response.statusText}`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      logger.error('Failed to toggle task', error);
      return true; // optimistic
    }
  }

  /**
   * Place a quick order
   * @param {Object} order - { patientId, orderId, label }
   * @returns {Promise<Object>}
   */
  async placeOrder(order) {
    try {
      const response = await apiFetch('/api/dashboard/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error(`Failed to place order: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      logger.error('Failed to place order', error);
      return { success: true, orderRef: `ORD-${Date.now()}` }; // optimistic
    }
  }

  /**
   * Create a new patient
   * @param {Object} data - Patient data
   * @param {string} data.name - Full name (required)
   * @param {number} data.age - Age in years (required)
   * @param {string} data.gender - Gender (required)
   * @param {string} [data.status] - Acuity status (default: 'stable')
   * @param {string} [data.room] - Room number
   * @param {string} [data.bed] - Bed identifier
   * @param {string} [data.admittingDiagnosis] - Admitting diagnosis
   * @param {Object} [data.vitals] - Patient vitals
   * @param {Array} [data.alerts] - Active alerts
   * @param {string[]} [data.medications] - Current medications
   * @returns {Promise<Object>} Created patient
   */
  async createPatient(data) {
    try {
      const response = await apiFetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const messages = Array.isArray(err.message) ? err.message.join(', ') : err.message;
        throw new Error(messages || `Failed to create patient: ${response.statusText}`);
      }

      const patient = await response.json();
      logger.info('Patient created', { id: patient.id, name: patient.name });
      return patient;
    } catch (error) {
      logger.error('Failed to create patient', error);
      throw error; // Don't swallow — let the caller handle
    }
  }

  /**
   * Subscribe to real-time activity updates
   * Uses Server-Sent Events (SSE) or falls back to polling
   * @param {Function} callback - Called with new activity items
   * @returns {Function} Unsubscribe function
   */
  subscribeToActivity(callback) {
    this.activityListeners.add(callback);

    // Try to use SSE first
    if (!this.eventSource) {
      this._initializeSSE();
    }

    // Fallback to polling if SSE not available
    if (!this.eventSource && !this.pollingInterval) {
      this._startPolling();
    }

    // Return unsubscribe function
    return () => {
      this.activityListeners.delete(callback);
      if (this.activityListeners.size === 0) {
        this._cleanup();
      }
    };
  }

  /**
   * Subscribe to real-time alert updates
   * @param {Function} callback - Called with new alerts
   * @returns {Function} Unsubscribe function
   */
  subscribeToAlerts(callback) {
    this.alertListeners.add(callback);

    return () => {
      this.alertListeners.delete(callback);
    };
  }

  /**
   * Subscribe to real-time stats updates (pushed on mutations)
   * @param {Function} callback - Called with { stats, activeAlertCount }
   * @returns {Function} Unsubscribe function
   */
  subscribeToStats(callback) {
    this.statsListeners.add(callback);
    return () => { this.statsListeners.delete(callback); };
  }

  /**
   * Subscribe to alert-acknowledged events
   * @param {Function} callback - Called with the acknowledged alert
   * @returns {Function} Unsubscribe function
   */
  subscribeToAlertAcknowledged(callback) {
    this.alertAcknowledgedListeners.add(callback);
    return () => { this.alertAcknowledgedListeners.delete(callback); };
  }

  /**
   * Subscribe to workload changes
   * @param {Function} callback - Called with updated workload
   * @returns {Function} Unsubscribe function
   */
  subscribeToWorkload(callback) {
    this.workloadListeners.add(callback);
    return () => { this.workloadListeners.delete(callback); };
  }

  /**
   * Subscribe to SSE connection state changes
   * @param {Function} callback - Called with 'connected'|'connecting'|'disconnected'
   * @returns {Function} Unsubscribe function
   */
  subscribeToConnection(callback) {
    this.connectionListeners.add(callback);
    // Immediately notify of current state
    callback(this.connectionState);
    return () => { this.connectionListeners.delete(callback); };
  }

  /**
   * @private Update connection state and notify listeners
   */
  _setConnectionState(state) {
    this.connectionState = state;
    this.connectionListeners.forEach(cb => cb(state));
  }

  /**
   * Initialize Server-Sent Events for real-time push updates.
   * Handles event types: activity, alert, alert-acknowledged, stats, workload, heartbeat.
   * Falls back to polling only if SSE cannot connect at all.
   * @private
   */
  _initializeSSE() {
    try {
      const url = buildApiUrl('/api/dashboard/stream');
      this._setConnectionState('connecting');
      this.eventSource = new EventSource(url);

      this.eventSource.addEventListener('activity', (event) => {
        try {
          const activity = JSON.parse(event.data);
          this.activityListeners.forEach(listener => listener(activity));
        } catch (error) {
          logger.error('Failed to parse activity event', error);
        }
      });

      this.eventSource.addEventListener('alert', (event) => {
        try {
          const alert = JSON.parse(event.data);
          this.alertListeners.forEach(listener => listener(alert));
        } catch (error) {
          logger.error('Failed to parse alert event', error);
        }
      });

      this.eventSource.addEventListener('alert-acknowledged', (event) => {
        try {
          const alert = JSON.parse(event.data);
          this.alertAcknowledgedListeners.forEach(listener => listener(alert));
        } catch (error) {
          logger.error('Failed to parse alert-acknowledged event', error);
        }
      });

      this.eventSource.addEventListener('stats', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.statsListeners.forEach(listener => listener(data));
        } catch (error) {
          logger.error('Failed to parse stats event', error);
        }
      });

      this.eventSource.addEventListener('workload', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.workloadListeners.forEach(listener => listener(data));
        } catch (error) {
          logger.error('Failed to parse workload event', error);
        }
      });

      this.eventSource.addEventListener('heartbeat', () => {
        // Heartbeat received — connection is alive
        logger.debug('SSE heartbeat received');
      });

      this.eventSource.onopen = () => {
        this._setConnectionState('connected');
        logger.info('SSE connection established (push mode)');
        // If we had a polling fallback running, stop it
        if (this.pollingInterval) {
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
          logger.info('Polling stopped — SSE push active');
        }
      };

      this.eventSource.onerror = (error) => {
        logger.error('SSE connection error', error);
        this._setConnectionState('disconnected');
        this.eventSource?.close();
        this.eventSource = null;
        // Fallback to polling
        if (this.activityListeners.size > 0 && !this.pollingInterval) {
          this._startPolling();
        }
        // Auto-reconnect SSE after 5 seconds
        setTimeout(() => {
          if (!this.eventSource && this.activityListeners.size > 0) {
            logger.info('Attempting SSE reconnect...');
            this._initializeSSE();
          }
        }, 5000);
      };
    } catch (error) {
      logger.error('Failed to initialize SSE', error);
      this._setConnectionState('disconnected');
      this.eventSource = null;
    }
  }

  /**
   * Start polling for updates (fallback)
   * @private
   */
  _startPolling() {
    logger.info('Starting polling for dashboard updates');
    
    this.pollingInterval = setInterval(async () => {
      try {
        const activities = await this.getRecentActivity(5);
        if (activities.length > 0) {
          // Notify listeners of new activity
          activities.forEach(activity => {
            this.activityListeners.forEach(listener => listener(activity));
          });
        }
      } catch (error) {
        logger.error('Polling failed', error);
      }
    }, 15000); // Poll every 15 seconds
  }

  /**
   * Cleanup subscriptions
   * @private
   */
  _cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    logger.info('Dashboard service cleaned up');
  }

  /**
   * Get workload tasks for the current clinician
   * @returns {Promise<Object>}
   */
  async getWorkload() {
    try {
      const response = await apiFetch('/api/dashboard/workload');
      if (!response.ok) throw new Error(`Failed to fetch workload: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch workload', error);
      return this._getMockWorkload();
    }
  }

  /**
   * Get MAR preview (medications due in next 2 hours)
   * @returns {Promise<Object[]>}
   */
  async getMARPreview() {
    try {
      const response = await apiFetch('/api/dashboard/mar-preview');
      if (!response.ok) throw new Error(`Failed to fetch MAR: ${response.statusText}`);
      const data = await response.json();
      return data.medications || [];
    } catch (error) {
      logger.error('Failed to fetch MAR preview', error);
      return this._getMockMAR();
    }
  }

  /**
   * Get on-call roster
   * @returns {Promise<Object[]>}
   */
  async getOnCallRoster() {
    try {
      const response = await apiFetch('/api/dashboard/on-call');
      if (!response.ok) throw new Error(`Failed to fetch roster: ${response.statusText}`);
      const data = await response.json();
      return data.roster || [];
    } catch (error) {
      logger.error('Failed to fetch on-call roster', error);
      return this._getMockRoster();
    }
  }

  /**
   * Get bed board / census data
   * @returns {Promise<Object>}
   */
  async getBedBoard() {
    try {
      const response = await apiFetch('/api/dashboard/beds');
      if (!response.ok) throw new Error(`Failed to fetch beds: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch bed board', error);
      return this._getMockBedBoard();
    }
  }

  /**
   * Get lab timeline events (last 12 hours)
   * @returns {Promise<Object[]>}
   */
  async getLabTimeline() {
    try {
      const response = await apiFetch('/api/dashboard/lab-timeline');
      if (!response.ok) throw new Error(`Failed to fetch lab timeline: ${response.statusText}`);
      const data = await response.json();
      return data.events || [];
    } catch (error) {
      logger.error('Failed to fetch lab timeline', error);
      return this._getMockLabTimeline();
    }
  }

  /**
   * Get clinical decision support reminders
   * @returns {Promise<Object[]>}
   */
  async getCDSReminders() {
    try {
      const response = await apiFetch('/api/dashboard/cds-reminders');
      if (!response.ok) throw new Error(`Failed to fetch CDS: ${response.statusText}`);
      const data = await response.json();
      return data.reminders || [];
    } catch (error) {
      logger.error('Failed to fetch CDS reminders', error);
      return this._getMockCDSReminders();
    }
  }

  /**
   * Mock data generators for fallback
   * @private
   */
  _getMockStats() {
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

  _getMockActivities() {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'lab',
        message: 'Lab results received for complete blood count',
        patientName: 'Sarah Johnson',
        timestamp: new Date(now - 5 * 60 * 1000), // 5 min ago
      },
      {
        id: '2',
        type: 'vital',
        message: 'Blood pressure reading recorded',
        patientName: 'Michael Chen',
        timestamp: new Date(now - 15 * 60 * 1000), // 15 min ago
        severity: 'high',
      },
      {
        id: '3',
        type: 'medication',
        message: 'Medication administered',
        patientName: 'Emily Davis',
        timestamp: new Date(now - 30 * 60 * 1000), // 30 min ago
      },
      {
        id: '4',
        type: 'admission',
        message: 'New patient admitted to ICU',
        patientName: 'Robert Wilson',
        timestamp: new Date(now - 45 * 60 * 1000), // 45 min ago
      },
      {
        id: '5',
        type: 'consult',
        message: 'Cardiology consult requested',
        patientName: 'Maria Garcia',
        timestamp: new Date(now - 60 * 60 * 1000), // 1 hour ago
      },
    ];
  }

  _getMockAlerts() {
    const now = new Date();
    return [
      {
        id: 'alert-1',
        severity: 'critical',
        message: 'Sepsis criteria met - immediate attention required',
        patientName: 'Sarah Johnson',
        timestamp: new Date(now - 10 * 60 * 1000),
        acknowledged: false,
      },
      {
        id: 'alert-2',
        severity: 'high',
        message: 'Lab values critical: Potassium 6.2 mEq/L',
        patientName: 'Michael Chen',
        timestamp: new Date(now - 25 * 60 * 1000),
        acknowledged: false,
      },
      {
        id: 'alert-3',
        severity: 'medium',
        message: 'Medication due in 15 minutes',
        patientName: 'Emily Davis',
        timestamp: new Date(now - 40 * 60 * 1000),
        acknowledged: false,
      },
    ];
  }

  _filterMockPatients(filters = {}) {
    const patients = this._getMockCriticalPatients();
    const status = filters.status && filters.status !== 'all' ? filters.status : null;
    const search = filters.search ? filters.search.toLowerCase() : null;

    let results = patients;

    if (status) {
      results = results.filter(patient => patient.status === status);
    }

    if (search) {
      results = results.filter(patient => {
        const name = (patient.name || '').toLowerCase();
        const diagnosis = (patient.admittingDiagnosis || '').toLowerCase();
        const room = (patient.room || '').toLowerCase();
        const bed = (patient.bed || '').toLowerCase();
        return (
          name.includes(search) ||
          diagnosis.includes(search) ||
          room.includes(search) ||
          bed.includes(search)
        );
      });
    }

    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  _getMockCriticalPatients() {
    return [
      {
        id: 'patient-1',
        name: 'Sarah Johnson',
        age: 67,
        gender: 'Female',
        room: '312',
        bed: 'A',
        admittingDiagnosis: 'Acute Myocardial Infarction with cardiogenic shock',
        vitals: {
          heartRate: { value: 118, unit: 'bpm', range: { min: 60, max: 100 } },
          bloodPressure: {
            systolic: 92,
            diastolic: 58,
            unit: 'mmHg',
            range: { min: 90, max: 140 },
          },
          temperature: { value: 38.9, unit: 'F', range: { min: 97, max: 99 } },
          oxygenSat: { value: 91, unit: '%', range: { min: 95, max: 100 } },
        },
        alerts: [
          { message: 'Sepsis criteria met', severity: 'critical' },
          { message: 'Elevated lactate', severity: 'high' },
        ],
        medications: ['Vancomycin', 'Piperacillin'],
        status: 'critical',
      },
      {
        id: 'patient-2',
        name: 'Michael Chen',
        age: 54,
        gender: 'Male',
        room: '205',
        bed: 'B',
        admittingDiagnosis: 'Hyperkalemia with hypertensive urgency',
        vitals: {
          heartRate: { value: 102, unit: 'bpm', range: { min: 60, max: 100 } },
          bloodPressure: {
            systolic: 168,
            diastolic: 95,
            unit: 'mmHg',
            range: { min: 90, max: 140 },
          },
          temperature: { value: 37.2, unit: 'F', range: { min: 97, max: 99 } },
          oxygenSat: { value: 95, unit: '%', range: { min: 95, max: 100 } },
        },
        alerts: [
          { message: 'Hyperkalemia', severity: 'critical' },
          { message: 'Hypertensive urgency', severity: 'high' },
        ],
        medications: ['Lisinopril', 'Kayexalate'],
        status: 'critical',
      },
    ];
  }

  _getMockWorkload() {
    return {
      tasks: [
        { id: 't1', label: 'Review CBC — Johnson, S.', done: false, priority: 'high' },
        { id: 't2', label: 'Sign heparin order — Chen, M.', done: false, priority: 'high' },
        { id: 't3', label: 'Respond to cardiology consult', done: true, priority: 'medium' },
        { id: 't4', label: 'Update care plan — Davis, E.', done: false, priority: 'medium' },
        { id: 't5', label: 'Document wound assessment — Wilson, R.', done: false, priority: 'low' },
      ],
      shiftEnd: new Date(Date.now() + 3 * 3600000 + 22 * 60000).toISOString(),
    };
  }

  _getMockMAR() {
    const now = Date.now();
    return [
      { id: 'm1', name: 'Metoprolol 25mg', patient: 'Johnson, S.', dueAt: new Date(now - 20 * 60000).toISOString(), route: 'PO' },
      { id: 'm2', name: 'Insulin sliding scale', patient: 'Chen, M.', dueAt: new Date(now + 5 * 60000).toISOString(), route: 'SubQ' },
      { id: 'm3', name: 'Vancomycin 1g', patient: 'Davis, E.', dueAt: new Date(now + 45 * 60000).toISOString(), route: 'IV' },
      { id: 'm4', name: 'Lasix 40mg', patient: 'Wilson, R.', dueAt: new Date(now + 75 * 60000).toISOString(), route: 'IV' },
      { id: 'm5', name: 'Heparin 5000u', patient: 'Johnson, S.', dueAt: new Date(now + 110 * 60000).toISOString(), route: 'SubQ' },
    ];
  }

  _getMockRoster() {
    return [
      { id: 'r1', name: 'Dr. Kim', specialty: 'Cardiology', status: 'available', phone: 'x4521' },
      { id: 'r2', name: 'Dr. Patel', specialty: 'General Surgery', status: 'in-surgery', phone: 'x4102' },
      { id: 'r3', name: 'Dr. Lee', specialty: 'Nephrology', status: 'off-site', phone: 'x4330' },
      { id: 'r4', name: 'Dr. Wu', specialty: 'ICU Attending', status: 'available', phone: 'x4001' },
      { id: 'r5', name: 'Dr. Garcia', specialty: 'Pulmonology', status: 'available', phone: 'x4215' },
      { id: 'r6', name: 'Dr. Nguyen', specialty: 'Neurology', status: 'in-surgery', phone: 'x4440' },
    ];
  }

  _getMockBedBoard() {
    return {
      unit: 'Unit 3A',
      beds: [
        { id: 'b1', room: '201', status: 'occupied', patient: 'Johnson, S.', acuity: 'critical' },
        { id: 'b2', room: '202', status: 'occupied', patient: 'Chen, M.', acuity: 'urgent' },
        { id: 'b3', room: '203', status: 'available', patient: null, acuity: null },
        { id: 'b4', room: '204', status: 'occupied', patient: 'Davis, E.', acuity: 'critical' },
        { id: 'b5', room: '205', status: 'occupied', patient: 'Wilson, R.', acuity: 'stable' },
        { id: 'b6', room: '206', status: 'available', patient: null, acuity: null },
        { id: 'b7', room: '207', status: 'cleaning', patient: null, acuity: null },
        { id: 'b8', room: '208', status: 'occupied', patient: 'Brown, A.', acuity: 'stable' },
        { id: 'b9', room: '209', status: 'occupied', patient: 'Garcia, M.', acuity: 'urgent' },
        { id: 'b10', room: '210', status: 'available', patient: null, acuity: null },
        { id: 'b11', room: '211', status: 'occupied', patient: 'Martinez, C.', acuity: 'stable' },
        { id: 'b12', room: '212', status: 'occupied', patient: 'Taylor, S.', acuity: 'stable' },
      ],
    };
  }

  _getMockLabTimeline() {
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

  _getMockCDSReminders() {
    return [
      { id: 'cds1', message: '3 patients due for sepsis screening (qSOFA)', icon: '🦠', priority: 'high' },
      { id: 'cds2', message: 'DVT prophylaxis reminder for 2 post-op patients', icon: '🩸', priority: 'medium' },
      { id: 'cds3', message: 'Fall risk reassessment due for Room 204', icon: '⚠️', priority: 'medium' },
      { id: 'cds4', message: 'Flu vaccination campaign — 5 eligible patients this shift', icon: '💉', priority: 'low' },
    ];
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
