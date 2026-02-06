import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseClasses = ['btn'];
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
    warning: 'btn-warning',
    clinical: 'btn-clinical'
  };
  const sizeClasses = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'btn-xl'
  };

  const classes = [
    ...baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    fullWidth && 'btn-full-width',
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg className="spinner-icon" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M12 2C13.1046 2 14 2.89543 14 4V8C14 9.10457 13.1046 10 12 10C10.8954 10 10 9.10457 10 8V4C10 2.89543 10.8954 2 12 2Z"
              fill="currentColor"
              className="spinner-path"
            />
          </svg>
        </span>
      )}

      {!loading && leftIcon && (
        <span className="btn-icon btn-icon-left" aria-hidden="true">
          {leftIcon}
        </span>
      )}

      <span className="btn-content">
        {children}
      </span>

      {!loading && rightIcon && (
        <span className="btn-icon btn-icon-right" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export { Button };