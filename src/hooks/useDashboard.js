/**
 * useDashboard Hook
 * Manages dashboard data fetching, real-time updates, and state
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
  const [patientFilters, setPatientFilters] = useState({
    status: 'critical',
    search: '',
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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
      const [statsData, activitiesData, alertsData, patientsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(10),
        dashboardService.getActiveAlerts(),
        dashboardService.getCriticalPatients(patientFiltersRef.current),
      ]);

      setStats(statsData);
      setActivities(activitiesData);
      setAlerts(alertsData);
      setCriticalPatients(patientsData);

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
   * Handle new alert from real-time updates
   */
  const handleNewAlert = useCallback((alert) => {
    setAlerts(prev => {
      // Check if alert already exists
      if (prev.some(a => a.id === alert.id)) {
        return prev;
      }
      // Add new alert at the beginning
      return [alert, ...prev];
    });

    // Also refresh stats to update counts
    dashboardService.getStats().then(setStats).catch(err => {
      logger.error('Failed to refresh stats after new alert', err);
    });

    logger.info('New alert received', { severity: alert.severity });
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
      // Non-critical, don't throw
    }
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

  // Subscribe to real-time updates
  useEffect(() => {
    // Subscribe to activity updates
    const unsubscribeActivity = dashboardService.subscribeToActivity(handleNewActivity);
    
    // Subscribe to alert updates
    const unsubscribeAlerts = dashboardService.subscribeToAlerts(handleNewAlert);

    logger.info('Subscribed to real-time dashboard updates');

    // Cleanup on unmount
    return () => {
      unsubscribeActivity();
      unsubscribeAlerts();
      logger.info('Unsubscribed from dashboard updates');
    };
  }, [handleNewActivity, handleNewAlert]);

  // Auto-refresh stats every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const statsData = await dashboardService.getStats();
        setStats(statsData);
      } catch (err) {
        logger.error('Failed to refresh stats', err);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    // Data
    stats,
    activities,
    alerts,
    criticalPatients,
    
    // State
    loading,
    refreshing,
    error,
    patientFilters,
    
    // Methods
    acknowledgeAlert,
    trackToolAccess,
    refresh,
    setPatientFilters,
  };
}

export default useDashboard;
