import React, { Component } from 'react';
import logger from '../../utils/logger';
import LanguageContext from '../../contexts/LanguageContext';

/**
 * WidgetErrorBoundary — Per-widget error boundary for graceful degradation.
 * Isolates failures to individual dashboard cards instead of crashing the whole page.
 */
class WidgetErrorBoundary extends Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error(`Widget "${this.props.widgetName || 'unknown'}" crashed`, { error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const t = this.context?.t || ((k) => k);

    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-label={`${this.props.widgetName || 'Widget'} failed to load`}
          style={{
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--clinical-error)',
            background: 'var(--clinical-error-light)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            minHeight: '160px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '28px' }} aria-hidden="true">⚠️</span>
          <div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--clinical-error)',
              marginBottom: 'var(--space-1)',
            }}>
              {this.props.widgetName || t('widgets.widgetErrorBoundary.widget')} {t('widgets.widgetErrorBoundary.unavailable')}
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
            }}>
              {t('widgets.widgetErrorBoundary.errorMessage')}
            </div>
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '6px 16px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--clinical-error)',
              background: 'transparent',
              color: 'var(--clinical-error)',
              cursor: 'pointer',
            }}
          >
            {t('widgets.widgetErrorBoundary.retry')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WidgetErrorBoundary;
