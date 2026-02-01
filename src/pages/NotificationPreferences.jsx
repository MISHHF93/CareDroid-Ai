import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiAxios } from '../services/apiClient';
import './NotificationPreferences.css';

const NotificationPreferences = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [preferences, setPreferences] = useState({
    emergencyAlerts: true,
    medicationReminders: true,
    appointmentReminders: true,
    labResults: true,
    marketingCommunications: false,
    securityAlerts: true,
    systemUpdates: true,
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiAxios.get('/api/notifications/preferences', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSuccess(false);
  };

  const handleTimeChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      await apiAxios.patch(
        '/api/notifications/preferences',
        preferences,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAll = async (enabled) => {
    try {
      const token = localStorage.getItem('token');
      await apiAxios.post(
        '/api/notifications/preferences/toggle-all',
        { enabled },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPreferences(prev => ({
        ...prev,
        pushEnabled: enabled,
        emailEnabled: enabled,
        smsEnabled: enabled,
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to toggle all notifications:', err);
      setError('Failed to update preferences');
    }
  };

  if (loading) {
    return (
      <div className="notification-preferences">
        <div className="preferences-container">
          <div className="loading-spinner">Loading preferences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-preferences">
      <div className="preferences-container">
        <div className="preferences-header">
          <Link to="/settings" className="back-button">
            ← Back to Settings
          </Link>
          <h1>Notification Preferences</h1>
          <p>Manage how and when you receive notifications</p>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button
              onClick={() => handleToggleAll(true)}
              className="btn-enable-all"
            >
              Enable All
            </button>
            <button
              onClick={() => handleToggleAll(false)}
              className="btn-disable-all"
            >
              Disable All
            </button>
          </div>
        </div>

        {/* Notification Categories */}
        <div className="preferences-section">
          <h3>Notification Categories</h3>
          <p className="section-description">
            Choose which types of notifications you want to receive
          </p>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">🚨</div>
              <div className="preference-details">
                <h4>Emergency Alerts</h4>
                <p>Critical medical alerts and 911 dispatch notifications</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.emergencyAlerts}
                onChange={() => handleToggle('emergencyAlerts')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">💊</div>
              <div className="preference-details">
                <h4>Medication Reminders</h4>
                <p>Reminders to take your medications on time</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.medicationReminders}
                onChange={() => handleToggle('medicationReminders')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">📅</div>
              <div className="preference-details">
                <h4>Appointment Reminders</h4>
                <p>Upcoming medical appointments and checkups</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.appointmentReminders}
                onChange={() => handleToggle('appointmentReminders')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">🧪</div>
              <div className="preference-details">
                <h4>Lab Results</h4>
                <p>Notifications when lab results are available</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.labResults}
                onChange={() => handleToggle('labResults')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">🔒</div>
              <div className="preference-details">
                <h4>Security Alerts</h4>
                <p>Account security and suspicious activity notifications</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.securityAlerts}
                onChange={() => handleToggle('securityAlerts')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">🔄</div>
              <div className="preference-details">
                <h4>System Updates</h4>
                <p>App updates, new features, and maintenance notices</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.systemUpdates}
                onChange={() => handleToggle('systemUpdates')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">📢</div>
              <div className="preference-details">
                <h4>Marketing Communications</h4>
                <p>Product updates, tips, and promotional offers</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.marketingCommunications}
                onChange={() => handleToggle('marketingCommunications')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Delivery Methods */}
        <div className="preferences-section">
          <h3>Delivery Methods</h3>
          <p className="section-description">
            Choose how you want to receive notifications
          </p>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">📱</div>
              <div className="preference-details">
                <h4>Push Notifications</h4>
                <p>Receive notifications on your mobile device</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.pushEnabled}
                onChange={() => handleToggle('pushEnabled')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">📧</div>
              <div className="preference-details">
                <h4>Email Notifications</h4>
                <p>Receive notifications via email</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={() => handleToggle('emailEnabled')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">💬</div>
              <div className="preference-details">
                <h4>SMS Notifications</h4>
                <p>Receive important notifications via text message</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.smsEnabled}
                onChange={() => handleToggle('smsEnabled')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="preferences-section">
          <h3>Quiet Hours</h3>
          <p className="section-description">
            Set hours when you don't want to receive non-urgent notifications
          </p>

          <div className="preference-item">
            <div className="preference-info">
              <div className="preference-icon">🌙</div>
              <div className="preference-details">
                <h4>Enable Quiet Hours</h4>
                <p>Emergency alerts will still come through</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.quietHoursEnabled}
                onChange={() => handleToggle('quietHoursEnabled')}
              />
              <span className="slider"></span>
            </label>
          </div>

          {preferences.quietHoursEnabled && (
            <div className="quiet-hours-config">
              <div className="time-input-group">
                <label>
                  <span>Start Time</span>
                  <input
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                  />
                </label>
                <label>
                  <span>End Time</span>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Preferences saved successfully!</div>}

        {/* Save Button */}
        <div className="preferences-actions">
          <button
            onClick={handleSave}
            className="btn-save"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Footer Info */}
        <div className="preferences-footer">
          <p>
            💡 <strong>Tip:</strong> You can change these settings anytime. Emergency alerts cannot be disabled for your safety.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
