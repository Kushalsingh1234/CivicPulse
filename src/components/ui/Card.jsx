import React from 'react';
import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hoverable = false,
  onClick,
  bg = 'bg-surface',
  padding = 'p-6 md:p-8',
  ...props
}) {
  const baseStyles = `rounded-2xl border border-borders ${bg} ${padding} overflow-hidden`;

  if (hoverable || onClick) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{
          y: -4,
          boxShadow: '0 12px 24px -10px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
          borderColor: 'rgba(15, 118, 110, 0.2)'
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`${baseStyles} shadow-sm cursor-pointer select-none ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} shadow-xs ${className}`} {...props}>
      {children}
    </div>
  );
}
