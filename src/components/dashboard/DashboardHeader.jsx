import React from 'react';
import { Button } from '../ui/atoms/Button';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * DashboardHeader - Top header section of the dashboard
 * Displays greeting, quick actions, and system status
 */
export const DashboardHeader = ({
  userName = 'User',

  onNewPatient,
  onEmergency,
  onSearch,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  systemStatus = 'online',
  onRefresh,
  refreshing = false,
  autoRefresh = true,
  connectionState = 'disconnected'
}) => {
  const { t } = useLanguage();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const statusColors = {
    online: '#10B981',
    offline: '#EF4444',
    degraded: '#F59E0B'
  };

  return (
    <header style={{
      padding: 'var(--space-6) 0',
      borderBottom: '1px solid var(--border-subtle)',
      marginBottom: 'var(--space-6)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        flexWrap: 'wrap'
      }}>
        {/* Left: Greeting */}
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{
            margin: 0,
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-1)'
          }}>
            {getGreeting()}, {userName}
          </h1>
          <p style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span>{getFormattedDate()}</span>
          </p>
        </div>

        {/* Right: Actions and Notifications */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flex: '0 0 auto'
        }}>
          {onSearchChange && (
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onSearchSubmit?.(searchValue);
                  }
                }}
                placeholder={t('dashboard.searchPatients')}
                aria-label={t('dashboard.searchPatients')}
                style={{
                  width: '220px',
                  padding: '8px 12px',
                  fontSize: 'var(--font-size-sm)',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-1)'
                }}
              />
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={onNewPatient}
          >
            <span style={{ marginRight: '6px' }}>+</span>
            {t('dashboard.newPatient')}
          </Button>

          <Button
            variant="danger"
            size="md"
            onClick={onEmergency}
          >
            <span style={{ marginRight: '6px' }}>🚨</span>
            {t('dashboard.emergency')}
          </Button>

          {/* Live indicator — shows SSE connection status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: 'var(--font-size-xs)',
              color: connectionState === 'connected' ? '#10B981'
                   : connectionState === 'connecting' ? '#F59E0B'
                   : 'var(--text-tertiary)',
              borderRadius: '999px',
              border: '1px solid',
              borderColor: connectionState === 'connected' ? 'rgba(16, 185, 129, 0.3)'
                         : connectionState === 'connecting' ? 'rgba(245, 158, 11, 0.3)'
                         : 'var(--border-subtle)',
              background: connectionState === 'connected' ? 'rgba(16, 185, 129, 0.08)'
                        : connectionState === 'connecting' ? 'rgba(245, 158, 11, 0.08)'
                        : 'transparent',
              transition: 'all 0.3s ease'
            }}
            title={connectionState === 'connected'
              ? t('dashboard.realtimeActive')
              : connectionState === 'connecting'
              ? t('dashboard.connectingStream')
              : t('dashboard.disconnectedReconnect')}
            aria-label={`Real-time status: ${connectionState}`}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connectionState === 'connected' ? '#10B981'
                        : connectionState === 'connecting' ? '#F59E0B'
                        : 'var(--text-tertiary)',
              animation: connectionState === 'connected' ? 'livePulse 2s ease-in-out infinite'
                       : connectionState === 'connecting' ? 'livePulse 0.8s ease-in-out infinite'
                       : 'none',
              flexShrink: 0
            }} />
            {connectionState === 'connected' ? t('dashboard.live')
             : connectionState === 'connecting' ? t('dashboard.connecting')
             : t('status.offline')}
          </div>

        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
