import React from 'react';
import './Badge.css';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  shape = 'rounded',
  className = '',
  ...props
}) => {
  const baseClasses = ['badge'];
  const variantClasses = {
    default: 'badge-default',
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    critical: 'badge-critical',
    urgent: 'badge-urgent',
    moderate: 'badge-moderate'
  };
  const sizeClasses = {
    xs: 'badge-xs',
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg'
  };
  const shapeClasses = {
    square: 'badge-square',
    rounded: 'badge-rounded',
    pill: 'badge-pill'
  };

  const classes = [
    ...baseClasses,
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.md,
    shapeClasses[shape] || shapeClasses.rounded,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export { Badge };