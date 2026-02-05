import React from 'react';

const SettingItem = ({ title, description, control }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--panel-border)'
  }}>
    <div>
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--muted-text)' }}>{description}</div>
    </div>
    {control}
  </div>
);

export default SettingItem;