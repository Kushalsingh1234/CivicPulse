import React from 'react';

export default function PageHeader({
  title,
  description,
  actions,
  className = ''
}) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-borders/80 mb-8 md:mb-10 text-left ${className}`}>
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary-text mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-base md:text-lg text-secondary-text font-normal leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
