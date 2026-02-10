import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function HelpCenter() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [expandedSection, setExpandedSection] = useState(null);

  const faqSections = [
    {
      title: t('help.faq.gettingStarted.title'),
      items: [
        {
          q: t('help.faq.gettingStarted.q1'),
          a: t('help.faq.gettingStarted.a1')
        },
        {
          q: t('help.faq.gettingStarted.q2'),
          a: t('help.faq.gettingStarted.a2')
        },
        {
          q: t('help.faq.gettingStarted.q3'),
          a: t('help.faq.gettingStarted.a3')
        }
      ]
    },
    {
      title: t('help.faq.clinicalTools.title'),
      items: [
        {
          q: t('help.faq.clinicalTools.q1'),
          a: t('help.faq.clinicalTools.a1')
        },
        {
          q: t('help.faq.clinicalTools.q2'),
          a: t('help.faq.clinicalTools.a2')
        },
        {
          q: t('help.faq.clinicalTools.q3'),
          a: t('help.faq.clinicalTools.a3')
        }
      ]
    },
    {
      title: t('help.faq.accountSecurity.title'),
      items: [
        {
          q: t('help.faq.accountSecurity.q1'),
          a: t('help.faq.accountSecurity.a1')
        },
        {
          q: t('help.faq.accountSecurity.q2'),
          a: t('help.faq.accountSecurity.a2')
        },
        {
          q: t('help.faq.accountSecurity.q3'),
          a: t('help.faq.accountSecurity.a3')
        }
      ]
    },
    {
      title: t('help.faq.privacy.title'),
      items: [
        {
          q: t('help.faq.privacy.q1'),
          a: t('help.faq.privacy.a1')
        },
        {
          q: t('help.faq.privacy.q2'),
          a: t('help.faq.privacy.a2')
        },
        {
          q: t('help.faq.privacy.q3'),
          a: t('help.faq.privacy.a3')
        }
      ]
    },
    {
      title: t('help.faq.troubleshooting.title'),
      items: [
        {
          q: t('help.faq.troubleshooting.q1'),
          a: t('help.faq.troubleshooting.a1')
        },
        {
          q: t('help.faq.troubleshooting.q2'),
          a: t('help.faq.troubleshooting.a2')
        },
        {
          q: t('help.faq.troubleshooting.q3'),
          a: t('help.faq.troubleshooting.a3')
        }
      ]
    }
  ];

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
            {t('help.back')}
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
            {t('help.title')}
          </h1>
          <p style={{ color: 'var(--muted-text)' }}>
            {t('help.subtitle')}
          </p>
        </div>

        {/* FAQ Sections */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {faqSections.map((section, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--panel-border)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: expandedSection === idx ? '1px solid var(--panel-border)' : 'none',
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  {section.title}
                </h2>
                <span style={{
                  fontSize: '20px',
                  transition: 'transform 0.2s',
                  transform: expandedSection === idx ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  ▼
                </span>
              </button>

              {expandedSection === idx && (
                <div style={{ padding: '20px 24px', background: 'var(--accent-10)' }}>
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {section.items.map((item, itemIdx) => (
                      <div key={itemIdx}>
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--accent)'
                        }}>
                          Q: {item.q}
                        </h3>
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          color: 'var(--muted-text)',
                          lineHeight: 1.6
                        }}>
                          A: {item.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div style={{
          marginTop: '40px',
          padding: '24px',
          background: 'var(--accent-10)',
          border: '1px solid var(--accent-20)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: 'var(--accent)' }}>
            {t('help.needHelp')}
          </h2>
          <p style={{ margin: '0 0 16px 0', color: 'var(--muted-text)', fontSize: '14px' }}>
            {t('help.contactSupport')}
          </p>
          <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
            <div>
              {t('help.emailLabel')} <a href="mailto:support@caredroid.ai" style={{ color: 'var(--accent)' }}>support@caredroid.ai</a>
            </div>
            <div>
              {t('help.responseTime')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
