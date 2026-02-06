import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({
  type = 'text',
  variant = 'default',
  size = 'md',
  state = 'default',
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  label,
  helperText,
  error,
  success,
  fullWidth = false,
  className = '',
  onChange,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const baseClasses = ['input'];
  const variantClasses = {
    default: 'input-default',
    filled: 'input-filled',
    outlined: 'input-outlined',
    ghost: 'input-ghost'
  };
  const sizeClasses = {
    sm: 'input-sm',
    md: 'input-md',
    lg: 'input-lg'
  };
  const stateClasses = {
    default: 'input-state-default',
    focus: 'input-state-focus',
    error: 'input-state-error',
    success: 'input-state-success',
    disabled: 'input-state-disabled'
  };

  const wrapperClasses = [
    'input-wrapper',
    fullWidth && 'input-wrapper-full-width',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    ...baseClasses,
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.md,
    stateClasses[state] || stateClasses.default,
    disabled && 'input-disabled',
    error && 'input-error',
    success && 'input-success',
    leftIcon && 'input-has-left-icon',
    rightIcon && 'input-has-right-icon'
  ].filter(Boolean).join(' ');

  const handleFocus = (e) => {
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    onBlur?.(e);
  };

  const handleChange = (e) => {
    onChange?.(e);
  };

  return (
    <div className={wrapperClasses}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required" aria-label="required">*</span>}
        </label>
      )}

      <div className="input-container">
        {leftIcon && (
          <div className="input-icon input-icon-left" aria-hidden="true">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          className={inputClasses}
          disabled={disabled}
          required={required}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText || error ? `${props.id || props.name}-helper` : undefined}
          {...props}
        />

        {rightIcon && (
          <div className="input-icon input-icon-right" aria-hidden="true">
            {rightIcon}
          </div>
        )}
      </div>

      {(helperText || error || success) && (
        <div
          id={`${props.id || props.name}-helper`}
          className={`input-helper ${
            error ? 'input-helper-error' :
            success ? 'input-helper-success' :
            'input-helper-default'
          }`}
        >
          {error || success || helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };