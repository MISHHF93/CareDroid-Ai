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
    this.pollingInterval = null;
    this.eventSource = null;
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

    // Return unsubscribe function
    return () => {
      this.alertListeners.delete(callback);
    };
  }

  /**
   * Initialize Server-Sent Events for real-time updates
   * @private
   */
  _initializeSSE() {
    try {
      const url = buildApiUrl('/api/dashboard/stream');
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

      this.eventSource.onerror = (error) => {
        logger.error('SSE connection error', error);
        this.eventSource?.close();
        this.eventSource = null;
        // Fallback to polling
        if (this.activityListeners.size > 0 && !this.pollingInterval) {
          this._startPolling();
        }
      };

      logger.info('SSE connection established');
    } catch (error) {
      logger.error('Failed to initialize SSE', error);
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
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
