import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/molecules/Card';
import { Button } from '../components/ui/atoms/Button';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { useLanguage } from '../contexts/LanguageContext';

const Onboarding = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [selection, setSelection] = useState({});
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { success } = useNotificationActions();

  const steps = [
    {
      title: t('onboarding.chooseRoleTitle'),
      description: t('onboarding.chooseRoleDesc'),
      options: [t('onboarding.rolePhysician'), t('onboarding.roleNurse'), t('onboarding.rolePharmacist'), t('onboarding.roleStudent')]
    },
    {
      title: t('onboarding.setFocusTitle'),
      description: t('onboarding.setFocusDesc'),
      options: [t('onboarding.focusEmergency'), t('onboarding.focusICU'), t('onboarding.focusPrimaryCare'), t('onboarding.focusCardiology')]
    },
    {
      title: t('onboarding.safetyTitle'),
      description: t('onboarding.safetyDesc'),
      options: [t('onboarding.agreeOption')]
    }
  ];

  const step = steps[stepIndex];

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    success(t('onboarding.completeTitle'), t('onboarding.completeMessage'));
    navigate('/');
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <Card style={{ width: '100%', maxWidth: '720px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted-text)', marginBottom: '6px' }}>
            {t('onboarding.step')} {stepIndex + 1} {t('onboarding.of')} {steps.length}
          </div>
          <h2 style={{ margin: 0 }}>{step.title}</h2>
          <p style={{ marginTop: '8px', color: 'var(--muted-text)', fontSize: '14px' }}>
            {step.description}
          </p>
        </div>
        <div style={{ display: 'grid', gap: '10px' }}>
          {step.options.map((option) => (
            <Button
              key={option}
              onClick={() => setSelection({ ...selection, [stepIndex]: option })}
              style={{
                padding: '12px',
                textAlign: 'left',
                borderRadius: '12px',
                border: selection[stepIndex] === option ? '1px solid #00FF88' : '1px solid var(--panel-border)',
                background: selection[stepIndex] === option ? 'var(--accent-10)' : 'transparent',
                color: 'var(--text-color)',
                cursor: 'pointer'
              }}
            >
              {option}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <Button
            onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
            disabled={stepIndex === 0}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid var(--panel-border)',
              background: 'transparent',
              color: 'var(--text-color)',
              cursor: stepIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {t('onboarding.back')}
          </Button>
          <Button
            onClick={handleNext}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #00FF88, #00FFFF)',
              color: 'var(--navy-ink)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {stepIndex === steps.length - 1 ? t('onboarding.finish') : t('onboarding.next')}
          </Button>
        </div>
        <div style={{ marginTop: '18px', fontSize: '12px', color: 'var(--muted-text)' }}>
          <Link to="/" style={{ color: '#00FF88', textDecoration: 'none' }}>
            {t('onboarding.backToChat')}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
