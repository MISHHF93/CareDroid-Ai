import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import './ConsentHistory.css';

/**
 * ConsentHistory Component
 * 
 * Displays user's consent history for audit and compliance purposes
 * Shows all consent events with timestamps and IP addresses
 */
export const ConsentHistory = () => {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsentHistory();
  }, []);

  const fetchConsentHistory = async () => {
    try {
      const response = await fetch('/api/consent/history', {
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
      console.error('Error fetching consent history:', err);
      setError('Failed to load consent history');
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
        <p>Loading consent history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="consent-history-error">
        <EmptyState
          icon="⚠️"
          title="Error Loading Consent History"
          message={error}
          action={{
            label: 'Try Again',
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
          title="No Consent Records"
          message="You haven't provided any consents yet"
          action={{
            label: 'Provide Consent',
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
          <h1>Consent History</h1>
          <p className="consent-history-intro">
            Your complete consent and authorization history as required by HIPAA. 
            All consent actions are permanently logged for audit purposes.
          </p>
        </div>

        <div className="consent-history-actions">
          <Link to="/privacy" className="btn-consent-link">
            View Privacy Policy
          </Link>
          <Link to="/terms" className="btn-consent-link">
            View Terms of Service
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
                  {consent.action === 'granted' ? 'Consented' : 'Revoked'}
                </span>
              </div>

              <div className="consent-record-body">
                <h3>Consent Event</h3>
                <div className="consent-record-details">
                  {Object.entries(consent.consents || {}).map(([key, value]) => (
                    <div key={key} className="consent-detail-item">
                      <span className="consent-detail-label">{getConsentLabel(key)}:</span>
                      <span className={`consent-detail-value consent-detail-value-${value ? 'yes' : 'no'}`}>
                        {value ? '✓ Accepted' : '✗ Declined'}
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
            <h3>About Consent Records</h3>
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
              Manage Consents
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
              Export as JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
