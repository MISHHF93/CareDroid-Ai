import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/molecules/Card';
import { Button } from '../components/ui/atoms/Button';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { useLanguage } from '../contexts/LanguageContext';

const AuthCallback = ({ onAuthSuccess }) => {
  const [params] = useSearchParams();
  const initialToken = params.get('token') || '';
  const [token, setToken] = useState(initialToken);
  const { info } = useNotificationActions();
  const { t } = useLanguage();

  const handleSave = () => {
    if (!token) {
      info(t('authCallback.tokenRequired'), t('authCallback.pasteTokenToContinue'));
      return;
    }
    onAuthSuccess?.(token);
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <Card style={{ width: '100%', maxWidth: '720px' }}>
        <h2 style={{ marginTop: 0 }}>{t('authCallback.completeSignIn')}</h2>
        <p style={{ color: 'var(--muted-text)', fontSize: '14px' }}>
          {t('authCallback.pasteTokenDescription')}
        </p>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={4}
          placeholder={t('authCallback.pasteAccessToken')}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid var(--panel-border)',
            background: 'var(--panel-bg)',
            color: 'var(--text-color)',
            marginTop: '12px'
          }}
        />
        <Button onClick={handleSave} style={{ marginTop: '14px' }}>
          {t('authCallback.saveToken')}
        </Button>
        <div style={{ marginTop: '18px', fontSize: '12px', color: 'var(--muted-text)' }}>
          <Link to="/" style={{ color: '#00FF88', textDecoration: 'none' }}>
            {t('authCallback.backToChat')}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
