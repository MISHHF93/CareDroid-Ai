import React from 'react';
import './Card.css';

const Card = ({
  children,
  variant = 'default',
  size = 'md',
  padding = 'md',
  shadow = 'sm',
  border = true,
  rounded = true,
  interactive = false,
  loading = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = ['card'];
  const variantClasses = {
    default: 'card-default',
    elevated: 'card-elevated',
    outlined: 'card-outlined',
    filled: 'card-filled',
    glass: 'card-glass'
  };
  const sizeClasses = {
    sm: 'card-sm',
    md: 'card-md',
    lg: 'card-lg',
    xl: 'card-xl'
  };
  const paddingClasses = {
    none: 'card-padding-none',
    sm: 'card-padding-sm',
    md: 'card-padding-md',
    lg: 'card-padding-lg',
    xl: 'card-padding-xl'
  };
  const shadowClasses = {
    none: 'card-shadow-none',
    sm: 'card-shadow-sm',
    md: 'card-shadow-md',
    lg: 'card-shadow-lg',
    xl: 'card-shadow-xl'
  };

  const classes = [
    ...baseClasses,
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.md,
    paddingClasses[padding] || paddingClasses.md,
    shadowClasses[shadow] || shadowClasses.sm,
    !border && 'card-no-border',
    !rounded && 'card-no-rounded',
    interactive && 'card-interactive',
    loading && 'card-loading',
    onClick && 'card-clickable',
    className
  ].filter(Boolean).join(' ');

  const Component = onClick ? 'button' : 'div';
  const componentProps = onClick ? {
    type: 'button',
    onClick,
    role: 'button',
    tabIndex: 0,
    ...props
  } : props;

  return (
    <Component className={classes} {...componentProps}>
      {loading && (
        <div className="card-loading-overlay" aria-hidden="true">
          <div className="card-loading-spinner" />
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </Component>
  );
};

export { Card };