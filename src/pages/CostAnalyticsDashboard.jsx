import React, { useEffect, useState } from 'react';
import { useCostTracking } from '../contexts/CostTrackingContext';
import { useUser } from '../contexts/UserContext';
import analyticsService from '../services/analyticsService';
import { getExportService } from '../services/export/ExportService';
import toolRegistry, { toolRegistryById } from '../data/toolRegistry';
import './CostAnalyticsDashboard.css';
import { useLanguage } from '../contexts/LanguageContext';

const CostAnalyticsDashboard = () => {
  const { t } = useLanguage();
  const { user } = useUser();
  const {
    costData,
    costLimit,
    isLoading,
    getTopSpendingTools,
    getCostTrends,
    updateCostLimit,
    resetCostData,
    getROIMetrics,
    isCostLimitApproaching,
    isCostLimitExceeded
  } = useCostTracking();

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [newLimit, setNewLimit] = useState('');

  useEffect(() => {
    analyticsService.trackPageView('cost_analytics_dashboard');
  }, []);

  const roiMetrics = getROIMetrics();
  const topTools = getTopSpendingTools(5);
  const costTrends = getCostTrends();

  const handleSetLimit = () => {
    const limit = parseFloat(newLimit);
    if (!isNaN(limit) && limit > 0) {
      updateCostLimit(limit);
      setShowLimitModal(false);
      setNewLimit('');
      analyticsService.trackEvent({
        eventName: 'cost_limit_set',
        parameters: { limit }
      });
    }
  };

  const handleResetCosts = () => {
    if (confirm(t('costAnalytics.resetConfirm'))) {
      resetCostData();
      analyticsService.trackEvent({
        eventName: 'cost_data_reset',
        parameters: {}
      });
    }
  };

  const handleExport = async (format) => {
    try {
      const exportService = getExportService();
      
      if (format === 'csv') {
        const csvData = [
          ['Tool', 'Cost', 'Executions', 'Avg Cost'],
          ...topTools.map(tool => {
            const toolInfo = toolRegistryById[tool.toolId];
            const execCount = costData.toolCosts[tool.toolId + '_count'] || 0;
            return [
              toolInfo?.name || tool.toolId,
              '$' + tool.cost.toFixed(2),
              execCount,
              execCount > 0 ? '$' + (tool.cost / execCount).toFixed(2) : 'N/A'
            ];
          })
        ];
        await exportService.exportToCSV(csvData, 'cost-analytics.csv');
      } else if (format === 'pdf') {
        const exportData = {
          summary: {
            totalCost: costData.totalCost,
            monthlyCost: costData.monthlyCost,
            costLimit,
            roi: roiMetrics
          },
          topTools: topTools.map(tool => ({
            ...tool,
            name: toolRegistryById[tool.toolId]?.name || tool.toolId
          })),
          trends: costTrends,
          generatedAt: new Date().toISOString()
        };
        await exportService.exportToPDF(exportData, 'cost-analytics.pdf', {
          title: 'Cost Analytics Report',
          includeCharts: true
        });
      }
      
      analyticsService.trackEvent({
        eventName: 'cost_analytics_exported',
        parameters: { format }
      });
    } catch (error) {
      console.error('Failed to export cost analytics', error);
    }
  };

  if (isLoading) {
    return (
      <div className="cost-analytics-dashboard">
        <div className="loading">{t('costAnalytics.loading')}</div>
      </div>
    );
  }

  return (
    <div className="cost-analytics-dashboard">
      <header className="cost-header">
        <div>
          <h1>💰 {t('costAnalytics.title')}</h1>
          <p>{t('costAnalytics.subtitle')}</p>
        </div>
        <div className="cost-header-actions">
          <button 
            className="btn-ghost" 
            onClick={() => handleExport('csv')}
            style={{ marginRight: '8px' }}
            title={t('costAnalytics.exportCsv')}
          >
            📥 {t('costAnalytics.csv')}
          </button>
          <button 
            className="btn-ghost" 
            onClick={() => handleExport('pdf')}
            style={{ marginRight: '12px' }}
            title={t('costAnalytics.exportPdf')}
          >
            📄 {t('costAnalytics.pdf')}
          </button>
          <button className="btn-secondary" onClick={() => setShowLimitModal(true)}>
            {costLimit ? t('costAnalytics.updateLimit') : t('costAnalytics.setBudget')}
          </button>
          <button className="btn-danger" onClick={handleResetCosts}>
            {t('costAnalytics.resetData')}
          </button>
        </div>
      </header>

      {/* Cost Limit Warning */}
      {isCostLimitExceeded && (
        <div className="cost-alert cost-alert-danger">
          <strong>⚠️ {t('costAnalytics.budgetExceeded')}</strong>
          <p>Monthly cost (${costData.monthlyCost.toFixed(2)}) has exceeded your limit of ${costLimit.toFixed(2)}.</p>
        </div>
      )}
      {isCostLimitApproaching && !isCostLimitExceeded && (
        <div className="cost-alert cost-alert-warning">
          <strong>⚡ {t('costAnalytics.approachingBudget')}</strong>
          <p>You've used {((costData.monthlyCost / costLimit) * 100).toFixed(0)}% of your ${costLimit.toFixed(2)} monthly budget.</p>
        </div>
      )}

      {/* Cost Summary Cards */}
      <section className="cost-summary">
        <div className="cost-card">
          <h3>{t('costAnalytics.totalCost')}</h3>
          <p className="cost-value">${costData.totalCost.toFixed(2)}</p>
          <span className="cost-label">{t('costAnalytics.allTime')}</span>
        </div>
        <div className="cost-card">
          <h3>{t('costAnalytics.monthlyCost')}</h3>
          <p className="cost-value">${costData.monthlyCost.toFixed(2)}</p>
          <span className="cost-label">{t('costAnalytics.last30Days')}</span>
          {costLimit && (
            <div className="cost-progress">
              <div 
                className="cost-progress-bar" 
                style={{ 
                  width: `${Math.min((costData.monthlyCost / costLimit) * 100, 100)}%`,
                  backgroundColor: isCostLimitExceeded ? '#EF4444' : isCostLimitApproaching ? '#F59E0B' : '#10B981'
                }}
              />
            </div>
          )}
        </div>
        <div className="cost-card">
          <h3>{t('costAnalytics.avgCostPerTool')}</h3>
          <p className="cost-value">
            ${costData.executions.length > 0 
              ? (costData.totalCost / costData.executions.length).toFixed(3)
              : '0.00'}
          </p>
          <span className="cost-label">{t('costAnalytics.perExecution')}</span>
        </div>
        <div className="cost-card">
          <h3>{t('costAnalytics.totalExecutions')}</h3>
          <p className="cost-value">{costData.executions.length}</p>
          <span className="cost-label">{t('costAnalytics.toolUses')}</span>
        </div>
      </section>

      {/* ROI Metrics */}
      <section className="cost-panel">
        <h2>{t('costAnalytics.roiTitle')}</h2>
        <div className="roi-grid">
          <div className="roi-metric">
            <span className="roi-label">{t('costAnalytics.timeSaved')}</span>
            <strong className="roi-value">{roiMetrics.timeSavedHours} hrs</strong>
          </div>
          <div className="roi-metric">
            <span className="roi-label">{t('costAnalytics.valueCreated')}</span>
            <strong className="roi-value">${roiMetrics.valueSaved}</strong>
          </div>
          <div className="roi-metric">
            <span className="roi-label">{t('costAnalytics.totalCostLabel')}</span>
            <strong className="roi-value">${roiMetrics.totalCost}</strong>
          </div>
          <div className="roi-metric">
            <span className="roi-label">{t('costAnalytics.netValue')}</span>
            <strong className="roi-value" style={{ color: parseFloat(roiMetrics.netValue) > 0 ? '#10B981' : '#EF4444' }}>
              ${roiMetrics.netValue}
            </strong>
          </div>
          <div className="roi-metric roi-metric-highlight">
            <span className="roi-label">{t('costAnalytics.roi')}</span>
            <strong className="roi-value roi-value-large">{roiMetrics.roi}%</strong>
          </div>
        </div>
        <p className="roi-note">
          {t('costAnalytics.roiNote')}
        </p>
      </section>

      {/* Cost by Tool */}
      <section className="cost-panel">
        <h2>{t('costAnalytics.topSpendingTools')}</h2>
        {topTools.length === 0 ? (
          <p className="cost-empty">{t('costAnalytics.noToolUsage')}</p>
        ) : (
          topTools.map((item, index) => {
            const tool = toolRegistryById[item.toolId] || { name: item.toolId, icon: '🧰', color: '#64748B' };
            const percentage = (item.cost / costData.totalCost) * 100;
            
            return (
              <div key={item.toolId} className="cost-row">
                <div className="cost-row-label">
                  <span className="cost-rank">#{index + 1}</span>
                  <span className="tool-icon">{tool.icon}</span>
                  <span>{tool.name}</span>
                </div>
                <div className="cost-row-bar">
                  <div
                    className="cost-row-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: tool.color,
                    }}
                  />
                </div>
                <span className="cost-row-amount">${item.cost.toFixed(2)}</span>
              </div>
            );
          })
        )}
      </section>

      {/* Cost by Category */}
      <section className="cost-panel">
        <h2>{t('costAnalytics.costByCategory')}</h2>
        {Object.keys(costData.categoryCosts).length === 0 ? (
          <p className="cost-empty">{t('costAnalytics.noCategoryData')}</p>
        ) : (
          Object.entries(costData.categoryCosts)
            .sort(([, a], [, b]) => b - a)
            .map(([category, cost]) => {
              const percentage = (cost / costData.totalCost) * 100;
              const categoryName = category.replace(/_/g, ' ');
              
              return (
                <div key={category} className="cost-row">
                  <div className="cost-row-label">
                    <span>{categoryName}</span>
                  </div>
                  <div className="cost-row-bar">
                    <div
                      className="cost-row-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: 'var(--accent)',
                      }}
                    />
                  </div>
                  <span className="cost-row-amount">${cost.toFixed(2)}</span>
                </div>
              );
            })
        )}
      </section>

      {/* Cost Trends Chart */}
      <section className="cost-panel">
        <h2>{t('costAnalytics.costTrend')}</h2>
        <div className="cost-chart">
          {costTrends.map((day, index) => {
            const maxCost = Math.max(...costTrends.map(d => d.cost), 1);
            const barHeight = (day.cost / maxCost) * 100;
            
            return (
              <div key={day.date} className="cost-chart-bar-container">
                <div 
                  className="cost-chart-bar" 
                  style={{ height: `${barHeight}%` }}
                  title={`${day.date}: $${day.cost.toFixed(2)}`}
                />
                {index % 5 === 0 && (
                  <span className="cost-chart-label">
                    {new Date(day.date).getDate()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Cost Limit Modal */}
      {showLimitModal && (
        <div className="modal-overlay" onClick={() => setShowLimitModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('costAnalytics.setMonthlyBudget')}</h2>
            <p>{t('costAnalytics.budgetDescription')}</p>
            <input
              type="number"
              placeholder={t('costAnalytics.enterAmount')}
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              step="0.01"
              min="0"
              className="input-field"
            />
            {costLimit && (
              <p className="modal-hint">Current limit: ${costLimit.toFixed(2)}</p>
            )}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLimitModal(false)}>
                {t('costAnalytics.cancel')}
              </button>
              <button className="btn-primary" onClick={handleSetLimit}>
                {t('costAnalytics.setLimit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostAnalyticsDashboard;
