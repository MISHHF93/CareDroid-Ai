import React from 'react';

const Toggle = ({ label, checked, onChange, description, className = 'channel-toggle' }) => (
  <div className={className}>
    <div className="toggle-header">
      <span>{label}</span>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider"></span>
      </label>
    </div>
    <p className="channel-desc">{description}</p>
  </div>
);

export default Toggle;