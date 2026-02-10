import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function GDPRNotice() {
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
            {t('gdpr.back')}
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
            {t('gdpr.title')}
          </h1>
          <p style={{ color: 'var(--muted-text)' }}>
            {t('gdpr.subtitle')}
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
              {t('gdpr.dataProtectionRights')}
            </h2>
            <p style={{ color: 'var(--muted-text)', marginBottom: '8px' }}>
              {t('gdpr.dataProtectionRightsIntro')}
            </p>
            <ul style={{ color: 'var(--muted-text)', paddingLeft: '20px' }}>
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Request deletion (Right to be Forgotten)</li>
              <li>Restrict data processing</li>
              <li>Data portability</li>
              <li>Object to processing</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
              {t('gdpr.dataProcessing')}
            </h2>
            <p style={{ color: 'var(--muted-text)' }}>
              {t('gdpr.dataProcessingText')}
            </p>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
              {t('gdpr.dataRetention')}
            </h2>
            <p style={{ color: 'var(--muted-text)' }}>
              {t('gdpr.dataRetentionText')}
            </p>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
              {t('gdpr.internationalTransfers')}
            </h2>
            <p style={{ color: 'var(--muted-text)' }}>
              {t('gdpr.internationalTransfersText')}
            </p>
          </div>

          <div style={{
            background: 'var(--accent-10)',
            border: '1px solid var(--accent-20)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '32px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent)' }}>{t('gdpr.contactDPO')}</h3>
            <p style={{ margin: '0', color: 'var(--muted-text)', fontSize: '14px' }}>
              {t('gdpr.contactDPOText')} <a href="mailto:dpo@caredroid.ai" style={{ color: 'var(--accent)' }}>dpo@caredroid.ai</a>
            </p>
          </div>

          <p style={{ color: 'var(--muted-text)', fontSize: '13px' }}>
            {t('gdpr.lastUpdated')}
          </p>
        </div>
      </div>
    </div>
  );
}
