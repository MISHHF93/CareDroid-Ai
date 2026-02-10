import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useDashboard } from '../hooks/useDashboard';
import AppShell from '../layout/AppShell';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { CommandFeed } from '../components/dashboard/CommandFeed';
import { SmartTriageQueue } from '../components/dashboard/SmartTriageQueue';
import { MyWorkload } from '../components/dashboard/MyWorkload';
import { QuickOrders } from '../components/dashboard/QuickOrders';
import { MARPreview } from '../components/dashboard/MARPreview';
import { OnCallRoster } from '../components/dashboard/OnCallRoster';
import { ClinicalBanner } from '../components/dashboard/ClinicalBanner';
import { BedBoard } from '../components/dashboard/BedBoard';
import { LabTimeline } from '../components/dashboard/LabTimeline';
import { PatientCard } from '../components/clinical/PatientCard';
import WidgetErrorBoundary from '../components/dashboard/WidgetErrorBoundary';
import { DashboardSkeletonLayout } from '../components/dashboard/DashboardSkeleton';
import { NewPatientModal } from '../components/dashboard/NewPatientModal';
import { EmergencyModal } from '../components/dashboard/EmergencyModal';
import '../components/dashboard/Dashboard.css';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Dashboard Page - Clinical Command Center
 * Central hub for clinical overview, quick tool access, and patient monitoring
 */
function Dashboard() {
  const { user, signOut } = useUser();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();
  
  // Dashboard data and methods from custom hook
  const {
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
    loading,
    refreshing,
    error,
    connectionState,
    acknowledgeAlert,
    trackToolAccess,
    toggleTask,
    placeOrder,
    createPatient,
    refresh,
    setPatientFilters
  } = useDashboard();

  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState('critical');
  const [expandedPatients, setExpandedPatients] = useState(new Set());
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

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
      { id: 'all', label: t('dashboard.all') },
      { id: 'critical', label: t('dashboard.critical') },
      { id: 'urgent', label: t('dashboard.urgent') },
      { id: 'stable', label: t('dashboard.stable') },
    ],
    [t]
  );

  const sectionTitle = useMemo(() => {
    const current = statusOptions.find((option) => option.id === patientStatusFilter);
    if (!current || current.id === 'all') return t('dashboard.patients');
    return `${current.label} Patients`;
  }, [patientStatusFilter, statusOptions]);

  const allExpanded = useMemo(() => {
    if (!criticalPatients.length) return false;
    return criticalPatients.every((patient) => expandedPatients.has(patient.id));
  }, [criticalPatients, expandedPatients]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sparkline data (from API or fallback 7-day trends)
  const sparklines = useMemo(() => ({
    critical: stats?.sparklines?.criticalPatients || [3, 2, 4, 3, 5, 4, stats?.criticalPatients || 0],
    active: stats?.sparklines?.activePatients || [18, 20, 19, 22, 21, 23, stats?.activePatients || 0],
    labs: stats?.sparklines?.pendingLabs || [8, 5, 12, 9, 7, 11, stats?.pendingLabs || 0],
    stable: stats?.sparklines?.stablePatients || [12, 13, 11, 14, 15, 14, stats?.stablePatients || 0],
  }), [stats]);

  // Build patient list for QuickOrders
  const patientList = useMemo(() =>
    (criticalPatients || []).map((p) => ({ id: p.id, name: p.name, room: p.room })),
    [criticalPatients]
  );

  const handleAcknowledgeAlert = useCallback((alertId) => {
    acknowledgeAlert(alertId);
  }, [acknowledgeAlert]);

  const handleActivityClick = useCallback((activity) => {
    // Navigate to the relevant clinical tool based on activity type
    const routes = { lab: '/tools/lab-interpreter', medication: '/tools/drug-checker', procedure: '/tools/procedures' };
    if (activity.patientId) {
      navigate('/chat', { state: { patientId: activity.patientId, activityType: activity.type } });
    } else if (routes[activity.type]) {
      navigate(routes[activity.type]);
    }
  }, [navigate]);

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

  const handlePageClinician = useCallback((clinician) => {
    navigate('/chat', { state: { action: 'page', clinicianId: clinician.id, clinicianName: clinician.name } });
  }, [navigate]);

  const handleMessageClinician = useCallback((clinician) => {
    navigate('/chat', { state: { action: 'message', clinicianId: clinician.id, clinicianName: clinician.name } });
  }, [navigate]);

  const handleViewLabResult = useCallback((event) => {
    navigate('/tools/lab-interpreter', { state: { labEventId: event.id, testName: event.test } });
  }, [navigate]);

  const handleAdministerMed = useCallback(async (med) => {
    // Optimistic — real implementation would call backend
    await new Promise((r) => setTimeout(r, 300));
  }, []);

  const handleViewFullMAR = useCallback(() => {
    navigate('/chat', { state: { action: 'viewMAR' } });
  }, [navigate]);

  const handleNewPatient = useCallback(() => {
    setShowNewPatient(true);
  }, []);

  const handleEmergency = useCallback(() => {
    setShowEmergency(true);
  }, []);

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
            onNewPatient={() => {}}
            onEmergency={() => {}}
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
          onNewPatient={handleNewPatient}
          onEmergency={handleEmergency}
          searchValue={patientSearch}
          onSearchChange={setPatientSearch}
          onSearch={(query) => setPatientSearch(query)}
          onSearchSubmit={(query) => setPatientSearch(query)}
          onRefresh={refresh}
          refreshing={refreshing}
          connectionState={connectionState}
        />

        {/* Clinical Decision Support Banner */}
        <WidgetErrorBoundary widgetName="Clinical Banner">
          <ClinicalBanner reminders={cdsReminders.length > 0 ? cdsReminders : undefined} />
        </WidgetErrorBoundary>

        {/* Stats Cards Row — with sparklines */}
        <div className="dashboard-stats-row dashboard-row-enter">
          <WidgetErrorBoundary widgetName="Critical Patients">
            <StatCard
              label={t('dashboard.criticalPatients')}
              value={stats?.criticalPatients || 0}
              trend={stats?.trends?.criticalPatients?.value ? `${stats.trends.criticalPatients.value > 0 ? '+' : ''}${stats.trends.criticalPatients.value}` : undefined}
              trendDirection={stats?.trends?.criticalPatients?.direction}
              color="critical"
              icon="🚨"
              sparklineData={sparklines.critical}
            />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="Active Patients">
            <StatCard
              label={t('dashboard.activePatients')}
              value={stats?.activePatients || 0}
              trend={stats?.trends?.activePatients?.value ? `${stats.trends.activePatients.value > 0 ? '+' : ''}${stats.trends.activePatients.value}` : undefined}
              trendDirection={stats?.trends?.activePatients?.direction}
              color="info"
              icon="👥"
              sparklineData={sparklines.active}
            />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="Pending Labs">
            <StatCard
              label={t('dashboard.pendingLabs')}
              value={stats?.pendingLabs || 0}
              color="warning"
              icon="🧪"
              sparklineData={sparklines.labs}
            />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="Stable Patients">
            <StatCard
              label={t('dashboard.stablePatients')}
              value={stats?.stablePatients || 0}
              color="success"
              icon="✅"
              sparklineData={sparklines.stable}
            />
          </WidgetErrorBoundary>
        </div>

        {/* Row 1: Command Feed + Triage Queue */}
        <div className="dashboard-row-2col dashboard-row-enter">
          <WidgetErrorBoundary widgetName="Command Feed">
            <CommandFeed
              activities={activities}
              onActivityClick={handleActivityClick}
            />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="Triage Queue">
            <SmartTriageQueue
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onAlertClick={handleAlertClick}
            />
          </WidgetErrorBoundary>
        </div>

        {/* Row 2: My Workload + Quick Orders + MAR Preview */}
        <div className="dashboard-row-3col dashboard-row-enter">
          <WidgetErrorBoundary widgetName="My Workload">
            <MyWorkload
              tasks={workload?.tasks}
              shiftEnd={workload?.shiftEnd}
              onToggleTask={toggleTask}
            />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="Quick Orders">
            <QuickOrders patients={patientList} onPlaceOrder={placeOrder} />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="MAR Preview">
            <MARPreview
              medications={marMedications.length > 0 ? marMedications : undefined}
              onAdminister={handleAdministerMed}
              onViewMAR={handleViewFullMAR}
            />
          </WidgetErrorBoundary>
        </div>

        {/* Row 3: On-Call Roster + Lab Timeline + Bed Board */}
        <div className="dashboard-row-3col dashboard-row-enter">
          <WidgetErrorBoundary widgetName="On-Call Roster">
            <OnCallRoster
              roster={onCallRoster.length > 0 ? onCallRoster : undefined}
              onPage={handlePageClinician}
              onMessage={handleMessageClinician}
            />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="Lab Timeline">
            <LabTimeline
              events={labTimeline.length > 0 ? labTimeline : undefined}
              onViewResult={handleViewLabResult}
            />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="Bed Board">
            <BedBoard beds={bedBoard?.beds} unit={bedBoard?.unit} />
          </WidgetErrorBoundary>
        </div>

        {/* Patients Section */}
        <section aria-label="Patient list" style={{
          animation: 'slideUp 0.4s var(--ease-smooth)',
          animationDelay: '0.2s',
          animationFillMode: 'both'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)'
                }}>
                  {sectionTitle}
                </h2>
                <span style={{
                  padding: '4px 12px',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: '#fff',
                  background: patientStatusFilter === 'critical' ? '#EF4444' : 'var(--clinical-info)',
                  borderRadius: '999px'
                }}>
                  {criticalPatients.length}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <button
                  onClick={() => {
                    if (allExpanded) {
                      setExpandedPatients(new Set());
                    } else {
                      setExpandedPatients(new Set(criticalPatients.map((patient) => patient.id)));
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    borderRadius: '999px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {allExpanded ? t('dashboard.collapseAll') : t('dashboard.expandAll')}
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                gap: 'var(--space-2)',
                flexWrap: 'wrap'
              }}>
                {statusOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPatientStatusFilter(option.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      borderRadius: '999px',
                      border: option.id === patientStatusFilter
                        ? '1px solid var(--clinical-primary)'
                        : '1px solid var(--border-subtle)',
                      background: option.id === patientStatusFilter
                        ? 'var(--clinical-primary-light)'
                        : 'transparent',
                      color: option.id === patientStatusFilter
                        ? 'var(--clinical-primary)'
                        : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div style={{
                marginLeft: 'auto',
                flex: '1 1 240px',
                maxWidth: '320px'
              }}>
                <input
                  type="search"
                  placeholder={t('dashboard.searchPatientsPlaceholder')}
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    borderRadius: '999px',
                    border: '1px solid var(--border-subtle)',
                    outline: 'none',
                    background: 'var(--surface-1)'
                  }}
                />
              </div>
            </div>
          </div>

          {criticalPatients.length === 0 ? (
            <div style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <p style={{ margin: 0 }}>{t('dashboard.noMatchFilters')}</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)'
            }}>
              {criticalPatients.map((patient) => {
                const isExpanded = expandedPatients.has(patient.id);
                return (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    compact={!isExpanded}
                    showVitals={isExpanded}
                    showActions={isExpanded}
                    onClick={() => {
                      setExpandedPatients((prev) => {
                        const next = new Set(prev);
                        if (next.has(patient.id)) {
                          next.delete(patient.id);
                        } else {
                          next.add(patient.id);
                        }
                        return next;
                      });
                    }}
                    onViewDetails={handleViewPatientDetails}
                    onUpdateVitals={handleUpdateVitals}
                    onAddNote={handleAddNote}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
      <NewPatientModal
        isOpen={showNewPatient}
        onClose={() => setShowNewPatient(false)}
        onSave={createPatient}
      />
      <EmergencyModal
        isOpen={showEmergency}
        onClose={() => setShowEmergency(false)}
        patients={patientList}
      />
    </AppShell>
  );
}

export default Dashboard;
