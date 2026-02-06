import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/atoms/Button';
import { Card } from '../components/ui/molecules/Card';
import { Input } from '../components/ui/atoms/Input';
import appConfig from '../config/appConfig';
import { apiFetch } from '../services/apiClient';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { useUser } from '../contexts/UserContext';
import logger from '../utils/logger';

const Auth = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [magicEmail, setMagicEmail] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [userId, setUserId] = useState(null);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const bypassToken = appConfig.dev.bearerToken;
  const { success, error, info } = useNotificationActions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, fullName: form.name };

      const response = await apiFetch(endpoint, {
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
        info('Two-factor required', 'Please enter your 2FA code.');
        return;
      }

      if (data?.accessToken) {
        // Store token
        localStorage.setItem('authToken', data.accessToken);
        localStorage.setItem('caredroid_access_token', data.accessToken);
        
        // Update user context if available
        if (data.user) {
          setUser(data.user);
        }
        
        // Call callback if provided
        onAuthSuccess?.(data.accessToken);
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
        success('Signed in', 'Welcome to CareDroid!');
      } else {
        success('Registration complete', 'Please verify your email.');
      }
    } catch (error) {
      error('Authentication failed', 'Unable to authenticate. Check your credentials.');
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    
    if (!twoFactorToken || twoFactorToken.length < 6) {
      error('Invalid code', 'Please enter a valid 6-digit code.');
      return;
    }

    try {
      const response = await apiFetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: twoFactorToken })
      });

      if (!response.ok) {
        throw new Error('Invalid 2FA code');
      }

      const data = await response.json();

      if (data?.accessToken) {
        // Store token
        localStorage.setItem('authToken', data.accessToken);
        localStorage.setItem('caredroid_access_token', data.accessToken);
        
        // Update user context if available
        if (data.user) {
          setUser(data.user);
        }
        
        // Call callback if provided
        onAuthSuccess?.(data.accessToken);
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
        success('Signed in', 'Successfully authenticated.');
      }
    } catch (err) {
      error('Invalid 2FA code', 'Please try again.');
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
      info('Email required', 'Enter your institutional email to receive a link.');
      return;
    }

    try {
      const response = await apiFetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail })
      });

      if (!response.ok) {
        throw new Error('Magic link failed');
      }

      success('Magic link sent', 'Check your email.');
    } catch (error) {
      error('Magic link failed', 'Unable to send magic link.');
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
                const response = await apiFetch('/api/auth/oidc');
                const data = await response.json().catch(() => ({}));
                info('SSO status', data?.message || 'OIDC SSO is not configured.');
              } catch (error) {
                info('SSO unavailable', 'OIDC SSO is not available.');
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
                const response = await apiFetch('/api/auth/saml');
                const data = await response.json().catch(() => ({}));
                info('SSO status', data?.message || 'SAML SSO is not configured.');
              } catch (error) {
                info('SSO unavailable', 'SAML SSO is not available.');
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
              logger.info('Direct sign-in clicked');
              logger.debug('bypassToken present', { hasToken: Boolean(bypassToken) });
              logger.debug('onAuthSuccess present', { hasHandler: Boolean(onAuthSuccess) });
              
              try {
                // Create mock user profile for dev mode
                const mockUser = {
                  id: 'dev-user',
                  email: 'dev@caredroid.local',
                  name: 'Development User',
                  role: 'admin',
                  fullName: 'Development User',
                  isEmailVerified: true,
                  twoFactorEnabled: false,
                  createdAt: new Date().toISOString()
                };
                
                // Save to localStorage FIRST
                localStorage.setItem('caredroid_user_profile', JSON.stringify(mockUser));
                localStorage.setItem('caredroid_access_token', bypassToken);
                localStorage.setItem('authToken', bypassToken);
                
                // Update user context
                setUser(mockUser);
                
                logger.info('Saved auth data to localStorage');
                logger.debug('Stored token present', { hasToken: Boolean(localStorage.getItem('caredroid_access_token')) });
                
                // Call onAuthSuccess with BOTH token and user
                if (onAuthSuccess) {
                  logger.info('Calling onAuthSuccess');
                  onAuthSuccess(bypassToken, mockUser);
                  logger.info('onAuthSuccess completed');
                } else {
                  logger.error('onAuthSuccess is not defined');
                }
                
                // Navigate to dashboard
                navigate('/dashboard', { replace: true });
                success('Signed in', 'Welcome to CareDroid!');
              } catch (error) {
                logger.error('Error in direct sign-in', { error });
              }
              
              info('Signing in', 'Signing in...');
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
