import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiAxios } from '../services/apiClient';
import { NativeBiometric, BiometricOptions } from '@capacitor/biometric';
import './BiometricSetup.css';
import appConfig from '../config/appConfig';

const BiometricSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!appConfig.features.enableBiometricAuth) {
      return;
    }

    checkBiometricAvailability();
    loadBiometricConfig();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const result = await NativeBiometric.isAvailable();
      setBiometricAvailable(result.isAvailable);
      setBiometricType(result.biometryType); // 'fingerprint', 'face', 'iris'
    } catch (err) {
      console.error('Biometric not available:', err);
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
      console.error('Failed to load biometric config:', err);
    }
  };

  const handleEnrollBiometric = async () => {
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
      await NativeBiometric.setCredentials({
        username: 'caredroid_user',
        password: challengeToken,
        server: 'caredroid-ai.com',
      });

      setEnrolled(true);
      setError(null);

      alert('Biometric authentication enabled successfully!');
      loadBiometricConfig();
    } catch (err) {
      console.error('Failed to enroll biometric:', err);
      setError(err.response?.data?.message || 'Failed to enable biometric authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleTestBiometric = async () => {
    setLoading(true);
    setError(null);

    try {
      // Retrieve stored credentials
      const credentials = await NativeBiometric.getCredentials({
        server: 'caredroid-ai.com',
      });

      // Prompt biometric authentication
      const biometricOptions = {
        reason: 'Authenticate with biometrics',
        title: 'CareDroid-AI Authentication',
        subtitle: 'Use your biometric to login',
        description: 'Place your finger on the sensor',
      };

      await NativeBiometric.verifyIdentity(biometricOptions);

      // If verification succeeds, call backend
      const deviceId = await getDeviceId();
      const userId = getUserIdFromToken();

      const response = await apiAxios.post('/api/auth/biometric/verify', {
        userId,
        deviceId,
        challengeResponse: credentials.password,
      });

      console.log('Biometric verification successful:', response.data);
      alert('Biometric authentication test passed!');
    } catch (err) {
      console.error('Biometric test failed:', err);
      setError('Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableBiometric = async () => {
    if (!confirm('Are you sure you want to disable biometric authentication?')) {
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
      await NativeBiometric.deleteCredentials({
        server: 'caredroid-ai.com',
      });

      setEnrolled(false);
      setError(null);

      alert('Biometric authentication disabled');
      loadBiometricConfig();
    } catch (err) {
      console.error('Failed to disable biometric:', err);
      setError('Failed to disable biometric authentication');
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
            <h2>🔒 Biometric Disabled</h2>
            <p>Biometric authentication is disabled by configuration.</p>
            <button onClick={() => navigate('/settings')} className="btn-secondary">
              Back to Settings
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
            <h2>⚠️ Biometric Not Available</h2>
            <p>
              Your device does not support biometric authentication, or it is not configured.
            </p>
            <p>Please set up fingerprint or face recognition in your device settings.</p>
            <button onClick={() => navigate('/settings')} className="btn-secondary">
              Back to Settings
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
          <h1>Biometric Authentication</h1>
          <p>
            Secure your CareDroid-AI account with {biometricType === 'face' ? 'Face ID' : 'fingerprint'}
          </p>
        </div>

        <div className="biometric-status">
          {enrolled ? (
            <div className="status-enrolled">
              <div className="status-icon">✓</div>
              <h3>Biometric Enabled</h3>
              <p>Your device is enrolled for biometric authentication</p>
            </div>
          ) : (
            <div className="status-not-enrolled">
              <div className="status-icon">🔒</div>
              <h3>Not Enrolled</h3>
              <p>Enable biometric authentication for quick and secure login</p>
            </div>
          )}
        </div>

        {stats && (
          <div className="biometric-stats">
            <h3>Usage Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.totalDevices}</div>
                <div className="stat-label">Enrolled Devices</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.totalUsages}</div>
                <div className="stat-label">Total Logins</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {stats.lastUsed ? new Date(stats.lastUsed).toLocaleDateString() : 'Never'}
                </div>
                <div className="stat-label">Last Used</div>
              </div>
            </div>
          </div>
        )}

        <div className="biometric-info">
          <h3>How It Works</h3>
          <ul>
            <li>🔐 Your biometric data never leaves your device</li>
            <li>🚀 Quick login without entering password</li>
            <li>✨ Enhanced security with hardware-backed authentication</li>
            <li>🔄 Fallback to password if biometric fails</li>
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
                {loading ? 'Enrolling...' : 'Enable Biometric Authentication'}
              </button>
              <button onClick={() => navigate('/settings')} className="btn-secondary">
                Maybe Later
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleTestBiometric}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Testing...' : 'Test Biometric Login'}
              </button>
              <button
                onClick={handleDisableBiometric}
                className="btn-danger"
                disabled={loading}
              >
                {loading ? 'Disabling...' : 'Disable Biometric'}
              </button>
              <button onClick={() => navigate('/settings')} className="btn-secondary">
                Back to Settings
              </button>
            </>
          )}
        </div>

        <div className="biometric-notice">
          <p>
            <strong>Note:</strong> Biometric authentication is a convenience feature.
            You can always use your password to login.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BiometricSetup;
