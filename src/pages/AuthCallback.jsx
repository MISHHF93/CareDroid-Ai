import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const AuthCallback = ({ onAddToast, onAuthSuccess }) => {
  const [params] = useSearchParams();
  const initialToken = params.get('token') || '';
  const [token, setToken] = useState(initialToken);

  const handleSave = () => {
    if (!token) {
      onAddToast?.('Paste an access token to continue.', 'info');
      return;
    }
    onAuthSuccess?.(token);
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <Card style={{ width: '100%', maxWidth: '720px' }}>
        <h2 style={{ marginTop: 0 }}>Complete Sign-In</h2>
        <p style={{ color: 'var(--muted-text)', fontSize: '14px' }}>
          Paste the access token returned from your OAuth provider to finish signing in.
        </p>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={4}
          placeholder="Paste access token"
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
          Save token
        </Button>
        <div style={{ marginTop: '18px', fontSize: '12px', color: 'var(--muted-text)' }}>
          <Link to="/" style={{ color: '#00FF88', textDecoration: 'none' }}>
            ← Back to chat
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
