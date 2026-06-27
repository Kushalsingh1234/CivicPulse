import React from 'react';
import { motion } from 'framer-motion';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  ...props
}) {
  // Styles for different variants
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-accent/20 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary: 'bg-primary-accent text-white hover:bg-primary-accent/90 shadow-sm border border-transparent',
    secondary: 'bg-secondary-surface text-primary-text hover:bg-borders/50 border border-borders/50',
    outline: 'border border-borders text-secondary-text hover:bg-secondary-surface hover:text-primary-text',
    danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm border border-transparent',
    ghost: 'text-secondary-text hover:bg-secondary-surface hover:text-primary-text border border-transparent'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4.5 py-2.5 text-sm gap-2 rounded-xl',
    lg: 'px-6 py-3.5 text-base gap-2.5 rounded-2xl'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={disabled || isLoading ? {} : { y: -1, scale: 1.01 }}
      whileTap={disabled || isLoading ? {} : { y: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className={`w-4 h-4 ${size === 'lg' ? 'w-5 h-5' : ''}`} />
      ) : null}

      <span>{children}</span>

      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className={`w-4 h-4 ${size === 'lg' ? 'w-5 h-5' : ''}`} />
      )}
    </motion.button>
  );
}
