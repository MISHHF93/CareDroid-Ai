import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './ClinicalAlertsPage.css';

const ClinicalAlertsPage = () => {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    const mockAlerts = [
      {
        id: 'alert-1',
        timestamp: new Date(Date.now() - 3600000),
        severity: 'critical',
        title: 'Critical SOFA Score',
        description: 'Patient shows signs of multiple organ dysfunction',
        source: 'SOFA Calculator',
        status: 'unacknowledged',
        findings: ['SOFA Score: 15/24', 'Mortality risk: High']
      },
      {
        id: 'alert-2',
        timestamp: new Date(Date.now() - 7200000),
        severity: 'high',
        title: 'Abnormal Lab Values',
        description: '3 critical laboratory values detected',
        source: 'Lab Interpreter',
        status: 'acknowledged',
        findings: ['K+: 6.8 mEq/L', 'pH: 7.25', 'HCO3-: 18 mEq/L']
      },
      {
        id: 'alert-3',
        timestamp: new Date(Date.now() - 86400000),
        severity: 'moderate',
        title: 'Kidney Dysfunction Alert',
        description: 'GFR indicates moderate to severe kidney disease',
        source: 'GFR Calculator',
        status: 'acknowledged',
        findings: ['GFR: 28 mL/min/1.73m²', 'CKD Stage: 3b']
      }
    ];

    setAlerts(mockAlerts);
    setFilteredAlerts(mockAlerts);
  }, []);

  // Filter alerts
  useEffect(() => {
    let filtered = alerts;

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(a => a.severity === selectedSeverity);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        a =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAlerts(filtered);
  }, [selectedSeverity, searchTerm, alerts]);

  const handleAcknowledge = (alertId) => {
    setAlerts(alerts =>
      alerts.map(a =>
        a.id === alertId ? { ...a, status: 'acknowledged' } : a
      )
    );
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🔴',
      high: '🟠',
      moderate: '🟡',
      low: '🟢',
      warning: '⚠️'
    };
    return icons[severity] || '■';
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return t('clinicalAlerts.justNow');
    if (hours < 24) return `${hours}${t('clinicalAlerts.hoursAgo')}`;
    if (days < 7) return `${days}${t('clinicalAlerts.daysAgo')}`;
    return new Date(date).toLocaleDateString();
  };

  const unacknowledgedCount = alerts.filter(a => a.status === 'unacknowledged').length;

  return (
    <div className="clinical-alerts-page">
      <div className="alerts-header">
        <h1>{t('clinicalAlerts.title')}</h1>
        <p>{t('clinicalAlerts.subtitle')}</p>
      </div>

      <div className="alerts-controls">
        <div className="control-group">
          <label htmlFor="search">{t('clinicalAlerts.searchAlerts')}</label>
          <input
            id="search"
            type="text"
            placeholder={t('clinicalAlerts.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="control-group">
          <label htmlFor="severity">{t('clinicalAlerts.filterBySeverity')}</label>
          <select
            id="severity"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="severity-select"
          >
            <option value="all">{t('clinicalAlerts.allSeverities')}</option>
            <option value="critical">{t('clinicalAlerts.critical')}</option>
            <option value="high">{t('clinicalAlerts.high')}</option>
            <option value="moderate">{t('clinicalAlerts.moderate')}</option>
            <option value="low">{t('clinicalAlerts.low')}</option>
          </select>
        </div>

        <div className="control-group">
          <label>{t('clinicalAlerts.summary')}</label>
          <div className="summary-badges">
            <span className="summary-badge total">
              {t('clinicalAlerts.total')}: <strong>{alerts.length}</strong>
            </span>
            <span className="summary-badge unacknowledged">
              {t('clinicalAlerts.pending')}: <strong>{unacknowledgedCount}</strong>
            </span>
            <span className="summary-badge acknowledged">
              {t('clinicalAlerts.acknowledgedLabel')}: <strong>{alerts.length - unacknowledgedCount}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="alerts-timeline">
        <div className="timeline-title">{t('clinicalAlerts.alertTimeline')}</div>
        {filteredAlerts.length > 0 ? (
          <div className="alerts-list">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className={`alert-card severity-${alert.severity} status-${alert.status}`}>
                <div className="card-header">
                  <div className="alert-meta">
                    <span className="severity-icon">{getSeverityIcon(alert.severity)}</span>
                    <div className="alert-info">
                      <h3 className="alert-title">{alert.title}</h3>
                      <p className="alert-description">{alert.description}</p>
                      <div className="alert-source">
                        <span className="badge-source">{alert.source}</span>
                        <span className="badge-time">{formatTime(alert.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="alert-status-badge" title={alert.status}>
                    {alert.status === 'acknowledged' ? '✓' : '!'}
                  </div>
                </div>

                {alert.findings && alert.findings.length > 0 && (
                  <div className="card-findings">
                    <div className="findings-label">{t('clinicalAlerts.keyFindings')}</div>
                    <ul className="findings-list">
                      {alert.findings.map((finding, idx) => (
                        <li key={idx}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="card-actions">
                  {alert.status === 'unacknowledged' && (
                    <button
                      className="btn-acknowledge"
                      onClick={() => handleAcknowledge(alert.id)}
                      title="Mark as reviewed"
                    >
                      ✓ {t('clinicalAlerts.acknowledge')}
                    </button>
                  )}
                  {alert.status === 'acknowledged' && (
                    <span className="status-text">{t('clinicalAlerts.acknowledgedStatus')}</span>
                  )}
                  <button className="btn-export" title={t('clinicalAlerts.exportTitle')}>
                    📥 {t('clinicalAlerts.export')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <h3>{t('clinicalAlerts.noAlertsFound')}</h3>
            <p>{t('clinicalAlerts.noAlertsMessage')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalAlertsPage;
