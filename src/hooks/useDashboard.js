/**
 * useDashboard Hook
 * Manages dashboard data fetching, real-time SSE push updates, and state.
 *
 * Data flow:
 *   1. Initial full fetch on mount (10 parallel API calls)
 *   2. SSE push for incremental updates (activity, alert, stats, workload)
 *   3. NO polling — all updates arrive via Server-Sent Events instantly
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import dashboardService from '../services/dashboardService';
import logger from '../utils/logger';

/**
 * Custom hook for dashboard data management
 * @returns {Object} Dashboard state and methods
 */
export function useDashboard() {
  // State
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [criticalPatients, setCriticalPatients] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [marMedications, setMarMedications] = useState([]);
  const [onCallRoster, setOnCallRoster] = useState([]);
  const [bedBoard, setBedBoard] = useState(null);
  const [labTimeline, setLabTimeline] = useState([]);
  const [cdsReminders, setCdsReminders] = useState([]);
  const [patientFilters, setPatientFilters] = useState({
    status: 'critical',
    search: '',
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  /** @type {'connected'|'connecting'|'disconnected'} */
  const [connectionState, setConnectionState] = useState('disconnected');

  // Track latest activity to prevent duplicates
  const latestActivityId = useRef(null);
  const initialPatientLoad = useRef(true);
  const patientFiltersRef = useRef(patientFilters);

  useEffect(() => {
    patientFiltersRef.current = patientFilters;
  }, [patientFilters]);

  /**
   * Fetch all dashboard data
   */
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch all data in parallel
      const [statsData, activitiesData, alertsData, patientsData, workloadData, marData, rosterData, bedData, labData, cdsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(10),
        dashboardService.getActiveAlerts(),
        dashboardService.getCriticalPatients(patientFiltersRef.current),
        dashboardService.getWorkload(),
        dashboardService.getMARPreview(),
        dashboardService.getOnCallRoster(),
        dashboardService.getBedBoard(),
        dashboardService.getLabTimeline(),
        dashboardService.getCDSReminders(),
      ]);

      setStats(statsData);
      setActivities(activitiesData);
      setAlerts(alertsData);
      setCriticalPatients(patientsData);
      setWorkload(workloadData);
      setMarMedications(marData);
      setOnCallRoster(rosterData);
      setBedBoard(bedData);
      setLabTimeline(labData);
      setCdsReminders(cdsData);

      // Track latest activity
      if (activitiesData.length > 0) {
        latestActivityId.current = activitiesData[0].id;
      }

      logger.info('Dashboard data loaded successfully');
    } catch (err) {
      logger.error('Failed to fetch dashboard data', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch patients when filters change
  useEffect(() => {
    if (initialPatientLoad.current) {
      initialPatientLoad.current = false;
      return;
    }

    let active = true;

    const fetchPatients = async () => {
      try {
        const patientsData = await dashboardService.getCriticalPatients(patientFilters);
        if (active) {
          setCriticalPatients(patientsData);
        }
      } catch (err) {
        logger.error('Failed to fetch filtered patients', err);
      }
    };

    fetchPatients();

    return () => {
      active = false;
    };
  }, [patientFilters]);

  /**
   * Handle new activity from real-time updates
   */
  const handleNewActivity = useCallback((activity) => {
    // Prevent duplicate activities
    if (activity.id === latestActivityId.current) {
      return;
    }

    latestActivityId.current = activity.id;

    setActivities(prev => {
      // Check if activity already exists
      if (prev.some(a => a.id === activity.id)) {
        return prev;
      }
      // Add new activity at the beginning, limit to 10 items
      return [activity, ...prev].slice(0, 10);
    });

    logger.info('New activity received', { type: activity.type });
  }, []);

  /**
   * Handle new alert from real-time SSE push
   */
  const handleNewAlert = useCallback((alert) => {
    setAlerts(prev => {
      if (prev.some(a => a.id === alert.id)) {
        return prev;
      }
      return [alert, ...prev];
    });

    // Stats are updated separately via the 'stats' SSE event — no re-fetch needed
    logger.info('New alert received via SSE', { severity: alert.severity });
  }, []);

  /**
   * Acknowledge an alert
   */
  const acknowledgeAlert = useCallback(async (alertId) => {
    try {
      const success = await dashboardService.acknowledgeAlert(alertId);
      
      if (success) {
        // Remove alert from list or mark as acknowledged
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        logger.info('Alert acknowledged', { alertId });
      }
      
      return success;
    } catch (err) {
      logger.error('Failed to acknowledge alert', err);
      return false;
    }
  }, []);

  /**
   * Track tool access
   */
  const trackToolAccess = useCallback(async (toolId) => {
    try {
      await dashboardService.trackToolAccess(toolId);
    } catch (err) {
      logger.error('Failed to track tool access', err);
    }
  }, []);

  /**
   * Toggle a workload task
   */
  const toggleTask = useCallback(async (taskId) => {
    // Optimistic update
    setWorkload(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t),
      };
    });
    try {
      await dashboardService.toggleTask(taskId);
      logger.info('Task toggled', { taskId });
    } catch (err) {
      logger.error('Failed to toggle task', err);
    }
  }, []);

  /**
   * Place a quick order
   */
  const placeOrder = useCallback(async (order) => {
    try {
      const result = await dashboardService.placeOrder(order);
      logger.info('Order placed', { orderRef: result.orderRef });
      return result;
    } catch (err) {
      logger.error('Failed to place order', err);
      return { success: false };
    }
  }, []);

  /**
   * Create a new patient and refresh the dashboard
   */
  const createPatient = useCallback(async (data) => {
    const patient = await dashboardService.createPatient(data);
    // Refresh patient list and stats after successful creation
    const [patientsData, statsData] = await Promise.all([
      dashboardService.getCriticalPatients(patientFiltersRef.current),
      dashboardService.getStats(),
    ]);
    setCriticalPatients(patientsData);
    setStats(statsData);
    return patient;
  }, []);

  /**
   * Refresh all dashboard data
   */
  const refresh = useCallback(() => {
    return fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Subscribe to real-time SSE push updates (no polling)
  useEffect(() => {
    // Activity & alert subscriptions (existing)
    const unsubActivity = dashboardService.subscribeToActivity(handleNewActivity);
    const unsubAlerts = dashboardService.subscribeToAlerts(handleNewAlert);

    // Stats push — instant update when mutations happen on the backend
    const unsubStats = dashboardService.subscribeToStats((data) => {
      if (data.stats) setStats(data.stats);
      logger.debug('Stats pushed via SSE');
    });

    // Alert-acknowledged — remove from alerts list instantly
    const unsubAckd = dashboardService.subscribeToAlertAcknowledged((ack) => {
      setAlerts(prev => prev.filter(a => a.id !== ack.id));
      logger.debug('Alert acknowledged via SSE', { alertId: ack.id });
    });

    // Workload push — instant update on task toggle
    const unsubWorkload = dashboardService.subscribeToWorkload((data) => {
      setWorkload(data);
      logger.debug('Workload pushed via SSE');
    });

    // Connection state for the Live indicator
    const unsubConnection = dashboardService.subscribeToConnection((state) => {
      setConnectionState(state);
    });

    logger.info('Subscribed to real-time SSE push (zero polling)');

    return () => {
      unsubActivity();
      unsubAlerts();
      unsubStats();
      unsubAckd();
      unsubWorkload();
      unsubConnection();
      logger.info('Unsubscribed from SSE push');
    };
  }, [handleNewActivity, handleNewAlert]);

  return {
    // Data
    stats,
    activities,
    alerts,
    criticalPatients,
    workload,
    marMedications,
    onCallRoster,
    bedBoard,
    labTimeline,
    cdsReminders,
    
    // State
    loading,
    refreshing,
    error,
    patientFilters,
    connectionState,
    
    // Methods
    acknowledgeAlert,
    trackToolAccess,
    toggleTask,
    placeOrder,
    createPatient,
    refresh,
    setPatientFilters,
  };
}

export default useDashboard;
