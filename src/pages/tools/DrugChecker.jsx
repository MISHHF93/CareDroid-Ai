import { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import analyticsService from '../../services/analyticsService';
import offlineService from '../../services/offlineService';
import ToolPageLayout from './ToolPageLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import './DrugChecker.css';

const DrugChecker = () => {
  const { user } = useUser();
  const { t } = useLanguage();
  const [medications, setMedications] = useState(['']);
  const [results, setResults] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const toolConfig = {
    id: 'drug-check',
    icon: '💊',
    name: t('tools.drugChecker.name'),
    path: '/tools/drug-checker',
    color: '#FF6B9D',
    description: t('tools.drugChecker.description'),
    shortcut: 'Ctrl+1',
    category: t('tools.drugChecker.category')
  };

  const handleAddMedication = () => {
    setMedications([...medications, '']);
  };

  const handleRemoveMedication = (index) => {
    const updated = medications.filter((_, i) => i !== index);
    setMedications(updated.length > 0 ? updated : ['']);
  };

  const handleMedicationChange = (index, value) => {
    const updated = [...medications];
    updated[index] = value;
    setMedications(updated);
  };

  const handleCheck = async () => {
    const activeMeds = medications.filter(m => m.trim());
    if (activeMeds.length < 2) {
      alert(t('tools.drugChecker.minMedications'));
      return;
    }

    setIsChecking(true);

    // Simulate API call
    setTimeout(() => {
      const mockResults = {
        interactions: [
          {
            severity: 'major',
            drugs: [activeMeds[0], activeMeds[1]],
            description: 'May increase risk of bleeding',
            evidence: 'Well-documented',
            management: 'Monitor INR closely, consider dose adjustment'
          }
        ],
        contraindications: [],
        warnings: [
          {
            drug: activeMeds[0],
            warning: 'Use with caution in renal impairment',
            recommendation: 'Adjust dose based on CrCl'
          }
        ]
      };

      setResults(mockResults);

      offlineService.saveToolResult({
        userId: user?.id,
        toolType: toolConfig.id,
        input: { medications: activeMeds },
        output: mockResults,
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      analyticsService.trackEvent({
        eventName: 'tool_result_saved',
        parameters: {
          toolId: toolConfig.id,
          medicationCount: activeMeds.length,
        },
      });

      setIsChecking(false);
    }, 1500);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'major': return '#EF4444';
      case 'moderate': return '#F59E0B';
      case 'minor': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <ToolPageLayout tool={toolConfig}>
      <div className="drug-checker">
        <div className="drug-input-section">
          <h2>{t('tools.drugChecker.enterMedications')}</h2>
          <p className="section-subtitle">
            {t('tools.drugChecker.enterMedicationsDescription')}
          </p>

          <div className="medications-list">
            {medications.map((med, index) => (
              <div key={index} className="medication-input-row">
                <span className="medication-number">{index + 1}</span>
                <input
                  type="text"
                  className="medication-input"
                  placeholder={t('tools.drugChecker.medicationPlaceholder')}
                  value={med}
                  onChange={(e) => handleMedicationChange(index, e.target.value)}
                />
                {medications.length > 1 && (
                  <button
                    className="btn-remove-med"
                    onClick={() => handleRemoveMedication(index)}
                    title={t('tools.drugChecker.removeMedication')}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="input-actions">
            <button className="btn-add-med" onClick={handleAddMedication}>
              {t('tools.drugChecker.addAnother')}
            </button>
            <button 
              className="btn-check-interactions" 
              onClick={handleCheck}
              disabled={isChecking || medications.filter(m => m.trim()).length < 2}
            >
              {isChecking ? t('tools.drugChecker.checking') : t('tools.drugChecker.checkInteractions')}
            </button>
          </div>
        </div>

        {results && (
          <div className="results-section">
            {/* Interactions */}
            {results.interactions.length > 0 && (
              <div className="result-card">
                <h3 className="result-title">⚠️ {t('tools.drugChecker.interactionsFound')}</h3>
                {results.interactions.map((interaction, idx) => (
                  <div 
                    key={idx} 
                    className="interaction-item"
                    style={{ borderLeftColor: getSeverityColor(interaction.severity) }}
                  >
                    <div className="interaction-header">
                      <span 
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(interaction.severity) }}
                      >
                        {interaction.severity.toUpperCase()}
                      </span>
                      <span className="interacting-drugs">
                        {interaction.drugs.join(' + ')}
                      </span>
                    </div>
                    <div className="interaction-body">
                      <p className="interaction-description">
                        <strong>{t('tools.drugChecker.effect')}:</strong> {interaction.description}
                      </p>
                      <p className="interaction-evidence">
                        <strong>{t('tools.drugChecker.evidence')}:</strong> {interaction.evidence}
                      </p>
                      <p className="interaction-management">
                        <strong>{t('tools.drugChecker.management')}:</strong> {interaction.management}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {results.warnings.length > 0 && (
              <div className="result-card">
                <h3 className="result-title">⚡ {t('tools.drugChecker.clinicalWarnings')}</h3>
                {results.warnings.map((warning, idx) => (
                  <div key={idx} className="warning-item">
                    <div className="warning-drug">{warning.drug}</div>
                    <div className="warning-text">{warning.warning}</div>
                    <div className="warning-recommendation">
                      <strong>{t('tools.drugChecker.recommendation')}:</strong> {warning.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Issues */}
            {results.interactions.length === 0 && results.contraindications.length === 0 && (
              <div className="result-card success-card">
                <h3 className="result-title">✅ {t('tools.drugChecker.noInteractions')}</h3>
                <p>{t('tools.drugChecker.noInteractionsDescription')}</p>
                <p className="disclaimer">
                  {t('tools.drugChecker.disclaimer')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Reference */}
        <div className="quick-reference">
          <h3>💡 {t('tools.drugChecker.quickReference')}</h3>
          <div className="reference-grid">
            <div className="reference-item">
              <h4>{t('tools.drugChecker.severityLevels')}</h4>
              <ul>
                <li><span style={{ color: '#EF4444' }}>●</span> {t('tools.drugChecker.majorSeverity')}</li>
                <li><span style={{ color: '#F59E0B' }}>●</span> {t('tools.drugChecker.moderateSeverity')}</li>
                <li><span style={{ color: '#10B981' }}>●</span> {t('tools.drugChecker.minorSeverity')}</li>
              </ul>
            </div>
            <div className="reference-item">
              <h4>{t('tools.drugChecker.commonChecks')}</h4>
              <ul>
                <li>Drug-drug interactions</li>
                <li>Contraindications</li>
                <li>Dose adjustments (renal/hepatic)</li>
                <li>Adverse effects</li>
              </ul>
            </div>
            <div className="reference-item">
              <h4>{t('tools.drugChecker.bestPractices')}</h4>
              <ul>
                <li>Include all medications (Rx + OTC)</li>
                <li>Check supplements and herbals</li>
                <li>Consider patient comorbidities</li>
                <li>Review with pharmacist when needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default DrugChecker;
