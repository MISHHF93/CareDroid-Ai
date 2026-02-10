import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiAxios } from '../services/apiClient';
import './BiometricSetup.css';
import appConfig from '../config/appConfig';
import logger from '../utils/logger';
import { useLanguage } from '../contexts/LanguageContext';

const BiometricSetup = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [stats, setStats] = useState(null);
  const [biometricApi, setBiometricApi] = useState(null);
  const [biometricReady, setBiometricReady] = useState(false);

  useEffect(() => {
    if (!appConfig.features.enableBiometricAuth) {
      return;
    }
    const loadBiometricApi = async () => {
      try {
        const moduleName = '@capacitor/biometric';
        const module = await import(/* @vite-ignore */ moduleName);
        setBiometricApi(module);
        setBiometricReady(true);
      } catch (err) {
        logger.error('Biometric plugin not available', { err });
        setError(t('biometric.pluginNotAvailable'));
        setBiometricAvailable(false);
      }
    };

    loadBiometricApi();
  }, []);

  useEffect(() => {
    if (!biometricReady || !biometricApi) {
      return;
    }

    checkBiometricAvailability();
    loadBiometricConfig();
  }, [biometricReady, biometricApi]);

  const checkBiometricAvailability = async () => {
    if (!biometricApi?.NativeBiometric) {
      return;
    }
    try {
      const result = await biometricApi.NativeBiometric.isAvailable();
      setBiometricAvailable(result.isAvailable);
      setBiometricType(result.biometryType); // 'fingerprint', 'face', 'iris'
    } catch (err) {
      logger.error('Biometric not available', { err });
      setBiometricAvailable(false);
    }
  };

  const loadBiometricConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiAxios.get('/api/auth/biometric/config', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.configs && response.data.configs.length > 0) {
        setEnrolled(true);
      }

      // Load stats
      const statsResponse = await apiAxios.get('/api/auth/biometric/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats(statsResponse.data.stats);
    } catch (err) {
      logger.error('Failed to load biometric config', { err });
    }
  };

  const handleEnrollBiometric = async () => {
    if (!biometricApi?.NativeBiometric) {
      setError(t('biometric.pluginNotAvailable'));
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Get device ID
      const deviceId = await getDeviceId();
      const deviceName = await getDeviceName();

      // Call backend to enroll
      const token = localStorage.getItem('token');
      const response = await apiAxios.post(
        '/api/auth/biometric/enroll',
        {
          biometricType: biometricType || 'fingerprint',
          deviceId,
          deviceName,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Store challenge token securely
      const { challengeToken } = response.data;
      await biometricApi.NativeBiometric.setCredentials({
        username: 'caredroid_user',
        password: challengeToken,
        server: 'caredroid-ai.com',
      });

      setEnrolled(true);
      setError(null);

      alert(t('biometric.enabledSuccess'));
      loadBiometricConfig();
    } catch (err) {
      logger.error('Failed to enroll biometric', { err });
      setError(err.response?.data?.message || t('biometric.enableFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleTestBiometric = async () => {
    if (!biometricApi?.NativeBiometric) {
      setError(t('biometric.pluginNotAvailable'));
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Retrieve stored credentials
      const credentials = await biometricApi.NativeBiometric.getCredentials({
        server: 'caredroid-ai.com',
      });

      // Prompt biometric authentication
      const biometricOptions = {
        reason: t('biometric.authenticatePrompt'),
        title: t('biometric.authTitle'),
        subtitle: t('biometric.authSubtitle'),
        description: t('biometric.authDescription'),
      };

      await biometricApi.NativeBiometric.verifyIdentity(biometricOptions);

      // If verification succeeds, call backend
      const deviceId = await getDeviceId();
      const userId = getUserIdFromToken();

      const response = await apiAxios.post('/api/auth/biometric/verify', {
        userId,
        deviceId,
        challengeResponse: credentials.password,
      });

      logger.info('Biometric verification successful', { data: response.data });
      alert(t('biometric.testPassed'));
    } catch (err) {
      logger.error('Biometric test failed', { err });
      setError(t('biometric.testFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDisableBiometric = async () => {
    if (!biometricApi?.NativeBiometric) {
      setError(t('biometric.pluginNotAvailable'));
      return;
    }
    if (!confirm(t('biometric.disableConfirm'))) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const deviceId = await getDeviceId();

      await apiAxios.delete(`/api/auth/biometric/disable/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Delete stored credentials
      await biometricApi.NativeBiometric.deleteCredentials({
        server: 'caredroid-ai.com',
      });

      setEnrolled(false);
      setError(null);

      alert(t('biometric.disabledAlert'));
      loadBiometricConfig();
    } catch (err) {
      logger.error('Failed to disable biometric', { err });
      setError(t('biometric.disableFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getDeviceId = async () => {
    // In production, use a proper device ID from Capacitor Device plugin
    return `device_${Date.now()}`;
  };

  const getDeviceName = async () => {
    // In production, use Capacitor Device plugin
    return 'Mobile Device';
  };

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub;
    } catch {
      return null;
    }
  };

  if (!appConfig.features.enableBiometricAuth) {
    return (
      <div className="biometric-setup">
        <div className="biometric-container">
          <div className="biometric-unavailable">
            <h2>🔒 {t('biometric.disabledTitle')}</h2>
            <p>{t('biometric.disabledByConfig')}</p>
            <button onClick={() => navigate('/settings')} className="btn-secondary">
              {t('biometric.backToSettings')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!biometricAvailable) {
    return (
      <div className="biometric-setup">
        <div className="biometric-container">
          <div className="biometric-unavailable">
            <h2>⚠️ {t('biometric.notAvailableTitle')}</h2>
            <p>
              {t('biometric.notAvailableDesc')}
            </p>
            <p>{t('biometric.setupInDevice')}</p>
            <button onClick={() => navigate('/settings')} className="btn-secondary">
              {t('biometric.backToSettings')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="biometric-setup">
      <div className="biometric-container">
        <div className="biometric-header">
          <h1>{t('biometric.title')}</h1>
          <p>
            {biometricType === 'face' ? t('biometric.secureWithFaceId') : t('biometric.secureWithFingerprint')}
          </p>
        </div>

        <div className="biometric-status">
          {enrolled ? (
            <div className="status-enrolled">
              <div className="status-icon">✓</div>
              <h3>{t('biometric.enabledTitle')}</h3>
              <p>{t('biometric.enrolledDesc')}</p>
            </div>
          ) : (
            <div className="status-not-enrolled">
              <div className="status-icon">🔒</div>
              <h3>{t('biometric.notEnrolledTitle')}</h3>
              <p>{t('biometric.notEnrolledDesc')}</p>
            </div>
          )}
        </div>

        {stats && (
          <div className="biometric-stats">
            <h3>{t('biometric.usageStats')}</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.totalDevices}</div>
                <div className="stat-label">{t('biometric.enrolledDevices')}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.totalUsages}</div>
                <div className="stat-label">{t('biometric.totalLogins')}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {stats.lastUsed ? new Date(stats.lastUsed).toLocaleDateString() : t('biometric.never')}
                </div>
                <div className="stat-label">{t('biometric.lastUsed')}</div>
              </div>
            </div>
          </div>
        )}

        <div className="biometric-info">
          <h3>{t('biometric.howItWorks')}</h3>
          <ul>
            <li>🔐 {t('biometric.howItWorks1')}</li>
            <li>🚀 {t('biometric.howItWorks2')}</li>
            <li>✨ {t('biometric.howItWorks3')}</li>
            <li>🔄 {t('biometric.howItWorks4')}</li>
          </ul>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="biometric-actions">
          {!enrolled ? (
            <>
              <button
                onClick={handleEnrollBiometric}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? t('biometric.enrolling') : t('biometric.enableBiometric')}
              </button>
              <button onClick={() => navigate('/settings')} className="btn-secondary">
                {t('biometric.maybeLater')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleTestBiometric}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? t('biometric.testing') : t('biometric.testBiometric')}
              </button>
              <button
                onClick={handleDisableBiometric}
                className="btn-danger"
                disabled={loading}
              >
                {loading ? t('biometric.disabling') : t('biometric.disableBiometric')}
              </button>
              <button onClick={() => navigate('/settings')} className="btn-secondary">
                {t('biometric.backToSettings')}
              </button>
            </>
          )}
        </div>

        <div className="biometric-notice">
          <p>
            <strong>{t('biometric.noteLabel')}</strong> {t('biometric.noteText')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BiometricSetup;
