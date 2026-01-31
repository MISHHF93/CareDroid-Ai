import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const Auth = ({ onAddToast, onAuthSuccess }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [magicEmail, setMagicEmail] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [userId, setUserId] = useState(null);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const bypassToken = import.meta.env.VITE_DEV_BEARER_TOKEN || 'dev-bypass-token';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, fullName: form.name };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      // Check if 2FA is required
      if (data?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setUserId(data.userId);
        onAddToast?.('Please enter your 2FA code', 'info');
        return;
      }

      if (data?.accessToken) {
        onAuthSuccess?.(data.accessToken);
      } else {
        onAddToast?.('Registration successful. Please verify your email.', 'success');
      }
    } catch (error) {
      onAddToast?.('Unable to authenticate. Check your credentials.', 'error');
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    
    if (!twoFactorToken || twoFactorToken.length < 6) {
      onAddToast?.('Please enter a valid 6-digit code', 'error');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: twoFactorToken })
      });

      if (!response.ok) {
        throw new Error('Invalid 2FA code');
      }

      const data = await response.json();

      if (data?.accessToken) {
        onAuthSuccess?.(data.accessToken);
        onAddToast?.('Successfully authenticated!', 'success');
      }
    } catch (error) {
      onAddToast?.('Invalid 2FA code. Please try again.', 'error');
    }
  };

  const handleCancelTwoFactor = () => {
    setRequiresTwoFactor(false);
    setUserId(null);
    setTwoFactorToken('');
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!magicEmail) {
      onAddToast?.('Enter your institutional email to receive a link.', 'info');
      return;
    }

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail })
      });

      if (!response.ok) {
        throw new Error('Magic link failed');
      }

      onAddToast?.('Magic link sent. Check your email.', 'success');
    } catch (error) {
      onAddToast?.('Unable to send magic link.', 'error');
    }
  };

  return (
    <Card style={{ width: '100%', maxWidth: '520px' }}>
      {/* 2FA Verification Screen */}
      {requiresTwoFactor ? (
        <div>
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
            <h2 style={{ margin: 0, fontSize: '22px' }}>Two-Factor Authentication</h2>
            <p style={{ marginTop: '8px', color: 'var(--muted-text)', fontSize: '14px' }}>
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form onSubmit={handleTwoFactorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              type="text"
              placeholder="000000"
              value={twoFactorToken}
              onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              style={{
                textAlign: 'center',
                fontSize: '24px',
                letterSpacing: '0.5em',
                fontFamily: 'monospace',
              }}
              autoComplete="off"
              autoFocus
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelTwoFactor}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={twoFactorToken.length < 6}
                style={{ flex: 1 }}
              >
                Verify
              </Button>
            </div>
          </form>

          <div style={{
            marginTop: '16px',
            fontSize: '12px',
            color: 'var(--muted-text)',
            textAlign: 'center',
          }}>
            <button
              type="button"
              onClick={() => setTwoFactorToken('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#00FFFF',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Use backup code instead?
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Regular Login Screen */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '22px' }}>Institutional Sign-In</h2>
            <p style={{ marginTop: '8px', color: 'var(--muted-text)', fontSize: '14px' }}>
              Secure access for hospitals, universities, and clinical teams.
            </p>
          </div>

      <form onSubmit={handleMagicLink} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <Input
          type="email"
          placeholder="name@institution.org"
          value={magicEmail}
          onChange={(e) => setMagicEmail(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button type="submit">Send Link</Button>
      </form>

        <div style={{ display: 'grid', gap: '8px', marginBottom: '18px' }}>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/auth/oidc');
                const data = await response.json().catch(() => ({}));
                onAddToast?.(data?.message || 'OIDC SSO is not configured.', 'info');
              } catch (error) {
                onAddToast?.('OIDC SSO is not available.', 'info');
              }
            }}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--panel-border)',
              background: 'transparent',
              color: 'var(--text-color)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            🔐 Institutional SSO (OIDC)
          </button>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/auth/saml');
                const data = await response.json().catch(() => ({}));
                onAddToast?.(data?.message || 'SAML SSO is not configured.', 'info');
              } catch (error) {
                onAddToast?.('SAML SSO is not available.', 'info');
              }
            }}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--panel-border)',
              background: 'transparent',
              color: 'var(--text-color)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            🏢 Institutional SSO (SAML)
          </button>
        </div>

        <div style={{ margin: '18px 0 12px', color: 'var(--muted-text)', fontSize: '12px' }}>
          Or continue with social login
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          <a
            href="/api/auth/google"
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--panel-border)',
              background: 'transparent',
              color: 'var(--text-color)',
              textDecoration: 'none',
              textAlign: 'left'
            }}
          >
            🔎 Continue with Google
          </a>
          <a
            href="/api/auth/linkedin"
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--panel-border)',
              background: 'transparent',
              color: 'var(--text-color)',
              textDecoration: 'none',
              textAlign: 'left'
            }}
          >
            💼 Continue with LinkedIn
          </a>
          <Button
            onClick={() => {
              console.log('=== Direct Sign-In clicked ===');
              console.log('bypassToken:', bypassToken);
              console.log('onAuthSuccess type:', typeof onAuthSuccess);
              try {
                onAuthSuccess?.(bypassToken);
                console.log('=== onAuthSuccess called successfully ===');
                // Don't redirect here - let App.jsx handle the state update and routing
              } catch (error) {
                console.error('Error calling onAuthSuccess:', error);
              }
              onAddToast?.('Signed in with direct access.', 'success');
            }}
            variant="ghost"
            style={{ borderStyle: 'dashed', textAlign: 'left' }}
          >
            ⚡ Direct Sign-In (no auth)
          </Button>
        </div>

        <div style={{ margin: '18px 0 10px', color: 'var(--muted-text)', fontSize: '12px' }}>
          Or sign in with email and password
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'signup' && (
            <Input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <Input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" style={{ marginTop: '6px' }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <div style={{
          marginTop: '16px',
          fontSize: '13px',
          color: 'var(--muted-text)'
        }}>
          {mode === 'login' ? (
            <span>
              New here?{' '}
              <button
                onClick={() => setMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00FFFF',
                  cursor: 'pointer'
                }}
              >
                Create account
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00FFFF',
                  cursor: 'pointer'
                }}
              >
                Sign in
              </button>
            </span>
          )}
        </div>
        <div style={{ marginTop: '18px', fontSize: '12px', color: 'var(--muted-text)' }}>
          <Link to="/" style={{ color: '#00FF88', textDecoration: 'none' }}>
            ← Back to chat
          </Link>
        </div>
        </div>
      )}
    </Card>
  );
};

export default Auth;
