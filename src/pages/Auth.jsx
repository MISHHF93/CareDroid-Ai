import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/atoms/Button';
import { Card } from '../components/ui/molecules/Card';
import { Input } from '../components/ui/atoms/Input';
import appConfig from '../config/appConfig';
import { apiFetch, buildApiUrl } from '../services/apiClient';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { useUser } from '../contexts/UserContext';
import logger from '../utils/logger';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';

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
  const googleAuthUrl = buildApiUrl('/api/auth/google');
  const linkedInAuthUrl = buildApiUrl('/api/auth/linkedin');
  const { success, error, info } = useNotificationActions();
  const { t } = useLanguage();

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
        info(t('auth.twoFactorRequired'), t('auth.enter2FACode'));
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
        success(t('auth.signedIn'), t('auth.welcomeMessage'));
      } else {
        success(t('auth.registrationComplete'), t('auth.verifyEmail'));
      }
    } catch (error) {
      error(t('auth.authFailed'), t('auth.checkCredentials'));
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    
    if (!twoFactorToken || twoFactorToken.length < 6) {
      error(t('auth.invalidCode'), t('auth.enterValid6DigitCode'));
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
        success(t('auth.signedIn'), t('auth.successfullyAuthenticated'));
      }
    } catch (err) {
      error(t('auth.invalid2FACode'), t('auth.pleaseTryAgain'));
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
      info(t('auth.emailRequired'), t('auth.enterInstitutionalEmail'));
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

      success(t('auth.magicLinkSent'), t('auth.checkEmail'));
    } catch (error) {
      error(t('auth.magicLinkFailed'), t('auth.unableToSendMagicLink'));
    }
  };

  return (
    <Card
      className="auth-enterprise-card"
      padding="none"
      border={false}
      shadow="none"
      rounded={false}
      style={{ width: '100%', maxWidth: '100%' }}
    >
      {/* 2FA Verification Screen */}
      {requiresTwoFactor ? (
        <div className="auth-screen auth-2fa-screen">
          <div className="auth-2fa-header">
            <div className="auth-2fa-icon">🔐</div>
            <h2 className="auth-title">{t('auth.twoFactorAuth')}</h2>
            <p className="auth-subtitle">
              {t('auth.twoFactorPrompt')}
            </p>
          </div>

          <form onSubmit={handleTwoFactorSubmit} className="auth-2fa-form">
            <Input
              type="text"
              placeholder="000000"
              value={twoFactorToken}
              onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              className="auth-2fa-input"
              autoComplete="off"
              autoFocus
            />

            <div className="auth-2fa-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelTwoFactor}
                className="auth-btn-secondary"
              >
                {t('auth.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={twoFactorToken.length < 6}
                className="auth-btn-primary"
              >
                {t('auth.verify')}
              </Button>
            </div>
          </form>

          <div className="auth-2fa-footer">
            <button
              type="button"
              onClick={() => setTwoFactorToken('')}
              className="auth-inline-btn"
            >
              {t('auth.useBackupCode')}
            </button>
          </div>
        </div>
      ) : (
        <div className="auth-screen">
          {/* Regular Login Screen */}
          <div className="auth-title-block">
            <h2 className="auth-title">{t('auth.institutionalSignIn')}</h2>
            <p className="auth-subtitle">
              {t('auth.secureAccessDescription')}
            </p>
          </div>

      <form onSubmit={handleMagicLink} className="auth-magic-form">
        <Input
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={magicEmail}
          onChange={(e) => setMagicEmail(e.target.value)}
          className="auth-input auth-magic-input"
        />
        <Button type="submit" className="auth-magic-btn">{t('auth.sendLink')}</Button>
      </form>

        <div className="auth-provider-grid">
          <button
            onClick={async () => {
              try {
                const response = await apiFetch('/api/auth/oidc');
                const data = await response.json().catch(() => ({}));
                info(t('auth.ssoStatus'), data?.message || t('auth.oidcNotConfigured'));
              } catch (error) {
                info(t('auth.ssoUnavailable'), t('auth.oidcNotAvailable'));
              }
            }}
            className="auth-provider-btn"
          >
            🔐 {t('auth.institutionalSSOOIDC')}
          </button>
          <button
            onClick={async () => {
              try {
                const response = await apiFetch('/api/auth/saml');
                const data = await response.json().catch(() => ({}));
                info(t('auth.ssoStatus'), data?.message || t('auth.samlNotConfigured'));
              } catch (error) {
                info(t('auth.ssoUnavailable'), t('auth.samlNotAvailable'));
              }
            }}
            className="auth-provider-btn"
          >
            🏢 {t('auth.institutionalSSOSAML')}
          </button>
        </div>

        <div className="auth-separator">
          {t('auth.orContinueSocialLogin')}
        </div>

        <div className="auth-social-grid">
          <a href={googleAuthUrl} className="auth-social-link" aria-label={t('auth.continueWithGoogle')}>
            <span className="auth-social-icon auth-social-icon-google" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.25 1.25-.95 2.3-2 3l3.25 2.5c1.9-1.75 3-4.35 3-7.45 0-.7-.07-1.35-.2-2H12z"/>
                <path fill="#34A853" d="M12 22c2.7 0 4.95-.9 6.6-2.4l-3.25-2.5c-.9.6-2.05.95-3.35.95-2.6 0-4.8-1.75-5.6-4.1l-3.35 2.6C4.7 19.75 8.05 22 12 22z"/>
                <path fill="#FBBC05" d="M6.4 13.95c-.2-.6-.3-1.25-.3-1.95s.1-1.35.3-1.95l-3.35-2.6C2.35 8.8 2 10.35 2 12s.35 3.2 1.05 4.55l3.35-2.6z"/>
                <path fill="#4285F4" d="M12 5.95c1.45 0 2.75.5 3.8 1.5l2.85-2.85C16.95 3 14.7 2 12 2 8.05 2 4.7 4.25 3.05 7.45l3.35 2.6c.8-2.35 3-4.1 5.6-4.1z"/>
              </svg>
            </span>
            <span>{t('auth.continueWithGoogle')}</span>
          </a>
          <a href={linkedInAuthUrl} className="auth-social-link" aria-label={t('auth.continueWithLinkedIn')}>
            <span className="auth-social-icon auth-social-icon-linkedin" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2" />
                <rect x="6" y="10" width="2.4" height="8" fill="#FFFFFF" />
                <circle cx="7.2" cy="7.3" r="1.35" fill="#FFFFFF" />
                <path d="M11 10h2.3v1.1h.03c.32-.6 1.1-1.24 2.27-1.24 2.43 0 2.88 1.6 2.88 3.68V18h-2.4v-3.95c0-.94-.02-2.15-1.31-2.15-1.31 0-1.51 1.02-1.51 2.08V18H11v-8z" fill="#FFFFFF"/>
              </svg>
            </span>
            <span>{t('auth.continueWithLinkedIn')}</span>
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
                  name: 'Dr. Sarah Mitchell',
                  role: 'admin',
                  fullName: 'Dr. Sarah Mitchell',
                  isEmailVerified: true,
                  twoFactorEnabled: false,
                  createdAt: '2025-01-15T08:00:00.000Z',
                  lastLoginAt: new Date().toISOString(),
                  lastLoginIp: '10.0.1.42',
                  profile: {
                    firstName: 'Sarah',
                    lastName: 'Mitchell',
                    fullName: 'Dr. Sarah Mitchell',
                    specialty: 'Critical Care Medicine',
                    institution: 'Johns Hopkins Hospital',
                    licenseNumber: 'MD-2024-74521',
                    country: 'United States',
                    languagePreference: 'English',
                    timezone: 'America/New_York',
                    verified: true,
                    trustScore: 82,
                    avatarUrl: null,
                    consentMarketingCommunications: false,
                    consentDataProcessing: true,
                    consentThirdPartySharing: false,
                  },
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
                success(t('auth.signedIn'), t('auth.welcomeMessage'));
              } catch (error) {
                logger.error('Error in direct sign-in', { error });
              }
              
              info(t('auth.signingIn'), t('auth.signingInProgress'));
            }}
            variant="ghost"
            className="auth-dev-btn"
          >
            ⚡ {t('auth.directSignIn')}
          </Button>
        </div>

        <div className="auth-separator auth-separator-small">
          {t('auth.orSignInWithEmail')}
        </div>

        <form onSubmit={handleSubmit} className="auth-email-form">
          {mode === 'signup' && (
            <Input
              type="text"
              placeholder={t('auth.fullName')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="auth-input"
            />
          )}
          <Input
            type="email"
            placeholder={t('auth.emailAddress')}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="auth-input"
          />
          <Input
            type="password"
            placeholder={t('auth.password')}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="auth-input"
          />
          <Button type="submit" className="auth-submit-btn">
            {mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
          </Button>
        </form>
        <div className="auth-toggle-row">
          {mode === 'login' ? (
            <span>
              {t('auth.newHere')}{' '}
              <button
                onClick={() => setMode('signup')}
                className="auth-inline-btn"
              >
                {t('auth.createAccount')}
              </button>
            </span>
          ) : (
            <span>
              {t('auth.alreadyHaveAccount')}{' '}
              <button
                onClick={() => setMode('login')}
                className="auth-inline-btn"
              >
                {t('auth.signIn')}
              </button>
            </span>
          )}
        </div>

        <div className="auth-utility-links" aria-label="Auth quick navigation">
          <Link to="/help" className="auth-utility-link">Help</Link>
          <Link to="/privacy" className="auth-utility-link">Privacy</Link>
          <Link to="/terms" className="auth-utility-link">Terms</Link>
        </div>

        <div className="auth-back-row">
          <Link to="/" className="auth-back-link">
            {t('auth.backToChat')}
          </Link>
        </div>
        </div>
      )}
    </Card>
  );
};

export default Auth;
