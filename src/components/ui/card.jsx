import React from 'react';

const Card = ({ children, style, subtle = false }) => {
  return (
    <div className={subtle ? 'card-subtle' : 'card'} style={{ padding: '24px', ...style }}>
      {children}
    </div>
  );
};

export default Card;
