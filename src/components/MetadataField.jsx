import React from 'react';

const MetadataField = ({ label, value, isLink = false }) => (
  <div>
    <div style={{
      fontSize: '11px',
      fontWeight: 600,
      color: 'rgba(255, 255, 255, 0.5)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '6px',
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '13px',
      color: isLink ? '#00B4FF' : 'rgba(255, 255, 255, 0.8)',
      wordBreak: isLink ? 'break-all' : 'normal',
    }}>
      {value}
    </div>
  </div>
);

export default MetadataField;