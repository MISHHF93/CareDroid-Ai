import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './HelpCenter.css';

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
    <div className="help-center-page">
      <div className="help-center-container">
        <section className="help-hero">
          <div className="help-inline-topnav" aria-label="Help quick navigation">
            <Link to="/" className="help-inline-brand" aria-label="Go to home">
              <span aria-hidden="true">⚕️</span>
            </Link>

            <nav className="help-inline-links">
              <Link to="/help">Help</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </nav>
          </div>

          <button onClick={() => navigate(-1)} className="help-back-link" aria-label="Go back">
            <span>{t('help.back')}</span>
          </button>

          <p className="help-eyebrow">Explore Platform</p>
          <h1 className="help-title">{t('help.title')}</h1>
          <p className="help-subtitle">{t('help.subtitle')}</p>

          <div className="help-hero-metrics">
            <div className="help-metric-card">
              <strong>Clinical Tools</strong>
              <span>Workflow guides and feature walkthroughs</span>
            </div>
            <div className="help-metric-card">
              <strong>Security & Privacy</strong>
              <span>Best practices for safe clinical operation</span>
            </div>
            <div className="help-metric-card">
              <strong>Fast Resolution</strong>
              <span>Support paths for urgent operational issues</span>
            </div>
          </div>
        </section>

        <section className="help-faq-grid" aria-label="Help topics">
          {faqSections.map((section, idx) => (
            <article
              key={idx}
              className={`help-faq-card ${expandedSection === idx ? 'is-open' : ''}`}
            >
              <button
                onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                className="help-faq-toggle"
              >
                <h2>{section.title}</h2>
                <span className="help-faq-chevron">▼</span>
              </button>

              {expandedSection === idx && (
                <div className="help-faq-content">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="help-faq-item">
                      <h3>Q: {item.q}</h3>
                      <p>A: {item.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>

        <section className="help-support-panel">
          <h2>{t('help.needHelp')}</h2>
          <p>{t('help.contactSupport')}</p>
          <div className="help-support-meta">
            <div>
              {t('help.emailLabel')} <a href="mailto:support@caredroid.ai">support@caredroid.ai</a>
            </div>
            <div>{t('help.responseTime')}</div>
          </div>
          <div className="help-support-actions">
            <a href="mailto:support@caredroid.ai" className="help-support-btn primary">Contact Support</a>
          </div>
        </section>
      </div>
    </div>
  );
}
