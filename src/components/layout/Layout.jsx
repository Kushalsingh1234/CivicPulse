import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { Shield, Sparkles, Heart } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-primary-bg">
      {/* Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-borders py-12 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Branding & Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5 font-display font-extrabold text-lg text-primary-text">
                <Shield className="w-5 h-5 text-primary-accent" />
                <span>CivicPulse AI</span>
              </div>
              <p className="text-xs text-secondary-text mt-2 max-w-md">
                Next-generation smart city operations powered by intelligent civic AI. Built to empower citizens and optimize municipal operations.
              </p>
            </div>

            {/* Platform Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-secondary-text">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-secondary-accent animate-pulse" />
                AI-Prioritized Dispatch
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
                Community Verified
              </span>
              <span className="text-muted-text">
                © {new Date().getFullYear()} CivicPulse AI Operations.
              </span>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
