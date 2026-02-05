import React from 'react';
import PreferenceCheckbox from './PreferenceCheckbox';

const NotificationTypeSection = ({ type, title, preferences, handleChange }) => (
  <section className="preference-section">
    <h3>{title}</h3>
    <div className="preference-options">
      <PreferenceCheckbox
        label="Critical Alerts"
        description="Emergency detection, severe warnings"
        checked={preferences[type].critical}
        onChange={(value) => handleChange(type, 'critical', value)}
        required
      />
      <PreferenceCheckbox
        label="Updates"
        description="System updates, new features"
        checked={preferences[type].updates}
        onChange={(value) => handleChange(type, 'updates', value)}
      />
      <PreferenceCheckbox
        label="Announcements"
        description="News, product announcements"
        checked={preferences[type].announcements}
        onChange={(value) => handleChange(type, 'announcements', value)}
      />
    </div>
  </section>
);

export default NotificationTypeSection;