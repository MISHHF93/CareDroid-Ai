import React from 'react';

const Input = ({ style, ...props }) => {
  return (
    <input
      {...props}
      style={{
        padding: '12px 14px',
        borderRadius: '12px',
        border: '1px solid var(--panel-border)',
        background: 'transparent',
        color: 'var(--text-color)',
        ...style
      }}
    />
  );
};

export default Input;
