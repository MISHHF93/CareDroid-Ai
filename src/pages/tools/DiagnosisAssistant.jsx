import { useState } from 'react';
import ToolPageLayout from './ToolPageLayout';
import './ToolPageLayout.css';
import { apiFetch } from '../../services/apiClient';
import { useLanguage } from '../../contexts/LanguageContext';

const DiagnosisAssistant = () => {
  const { t } = useLanguage();

  const toolConfig = {
    id: 'diagnosis',
    icon: '🔍',
    name: t('tools.diagnosisAssistant.name'),
    path: '/tools/diagnosis',
    color: '#FFD93D',
    description: t('tools.diagnosisAssistant.description'),
    shortcut: 'Ctrl+5',
    category: t('tools.diagnosisAssistant.category')
  };

  const [symptoms, setSymptoms] = useState('');
  const [patientInfo, setPatientInfo] = useState({ age: '', sex: '', history: '' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!symptoms.trim()) {
      alert(t('tools.diagnosisAssistant.enterSymptoms'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use AI chat endpoint for diagnosis generation
      const message = `Generate a differential diagnosis for: ${symptoms}${
        patientInfo.age ? `\nPatient age: ${patientInfo.age}` : ''
      }${patientInfo.sex ? `\nSex: ${patientInfo.sex}` : ''}${
        patientInfo.history ?`\nRelevant history: ${patientInfo.history}` : ''
      }`;

      const response = await apiFetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('caredroid_access_token')}`,
        },
        body: JSON.stringify({ message, tool: 'diagnosis-assistant' }),
      });

      if (!response.ok) throw new Error(t('tools.diagnosisAssistant.generateError'));

      const data = await response.json();
      setResults(data.response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageLayout tool={toolConfig} results={results}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Input Panel */}
        <div style={{ background: 'var(--panel-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>
            📋 {t('tools.diagnosisAssistant.patientPresentation')}
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {t('tools.diagnosisAssistant.symptomsLabel')}
            </label>
            <textarea
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              placeholder={t('tools.diagnosisAssistant.symptomsPlaceholder')}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {t('tools.diagnosisAssistant.ageOptional')}
              </label>
              <input
                type="number"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
                placeholder={t('tools.diagnosisAssistant.yearsPlaceholder')}
                value={patientInfo.age}
                onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {t('tools.diagnosisAssistant.sexOptional')}
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
                value={patientInfo.sex}
                onChange={(e) => setPatientInfo({ ...patientInfo, sex: e.target.value })}
              >
                <option value="">--</option>
                <option value="male">{t('tools.diagnosisAssistant.male')}</option>
                <option value="female">{t('tools.diagnosisAssistant.female')}</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Relevant Medical History (optional)
            </label>
            <textarea
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              placeholder={t('tools.diagnosisAssistant.historyPlaceholder')}
              value={patientInfo.history}
              onChange={(e) => setPatientInfo({ ...patientInfo, history: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={{
                flex: 1,
                padding: '14px 24px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                border: 'none',
                borderRadius: '10px',
                color: '#0a0e27',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? t('tools.diagnosisAssistant.generating') : t('tools.diagnosisAssistant.generateDDx')}
            </button>
            <button
              style={{
                padding: '14px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setSymptoms('');
                setPatientInfo({ age: '', sex: '', history: '' });
                setResults(null);
                setError(null);
              }}
            >
              {t('tools.diagnosisAssistant.clear')}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div style={{ background: 'var(--panel-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', maxHeight: '80vh', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>
            🎯 {t('tools.diagnosisAssistant.differentialDiagnosis')}
          </h2>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid rgba(0,255,136,0.2)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}></div>
              <p>{t('tools.diagnosisAssistant.analyzingSymptoms')}</p>
            </div>
          ) : error ? (
            <div style={{ padding: '20px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '12px', color: '#ff6b6b' }}>
              <strong>Error:</strong> {error}
            </div>
          ) : results ? (
            <div style={{ color: 'var(--text-primary)', lineHeight: 1.8, fontSize: '15px', whiteSpace: 'pre-wrap' }}>
              {results}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>🔍</div>
              <p>{t('tools.diagnosisAssistant.emptyPrompt')}</p>
            </div>
          )}
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default DiagnosisAssistant;
