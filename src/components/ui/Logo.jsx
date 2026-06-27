import React from 'react';

export default function Logo({ className = "h-8", showText = true }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem SVG */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8 flex-shrink-0"
      >
        {/* Outer Circular Shield (Representing Civic/Public Safety) */}
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-primary-accent opacity-20"
        />
        {/* Core Architectural Dome Arc */}
        <path
          d="M6 16C6 10.4772 10.4772 6 16 6C21.5228 6 26 10.4772 26 16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-primary-accent"
        />
        {/* Pulse waveform inside the dome representing AI analysis */}
        <path
          d="M8 17H11.5L13.5 11L16.5 21L18.5 14L20.5 17H24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-secondary-accent animate-pulse"
        />
      </svg>

      {showText && (
        <span className="font-display font-bold text-xl tracking-tight text-primary-text flex items-center">
          Civic<span className="text-primary-accent">Pulse</span>
          <span className="ml-1 text-[10px] uppercase font-bold tracking-widest text-secondary-accent px-1.5 py-0.5 bg-secondary-surface rounded-md border border-borders">
            AI
          </span>
        </span>
      )}
    </div>
  );
}
