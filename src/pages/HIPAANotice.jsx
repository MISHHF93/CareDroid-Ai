import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function HIPAANotice() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100vw',
      background: 'var(--navy-bg)',
      color: 'var(--text-color)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--panel-border)',
              borderRadius: '6px',
              color: 'var(--text-color)',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            {t('hipaa.back')}
          </button>
          
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '12px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {t('hipaa.title')}
          </h1>
          <p style={{ color: 'var(--muted-text)' }}>
            {t('hipaa.subtitle')}
          </p>
        </div>

        {/* Content */}
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--panel-border)',
          borderRadius: '12px',
          padding: '32px',
          lineHeight: '1.8'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
              {t('hipaa.phiTitle')}
            </h2>
            <p style={{ color: 'var(--muted-text)', marginBottom: '8px' }}>
              {t('hipaa.phiText')}
            </p>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
              {t('hipaa.privacySafeguards')}
            </h2>
            <p style={{ color: 'var(--muted-text)', marginBottom: '8px' }}>
              {t('hipaa.privacySafeguardsIntro')}
            </p>
            <ul style={{ color: 'var(--muted-text)', paddingLeft: '20px' }}>
              <li>Administrative safeguards: Policies and procedures for access controls</li>
              <li>Physical safeguards: Facility and equipment access controls</li>
              <li>Technical safeguards: Encryption, authentication, audit controls</li>
              <li>Transmission security: Encrypted communications</li>
            </ul>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
              {t('hipaa.breachNotification')}
            </h2>
            <p style={{ color: 'var(--muted-text)' }}>
              {t('hipaa.breachNotificationText')}
            </p>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
              {t('hipaa.patientRights')}
            </h2>
            <p style={{ color: 'var(--muted-text)', marginBottom: '8px' }}>
              {t('hipaa.patientRightsIntro')}
            </p>
            <ul style={{ color: 'var(--muted-text)', paddingLeft: '20px' }}>
              <li>Request access to your PHI</li>
              <li>Receive an accounting of disclosures</li>
              <li>Request amendment of your records</li>
              <li>Request restrictions on use and disclosure</li>
              <li>Request confidential communications</li>
            </ul>
          </div>

          <div style={{
            background: 'var(--accent-10)',
            border: '1px solid var(--accent-20)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '32px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent)' }}>{t('hipaa.privacyOfficer')}</h3>
            <p style={{ margin: '0', color: 'var(--muted-text)', fontSize: '14px' }}>
              {t('hipaa.privacyOfficerText')} <a href="mailto:hipaa@caredroid.ai" style={{ color: 'var(--accent)' }}>hipaa@caredroid.ai</a>
            </p>
          </div>

          <p style={{ color: 'var(--muted-text)', fontSize: '13px' }}>
            {t('hipaa.lastUpdated')}
          </p>
        </div>
      </div>
    </div>
  );
}
