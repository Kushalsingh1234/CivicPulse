import React from 'react';

export default function Textarea({
  label,
  error,
  rows = 4,
  className = '',
  id,
  ...props
}) {
  return (
    <div className={`w-full text-left ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-secondary-text mb-1.5"
        >
          {label}
        </label>
      )}
      
      <div className="relative rounded-xl shadow-xs">
        <textarea
          id={id}
          rows={rows}
          className={`
            block w-full rounded-xl border border-borders bg-surface py-2.5 px-4
            text-primary-text placeholder-muted-text
            transition-all duration-150 resize-y
            focus:border-primary-accent focus:ring-3 focus:ring-primary-accent/10 focus:outline-none
            disabled:bg-secondary-surface disabled:text-muted-text disabled:cursor-not-allowed
            text-sm
            ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1.5 text-xs text-danger font-medium animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
