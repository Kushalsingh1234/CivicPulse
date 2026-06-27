import React from 'react';

export default function Badge({
  children,
  variant = 'neutral',
  className = '',
  size = 'md'
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full border tracking-wide select-none';

  const variants = {
    neutral: 'bg-secondary-surface text-secondary-text border-borders',
    primary: 'bg-primary-accent/8 text-primary-accent border-primary-accent/20',
    secondary: 'bg-secondary-accent/8 text-secondary-accent border-secondary-accent/20',
    success: 'bg-success/8 text-success-text text-emerald-600 border-success/20',
    warning: 'bg-warning/8 text-amber-600 border-warning/20',
    danger: 'bg-danger/8 text-danger border-danger/20',
    info: 'bg-blue-50 text-blue-600 border-blue-100'
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3.5 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
