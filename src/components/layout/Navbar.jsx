import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Cpu, Rss, Layers } from 'lucide-react';
import Logo from '../ui/Logo';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'AI Analyzer', path: '/analyzer', icon: Cpu },
    { name: 'Community Feed', path: '/feed', icon: Rss },
    { name: 'Operations Center', path: '/operations', icon: Layers }
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-surface/85 backdrop-blur-md border-b border-borders/85 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <NavLink to="/" className="shrink-0 flex items-center">
            <Logo />
          </NavLink>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    relative px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-150 flex items-center gap-2
                    ${isActive
                      ? 'text-primary-accent bg-primary-accent/5'
                      : 'text-secondary-text hover:text-primary-text hover:bg-secondary-surface/80'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>

                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-[-17px] left-4 right-4 h-0.5 bg-primary-accent rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-xl text-secondary-text hover:text-primary-text hover:bg-secondary-surface focus:outline-none cursor-pointer"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Framer Motion) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden border-b border-borders bg-surface"
            id="mobile-menu"
          >
            <div className="px-4 pt-2 pb-6 space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-150
                      ${isActive
                        ? 'bg-primary-accent/8 text-primary-accent'
                        : 'text-secondary-text hover:bg-secondary-surface hover:text-primary-text'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
