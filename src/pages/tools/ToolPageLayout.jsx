import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversation } from '../../contexts/ConversationContext';
import { useToolPreferences } from '../../contexts/ToolPreferencesContext';
import { createSharedSession } from '../../utils/sharedSessions';
import { buildClinicalInsights } from '../../utils/clinicalInsights';
import { computeRiskScore, generateClinicalAlerts } from '../../utils/riskScoring';
import ToolResultShare from '../../components/tools/ToolResultShare';
import RiskScoreGauge from '../../components/clinical/RiskScoreGauge';
import AnomalyBanner from '../../components/clinical/AnomalyBanner';
import RiskFactorsList from '../../components/clinical/RiskFactorsList';
import ClinicalAlertBanner from '../../components/clinical/ClinicalAlertBanner';
import analyticsService from '../../services/analyticsService';
import { useLanguage } from '../../contexts/LanguageContext';
import './ToolPageLayout.css';

const ToolPageLayout = ({ 
  tool, 
  children,
  actions = null,
  results = null
}) => {
  const navigate = useNavigate();
  const { addMessage, selectTool } = useConversation();
  const { recordToolAccess } = useToolPreferences();
  const { t } = useLanguage();
  const [showShareModal, setShowShareModal] = useState(false);
  const [clinicalAlerts, setClinicalAlerts] = useState([]);
  const [dismissedAnomalies, setDismissedAnomalies] = useState(new Set());

  const clinicalInsights = results ? buildClinicalInsights(tool, results) : null;
  const riskData = results ? computeRiskScore(tool.id, results) : null;

  // Generate clinical alerts based on risk data
  useEffect(() => {
    if (riskData) {
      const alerts = generateClinicalAlerts(tool.id, results, riskData);
      setClinicalAlerts(alerts);
    }
  }, [riskData, results, tool.id]);

  useEffect(() => {
    if (tool?.id) {
      recordToolAccess(tool.id);
    }
  }, [recordToolAccess, tool]);

  const handleSendToChat = (data) => {
    const message = `📊 ${tool.name} Result:\n${JSON.stringify(data, null, 2)}`;
    addMessage(message, 'assistant');
    navigate('/dashboard');
  };

  const handleAcknowledgeAlert = (alertId) => {
    setClinicalAlerts(alerts =>
      alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const handleDismissAnomaly = () => {
    setDismissedAnomalies(new Set([...dismissedAnomalies, 'anomaly']));
  };

  const handleShareSession = async () => {
    const shareId = createSharedSession({
      toolId: tool.id,
      toolName: tool.name,
      toolDescription: tool.description,
      toolPath: tool.path,
    });

    analyticsService.trackEvent({
      eventName: 'tool_session_shared',
      parameters: { toolId: tool.id, shareId },
    });

    const url = `${window.location.origin}/shared/tools/${shareId}`;

    try {
      await navigator.clipboard.writeText(url);
      alert(t('tools.layout.shareLinkCopied'));
    } catch (error) {
      window.prompt(t('tools.layout.copyShareLink'), url);
    }
  };

  return (
    <div className="tool-page">
      {/* Breadcrumb Navigation */}
      <div className="tool-breadcrumb">
        <button onClick={() => navigate('/dashboard')} className="breadcrumb-link">
          💬 {t('tools.layout.dashboard')}
        </button>
        <span className="breadcrumb-separator">›</span>
        <button onClick={() => navigate('/tools')} className="breadcrumb-link">
          🔧 {t('tools.layout.tools')}
        </button>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{tool.name}</span>
      </div>

      {/* Tool Header */}
      <div className="tool-header" style={{ borderColor: tool.color }}>
        <div className="tool-header-left">
          <div className="tool-header-icon" style={{ backgroundColor: `${tool.color}20` }}>
            <span>{tool.icon}</span>
          </div>
          <div className="tool-header-info">
            <h1>{tool.name}</h1>
            <p>{tool.description}</p>
            <div className="tool-header-meta">
              <span className="tool-category-badge" style={{ backgroundColor: `${tool.color}20`, color: tool.color }}>
                {tool.category}
              </span>
              <span className="tool-shortcut-badge">
                {t('tools.layout.shortcut')}: {tool.shortcut}
              </span>
            </div>
          </div>
        </div>
        <div className="tool-header-actions">
          {actions}
          {results && (
            <button
              className="btn-share-tool"
              onClick={() => setShowShareModal(true)}
              title={t('tools.layout.exportOrShare')}
            >
              📤 {t('tools.layout.shareResults')}
            </button>
          )}
          <button
            className="btn-share-tool"
            onClick={handleShareSession}
          >
            {t('tools.layout.shareSession')}
          </button>
          <button 
            className="btn-back-to-tools"
            onClick={() => navigate('/tools')}
          >
            ← {t('tools.layout.allTools')}
          </button>
        </div>
      </div>

      {/* Tool Content */}
      <div className="tool-content">
        {children}
      </div>

      {(clinicalInsights || riskData) && (
        <div className={`clinical-insights-panel severity-${(riskData?.severity || clinicalInsights?.severity)}`}>
          <div className="clinical-insights-header">
            <h3>Clinical Intelligence</h3>
            <span className={`clinical-insights-badge ${riskData?.severity || clinicalInsights?.severity}`}>
              {(riskData?.severity || clinicalInsights?.severity).toUpperCase()}
            </span>
          </div>

          {/* Risk Score Gauge */}
          {riskData && (
            <div className="clinical-insights-row">
              <RiskScoreGauge
                value={riskData.riskScore}
                category={riskData.severity}
                confidence={riskData.confidence}
                size="medium"
                label={t('tools.layout.overallPatientRisk')}
              />
            </div>
          )}

          {/* Clinical Insights Summary */}
          {clinicalInsights && (
            <div className="clinical-insights-section">
              <p className="clinical-insights-summary">{clinicalInsights.summary}</p>
            </div>
          )}

          {/* Risk Factors */}
          {riskData && riskData.riskFactors.length > 0 && (
            <RiskFactorsList factors={riskData.riskFactors} />
          )}

          {/* Anomaly Banner */}
          {riskData && riskData.anomalies.length > 0 && !dismissedAnomalies.has('anomaly') && (
            <AnomalyBanner
              score={0.65}
              types={['Statistical Outlier', 'Lab Value']}
              recommendations={[
                'Verify specimen quality and testing methodology',
                'Consider repeat testing if clinically indicated',
                'Review patient context for potential explanations'
              ]}
              onDismiss={handleDismissAnomaly}
            />
          )}

          {/* Clinical Alerts */}
          {clinicalAlerts.length > 0 && (
            <div className="clinical-alerts-container">
              <div className="alerts-title">{t('tools.layout.clinicalAlerts')} ({clinicalAlerts.length})</div>
              {clinicalAlerts.map((alert) => (
                <ClinicalAlertBanner
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledgeAlert}
                  onDismiss={() => {
                    setClinicalAlerts(alerts =>
                      alerts.filter(a => a.id !== alert.id)
                    );
                  }}
                />
              ))}
            </div>
          )}

          {/* Alert Items */}
          {clinicalInsights && clinicalInsights.alerts.length > 0 && (
            <div className="clinical-insights-block">
              <div className="clinical-insights-title">{t('tools.layout.keyFindings')}</div>
              <ul className="clinical-insights-list">
                {clinicalInsights.alerts.map((alert) => (
                  <li key={alert}>{alert}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {clinicalInsights && clinicalInsights.recommendations.length > 0 && (
            <div className="clinical-insights-block">
              <div className="clinical-insights-title">{t('tools.layout.recommendations')}</div>
              <ul className="clinical-insights-list">
                {clinicalInsights.recommendations.map((rec) => (
                  <li key={rec}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* AI Integration Panel */}
      <div className="ai-integration-panel">
        <div className="ai-panel-header">
          <h3>🤖 {t('tools.layout.aiIntegration')}</h3>
          <p>{t('tools.layout.aiIntegrationDescription')}</p>
        </div>
        <div className="ai-panel-actions">
          <button 
            className="btn-ai-action"
            onClick={() => {
              selectTool(tool.id);
              navigate('/dashboard', { state: { toolContext: tool.id } });
            }}
          >
            <span className="btn-icon">💬</span>
            <span>{t('tools.layout.discussWithAI')}</span>
          </button>
          <button 
            className="btn-ai-action"
            onClick={() => {
              navigate('/dashboard', { state: { toolMention: `/${tool.id}` } });
            }}
          >

      {/* Share Results Modal */}
      {showShareModal && (
        <ToolResultShare
          toolName={tool.name}
          toolIcon={tool.icon}
          results={results}
          onClose={() => setShowShareModal(false)}
        />
      )}
            <span className="btn-icon">⚡</span>
            <span>{t('tools.layout.useInConversation')}</span>
          </button>
        </div>
        <div className="ai-panel-tip">
          <span className="tip-icon">💡</span>
          <span>Tip: Type <code>/{tool.id}</code> in any chat to invoke this tool</span>
        </div>
      </div>
    </div>
  );
};

export default ToolPageLayout;
