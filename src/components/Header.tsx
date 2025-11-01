import React from 'react';
import LogoIcon from './icons/LogoIcon';
import type { User } from '../types';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  isScrolled: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onLoginClick, isScrolled }) => {
  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'backdrop-blur-xl' : 'backdrop-blur-0'
      }`}
    >
      <div className={`mx-auto max-w-6xl px-6 sm:px-8 lg:px-10 ${isScrolled ? 'py-3' : 'py-6'}`}>
        <div
          className={`flex items-center justify-between rounded-2xl border transition-all duration-300 ${
            isScrolled
              ? 'border-transparent bg-white/75 shadow-sm dark:bg-slate-900/70'
              : 'border-transparent bg-transparent'
          }`}
          style={{ borderColor: isScrolled ? 'var(--color-border-soft)' : 'transparent' }}
        >
          <div className="flex items-center justify-between w-full px-4 py-3">
          <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'var(--color-accent-primary-soft)' }}
                >
                  <LogoIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </div>
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100" style={{ letterSpacing: '-0.02em' }}>
                  StudySync AI
                </h1>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <ThemeToggle />
                {user ? (
                  <>
                    <span className="hidden sm:block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Welcome, {user.name}
                    </span>
                    <button onClick={onLogout} className="button-secondary text-sm">
                      Logout
                    </button>
                  </>
                ) : (
                  <button onClick={onLoginClick} className="button-primary text-sm">
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;