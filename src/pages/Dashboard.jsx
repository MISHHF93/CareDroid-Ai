import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useToolPreferences } from '../contexts/ToolPreferencesContext';
import { useDashboard } from '../hooks/useDashboard';
import AppShell from '../layout/AppShell';
import toolRegistry from '../data/toolRegistry';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { ToolCard } from '../components/dashboard/ToolCard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { PatientCard } from '../components/clinical/PatientCard';

/**
 * Dashboard Page - Clinical Command Center
 * Central hub for clinical overview, quick tool access, and patient monitoring
 */
function Dashboard() {
  const { user, signOut } = useUser();
  const navigate = useNavigate();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();
  const { favorites, recentTools, recordToolAccess } = useToolPreferences();
  
  // Dashboard data and methods from custom hook
  const {
    stats,
    activities,
    alerts,
    criticalPatients,
    loading,
    refreshing,
    error,
    acknowledgeAlert,
    trackToolAccess,
    refresh,
    setPatientFilters
  } = useDashboard();

  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState('critical');
  const [expandedPatients, setExpandedPatients] = useState(new Set());

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
      { id: 'all', label: 'All' },
      { id: 'critical', label: 'Critical' },
      { id: 'urgent', label: 'Urgent' },
      { id: 'stable', label: 'Stable' },
    ],
    []
  );

  const sectionTitle = useMemo(() => {
    const current = statusOptions.find((option) => option.id === patientStatusFilter);
    if (!current || current.id === 'all') return 'Patients';
    return `${current.label} Patients`;
  }, [patientStatusFilter, statusOptions]);

  const allExpanded = useMemo(() => {
    if (!criticalPatients.length) return false;
    return criticalPatients.every((patient) => expandedPatients.has(patient.id));
  }, [criticalPatients, expandedPatients]);


  const handleToolClick = useCallback((tool) => {
    recordToolAccess(tool.id);
    trackToolAccess(tool.id);
    navigate(tool.path);
  }, [navigate, recordToolAccess, trackToolAccess]);

  const handleAcknowledgeAlert = useCallback((alertId) => {
    acknowledgeAlert(alertId);
  }, [acknowledgeAlert]);

  const handleActivityClick = useCallback((activity) => {
    console.log('Activity clicked:', activity);
    // TODO: Navigate to relevant page
  }, []);

  const handleAlertClick = useCallback((alert) => {
    console.log('Alert clicked:', alert);
    // TODO: Navigate to patient details
  }, []);

  const handleViewPatientDetails = useCallback((patientId) => {
    console.log('View patient:', patientId);
    // TODO: Navigate to patient details page
  }, []);

  const handleUpdateVitals = useCallback((patientId) => {
    console.log('Update vitals:', patientId);
    // TODO: Open vitals update modal
  }, []);

  const handleAddNote = useCallback((patientId) => {
    console.log('Add note:', patientId);
    // TODO: Open note entry modal
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
        <div style={{
          padding: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <div style={{
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: 'var(--space-3)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              ⏳
            </div>
            <div style={{ fontSize: 'var(--font-size-lg)' }}>
              Loading dashboard...
            </div>
          </div>
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
              Failed to Load Dashboard
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
              Try Again
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

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
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        animation: 'fadeIn 0.4s var(--ease-smooth)'
      }}>
        {/* Dashboard Header */}
        <DashboardHeader
          userName={user?.name || 'Clinician'}
          notificationCount={unreadCount}
          notifications={notifications}
          onNewPatient={() => console.log('New patient')}
          onEmergency={() => console.log('Emergency')}
          searchValue={patientSearch}
          onSearchChange={setPatientSearch}
          onSearch={(query) => setPatientSearch(query)}
          onSearchSubmit={(query) => setPatientSearch(query)}
          onNotificationClick={() => console.log('Notifications')}
          onMarkNotificationRead={markAsRead}
          onMarkAllNotificationsRead={markAllAsRead}
          onClearNotifications={clearAll}
          systemStatus="online"
          onRefresh={refresh}
          refreshing={refreshing}
        />

        {/* Stats Cards Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          animation: 'slideUp 0.4s var(--ease-smooth)',
          animationDelay: '0.05s',
          animationFillMode: 'both'
        }}>
          <StatCard
            label="Critical Patients"
            value={stats?.criticalPatients || 0}
            trend={stats?.trends?.criticalPatients?.value ? `${stats.trends.criticalPatients.value > 0 ? '+' : ''}${stats.trends.criticalPatients.value}` : undefined}
            trendDirection={stats?.trends?.criticalPatients?.direction}
            color="critical"
            icon="🚨"
          />
          <StatCard
            label="Active Patients"
            value={stats?.activePatients || 0}
            trend={stats?.trends?.activePatients?.value ? `${stats.trends.activePatients.value > 0 ? '+' : ''}${stats.trends.activePatients.value}` : undefined}
            trendDirection={stats?.trends?.activePatients?.direction}
            color="info"
            icon="👥"
          />
          <StatCard
            label="Pending Labs"
            value={stats?.pendingLabs || 0}
            color="warning"
            icon="🧪"
          />
          <StatCard
            label="Stable Patients"
            value={stats?.stablePatients || 0}
            color="success"
            icon="✅"
          />
        </div>

        {/* Quick Access Tools Grid */}
        <div style={{
          animation: 'slideUp 0.4s var(--ease-smooth)',
          animationDelay: '0.1s',
          animationFillMode: 'both'
        }}>
          <h2 style={{
            margin: 0,
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)'
          }}>
            Clinical Tools
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-4)'
          }}>
            {toolRegistry.map((tool) => (
              <ToolCard
                key={tool.id}
                icon={tool.icon}
                name={tool.name}
                description={tool.description}
                color={tool.color}
                shortcut={tool.shortcut}
                onClick={() => handleToolClick(tool)}
                isFavorite={favorites.includes(tool.id)}
                recentlyUsed={recentTools.includes(tool.id)}
              />
            ))}
          </div>
        </div>

        {/* Activity Feed and Alerts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-4)',
          animation: 'slideUp 0.4s var(--ease-smooth)',
          animationDelay: '0.15s',
          animationFillMode: 'both'
        }}>
          <ActivityFeed
            activities={activities}
            onActivityClick={handleActivityClick}
          />
          <AlertsPanel
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onAlertClick={handleAlertClick}
          />
        </div>

        {/* Patients Section */}
        <div style={{
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
                  {allExpanded ? 'Collapse All' : 'Expand All'}
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
                  placeholder="Search patients..."
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
              <p style={{ margin: 0 }}>No patients match the current filters.</p>
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
        </div>
      </div>
    </AppShell>
  );
}

export default Dashboard;
