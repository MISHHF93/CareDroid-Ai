import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiFetch } from '../../services/apiClient';
import './ConsentHistory.css';
import logger from '../../utils/logger';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * ConsentHistory Component
 * 
 * Displays user's consent history for audit and compliance purposes
 * Shows all consent events with timestamps and IP addresses
 */
export const ConsentHistory = () => {
  const { t } = useLanguage();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsentHistory();
  }, []);

  const fetchConsentHistory = async () => {
    try {
      const response = await apiFetch('/api/consent/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch consent history');
      }

      const data = await response.json();
      setConsents(data.consents || []);
    } catch (err) {
      logger.error('Error fetching consent history', { err });
      setError(t('legal.consentHistory.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  };

  const getConsentLabel = (key) => {
    const labels = {
      hipaa_authorization: 'HIPAA Authorization',
      privacy_policy: 'Privacy Policy',
      terms_of_service: 'Terms of Service',
      data_sharing: 'Anonymized Data for Research',
      marketing_communications: 'Communications Preferences',
    };
    return labels[key] || key;
  };

  if (loading) {
    return (
      <div className="consent-history-loading">
        <Spinner size="lg" />
        <p>{t('legal.consentHistory.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="consent-history-error">
        <EmptyState
          icon="⚠️"
          title={t('legal.consentHistory.errorTitle')}
          message={error}
          action={{
            label: t('legal.consentHistory.tryAgain'),
            onClick: fetchConsentHistory,
          }}
        />
      </div>
    );
  }

  if (consents.length === 0) {
    return (
      <div className="consent-history-empty">
        <EmptyState
          icon="📄"
          title={t('legal.consentHistory.noRecordsTitle')}
          message={t('legal.consentHistory.noRecordsMessage')}
          action={{
            label: t('legal.consentHistory.provideConsent'),
            onClick: () => window.location.href = '/consent',
          }}
        />
      </div>
    );
  }

  return (
    <div className="consent-history">
      <div className="consent-history-container">
        <div className="consent-history-header">
          <h1>{t('legal.consentHistory.title')}</h1>
          <p className="consent-history-intro">
            {t('legal.consentHistory.intro')}
          </p>
        </div>

        <div className="consent-history-actions">
          <Link to="/privacy" className="btn-consent-link">
            {t('legal.consentHistory.viewPrivacyPolicy')}
          </Link>
          <Link to="/terms" className="btn-consent-link">
            {t('legal.consentHistory.viewTerms')}
          </Link>
        </div>

        <div className="consent-history-list">
          {consents.map((consent, index) => (
            <div key={consent.id || index} className="consent-record">
              <div className="consent-record-header">
                <div className="consent-record-date">
                  <span className="consent-record-icon">📅</span>
                  <span className="consent-record-timestamp">
                    {formatDate(consent.consentDate)}
                  </span>
                </div>
                <span className={`consent-record-status consent-record-status-${consent.action}`}>
                  {consent.action === 'granted' ? t('legal.consentHistory.consented') : t('legal.consentHistory.revoked')}
                </span>
              </div>

              <div className="consent-record-body">
                <h3>{t('legal.consentHistory.consentEvent')}</h3>
                <div className="consent-record-details">
                  {Object.entries(consent.consents || {}).map(([key, value]) => (
                    <div key={key} className="consent-detail-item">
                      <span className="consent-detail-label">{getConsentLabel(key)}:</span>
                      <span className={`consent-detail-value consent-detail-value-${value ? 'yes' : 'no'}`}>
                        {value ? `✓ ${t('legal.consentHistory.accepted')}` : `✗ ${t('legal.consentHistory.declined')}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="consent-record-footer">
                <div className="consent-record-meta">
                  <span title="IP Address">🌐 {consent.ipAddress || 'Unknown'}</span>
                  <span title="User Agent">💻 {consent.userAgent || 'Unknown device'}</span>
                  <span title="Record ID">🔑 {consent.id || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="consent-history-footer">
          <div className="consent-history-info">
            <h3>{t('legal.consentHistory.aboutTitle')}</h3>
            <p>
              As required by HIPAA, we maintain a permanent, tamper-proof audit log of all 
              consent actions. Records include:
            </p>
            <ul>
              <li>Timestamp (with timezone)</li>
              <li>IP address</li>
              <li>Device/browser information</li>
              <li>Consent status for each category</li>
            </ul>
            <p>
              You may request a complete copy of your consent history at any time by contacting{' '}
              <a href="mailto:privacy@caredroid.ai">privacy@caredroid.ai</a>.
            </p>
          </div>

          <div className="consent-history-actions-footer">
            <Link to="/consent" className="btn-consent-secondary">
              {t('legal.consentHistory.manageConsents')}
            </Link>
            <button
              className="btn-consent-export"
              onClick={() => {
                // Export consent history as JSON
                const dataStr = JSON.stringify(consents, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `consent-history-${new Date().toISOString()}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              {t('legal.consentHistory.exportJson')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
