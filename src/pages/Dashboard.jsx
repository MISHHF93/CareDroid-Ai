import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useDashboard } from '../hooks/useDashboard';
import AppShell from '../layout/AppShell';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { CurrentShiftSection } from '../components/dashboard/CurrentShiftSection';
import { ClinicalFeedSection } from '../components/dashboard/ClinicalFeedSection';
import { MedsOrdersSection } from '../components/dashboard/MedsOrdersSection';
import { WardSection } from '../components/dashboard/WardSection';
import { PatientOverviewSection } from '../components/dashboard/PatientOverviewSection';
import { EmergencyModal } from '../components/dashboard/EmergencyModal';
import { NewPatientModal } from '../components/dashboard/NewPatientModal';
import { DashboardSkeletonLayout } from '../components/dashboard/DashboardSkeleton';
import '../components/dashboard/Dashboard.css';
import { useLanguage } from '../contexts/LanguageContext';
import toolRegistry from '../data/toolRegistry';
import { useToolPreferences } from '../contexts/ToolPreferencesContext';

/**
 * Dashboard Page - Clinical Command Center
 * Central hub for clinical overview, quick tool access, and patient monitoring
 */
function Dashboard() {
  const { user, signOut } = useUser();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tr = useCallback((key, fallback) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  }, [t]);
  const { favorites, recentTools, recordToolAccess } = useToolPreferences();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();
  
  // Dashboard data and methods from custom hook
  const {
    stats,
    alerts,
    criticalPatients,
    workload,
    cdsReminders,
    activities,
    marMedications,
    onCallRoster,
    bedBoard,
    labTimeline,
    loading,
    refreshing,
    error,
    connectionState,
    acknowledgeAlert,
    trackToolAccess,
    toggleTask,
    refresh,
    setPatientFilters,
    placeOrder,
    createPatient,
  } = useDashboard();

  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState('critical');
  const [expandedPatients, setExpandedPatients] = useState(new Set());
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  useEffect(() => {
    const prefetchLandingRoutes = () => {
      void import('./Settings');
      void import('./AnalyticsDashboard');
      void import('./team/TeamManagement');
      void import('./tools/ToolsOverview');
      void import('./Chat');
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetchLandingRoutes, { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(prefetchLandingRoutes, 1000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event) => setIsMobile(event.matches);
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setPatientFilters({
        status: patientStatusFilter,
        search: patientSearch.trim(),
        limit: 20,
      });
    }, 250);

    return () => clearTimeout(handle);
  }, [patientSearch, patientStatusFilter, setPatientFilters]);

  const statusOptions = useMemo(
    () => [
      { id: 'all', label: tr('dashboard.all', 'All') },
      { id: 'critical', label: tr('dashboard.critical', 'Critical') },
      { id: 'urgent', label: tr('dashboard.urgent', 'Urgent') },
      { id: 'stable', label: tr('dashboard.stable', 'Stable') },
    ],
    [tr]
  );

  const sectionTitle = useMemo(() => {
    const current = statusOptions.find((option) => option.id === patientStatusFilter);
    if (!current || current.id === 'all') return tr('dashboard.patients', 'Patients');
    return `${current.label} Patients`;
  }, [patientStatusFilter, statusOptions, tr]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAcknowledgeAlert = useCallback((alertId) => {
    acknowledgeAlert(alertId);
  }, [acknowledgeAlert]);

  const handleAlertClick = useCallback((alert) => {
    // Navigate to patient context in chat with the alert info
    navigate('/chat', { state: { patientId: alert.patientId, alertId: alert.id } });
  }, [navigate]);

  const handleViewPatientDetails = useCallback((patientId) => {
    navigate('/chat', { state: { patientId, view: 'details' } });
  }, [navigate]);

  const handleUpdateVitals = useCallback((patientId) => {
    navigate('/chat', { state: { patientId, action: 'updateVitals' } });
  }, [navigate]);

  const handleAddNote = useCallback((patientId) => {
    navigate('/chat', { state: { patientId, action: 'addNote' } });
  }, [navigate]);



  // Show loading state
  if (loading) {
    return (
      <AppShell
        isAuthed={true}
        conversations={[]}
        activeConversation={null}
        onSelectConversation={() => {}}
        onNewConversation={() => {}}
        onSignOut={signOut}
        healthStatus="online"
      >
        <div className="dashboard-container">
          <DashboardHeader
            userName={user?.name || 'Clinician'}
            searchValue=""
            onSearchChange={() => {}}
            onSearch={() => {}}
            onSearchSubmit={() => {}}
            onRefresh={() => {}}
            refreshing={false}
          />
          <DashboardSkeletonLayout />
        </div>
      </AppShell>
    );
  }

  // Show error state
  if (error) {
    return (
      <AppShell
        isAuthed={true}
        conversations={[]}
        activeConversation={null}
        onSelectConversation={() => {}}
        onNewConversation={() => {}}
        onSignOut={signOut}
        healthStatus="online"
      >
        <div style={{
          padding: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: 'var(--space-3)'
            }}>
              ⚠️
            </div>
            <h2 style={{
              margin: 0,
              marginBottom: 'var(--space-2)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-xl)'
            }}>
              {t('dashboard.failedToLoad')}
            </h2>
            <p style={{
              margin: 0,
              marginBottom: 'var(--space-4)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-base)'
            }}>
              {error}
            </p>
            <button
              onClick={refresh}
              style={{
                padding: '10px 20px',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: '#fff',
                background: 'var(--clinical-primary)',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer'
              }}
            >
              {t('dashboard.tryAgain')}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      isAuthed={true}
      conversations={[]}
      activeConversation={null}
      onSelectConversation={() => {}}
      onNewConversation={() => {}}
      onSignOut={signOut}
      healthStatus="online"
    >
      <div className="dashboard-container" role="main" aria-label="Clinical Dashboard">
        {/* Dashboard Header */}
        <DashboardHeader
          userName={user?.name || 'Clinician'}
          searchValue={patientSearch}
          onSearchChange={setPatientSearch}
          onSearch={(query) => setPatientSearch(query)}
          onSearchSubmit={(query) => setPatientSearch(query)}
          onRefresh={refresh}
          refreshing={refreshing}
          connectionState={connectionState}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={markAsRead}
          onMarkAllRead={markAllAsRead}
          onClearAll={clearAll}
          onNewPatient={() => setShowNewPatientModal(true)}
          onEmergency={() => setShowEmergencyModal(true)}
        />

        <CurrentShiftSection
          tr={tr}
          cdsReminders={cdsReminders}
          stats={stats}
          alerts={alerts}
          handleAcknowledgeAlert={handleAcknowledgeAlert}
          handleAlertClick={handleAlertClick}
          workload={workload}
          toggleTask={toggleTask}
          toolRegistry={toolRegistry}
          favorites={favorites}
          recentTools={recentTools}
          recordToolAccess={recordToolAccess}
          trackToolAccess={trackToolAccess}
          navigate={navigate}
          isMobile={isMobile}
        />

        <ClinicalFeedSection
          tr={tr}
          activities={activities}
          labEvents={labTimeline}
          onActivityClick={(a) => navigate('/chat', { state: { activityId: a?.id } })}
        />

        <MedsOrdersSection
          tr={tr}
          medications={marMedications}
          patients={(criticalPatients || []).map(p => ({ id: p.id, name: p.name }))}
          onPlaceOrder={placeOrder}
        />

        <WardSection
          tr={tr}
          beds={bedBoard?.beds || []}
          roster={onCallRoster}
          activities={activities}
        />

        <PatientOverviewSection
          tr={tr}
          sectionTitle={sectionTitle}
          criticalPatients={criticalPatients}
          patientStatusFilter={patientStatusFilter}
          statusOptions={statusOptions}
          setPatientStatusFilter={setPatientStatusFilter}
          patientSearch={patientSearch}
          setPatientSearch={setPatientSearch}
          expandedPatients={expandedPatients}
          setExpandedPatients={setExpandedPatients}
          handleViewPatientDetails={handleViewPatientDetails}
          handleUpdateVitals={handleUpdateVitals}
          handleAddNote={handleAddNote}
        />
      </div>

      <NewPatientModal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        onSave={createPatient}
      />
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        patients={(criticalPatients || []).map(p => ({ id: p.id, name: p.name, room: p.room }))}
      />
    </AppShell>
  );
}

export default Dashboard;
