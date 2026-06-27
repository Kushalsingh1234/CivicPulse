import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export default function ProgressStepper({
  steps = [],
  currentStepIndex = 0,
  className = ''
}) {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Horizontal Stepper */}
      <div className="hidden md:flex items-center justify-between w-full relative">
        {/* Connecting progress lines */}
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-borders -z-10" />
        <div
          className="absolute top-5 left-8 right-8 h-0.5 bg-primary-accent origin-left -z-10 transition-all duration-500 ease-out"
          style={{
            transform: `scaleX(${steps.length > 1 ? currentStepIndex / (steps.length - 1) : 0})`
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const isUpcoming = idx > currentStepIndex;

          return (
            <div key={idx} className="flex flex-col items-center text-center px-4 flex-1">
              {/* Node Indicator */}
              <motion.div
                layout
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold text-sm transition-colors duration-300
                  ${isCompleted ? 'bg-primary-accent border-primary-accent text-white' : ''}
                  ${isActive ? 'bg-surface border-primary-accent text-primary-accent shadow-md shadow-primary-accent/10 ring-4 ring-primary-accent/10' : ''}
                  ${isUpcoming ? 'bg-surface border-borders text-muted-text' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </motion.div>

              {/* Title & Description */}
              <div className="mt-3">
                <p className={`text-xs font-semibold tracking-wide uppercase
                  ${isActive ? 'text-primary-accent' : ''}
                  ${isCompleted ? 'text-primary-text' : ''}
                  ${isUpcoming ? 'text-muted-text' : ''}
                `}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-[11px] text-secondary-text mt-0.5 max-w-[150px] mx-auto leading-tight">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="flex flex-col gap-4 md:hidden text-left pl-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const isUpcoming = idx > currentStepIndex;

          return (
            <div key={idx} className="flex gap-4 items-start relative">
              {/* Connect line for mobile */}
              {idx < steps.length - 1 && (
                <div className={`absolute left-4 top-10 bottom-[-16px] w-0.5 
                  ${isCompleted ? 'bg-primary-accent' : 'bg-borders'}
                `} />
              )}

              {/* Node */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold text-xs shrink-0 z-10
                ${isCompleted ? 'bg-primary-accent border-primary-accent text-white' : ''}
                ${isActive ? 'bg-surface border-primary-accent text-primary-accent ring-4 ring-primary-accent/10 shadow-xs' : ''}
                ${isUpcoming ? 'bg-surface border-borders text-muted-text' : ''}
              `}>
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Text */}
              <div className="pt-0.5">
                <h4 className={`text-sm font-bold tracking-wide uppercase
                  ${isActive ? 'text-primary-accent font-extrabold' : ''}
                  ${isCompleted ? 'text-primary-text' : ''}
                  ${isUpcoming ? 'text-muted-text font-normal' : ''}
                `}>
                  {step.title}
                </h4>
                {step.description && (
                  <p className="text-xs text-secondary-text mt-0.5 leading-normal">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
