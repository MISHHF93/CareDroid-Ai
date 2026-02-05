import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import { useNotificationActions } from '../hooks/useNotificationActions';
import SettingItem from '../components/SettingItem';

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [safetyBanner, setSafetyBanner] = useState(true);
  const [themePref, setThemePref] = useState('system');
  const { success } = useNotificationActions();

  const handleSave = () => {
    success('Settings saved', 'Settings saved.');
  };

  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '48px' }}>
      <Card style={{ width: '100%', maxWidth: '720px' }}>
        <h2 style={{ marginTop: 0 }}>Settings</h2>
        <p style={{ color: 'var(--muted-text)', fontSize: '14px' }}>
          Configure CareDroid preferences and notifications.
        </p>

        <div style={{ marginTop: '20px', display: 'grid', gap: '14px' }}>
          <SettingItem
            title="Theme preference"
            description="System, light, or dark"
            control={
              <select
                value={themePref}
                onChange={(e) => setThemePref(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-color)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '8px',
                  padding: '6px 10px'
                }}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            }
          />

          <SettingItem
            title="Notifications"
            description="AI results and alerts"
            control={
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
              />
            }
          />

          <SettingItem
            title="Safety banner"
            description="Always show clinical disclaimer"
            control={
              <input
                type="checkbox"
                checked={safetyBanner}
                onChange={() => setSafetyBanner(!safetyBanner)}
              />
            }
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <Button onClick={handleSave}>Save changes</Button>
          <Link to="/" style={{ color: '#00FF88', textDecoration: 'none', alignSelf: 'center' }}>
            Back to chat
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
