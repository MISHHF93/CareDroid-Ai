import React from 'react';

const Button = ({ variant = 'primary', children, style, ...props }) => {
  const className = variant === 'ghost' ? 'btn-ghost' : 'btn-primary';
  return (
    <button className={className} style={style} {...props}>
      {children}
    </button>
  );
};

export default Button;
