import React from 'react';
import { NavLink } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Icon Emblem */}
      <div className="w-16 h-16 rounded-2xl bg-danger/8 border border-danger/15 flex items-center justify-center text-danger mb-6 animate-pulse">
        <AlertCircle className="w-8 h-8" />
      </div>

      {/* Page Title */}
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary-text mb-4">
        Page Not Found
      </h1>

      {/* Description */}
      <p className="text-secondary-text max-w-md mb-8 leading-relaxed">
        The page you are looking for doesn't exist or has been moved to a new municipal sector.
      </p>

      {/* Action */}
      <NavLink to="/">
        <Button variant="primary" size="lg" icon={Home} iconPosition="left">
          Return to Dashboard
        </Button>
      </NavLink>
    </div>
  );
}
