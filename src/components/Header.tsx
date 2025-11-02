import React from 'react';
import AIBookIcon from './icons/AIBookIcon';
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
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: 'var(--color-bg-primary)',
        borderBottom: '2px solid var(--color-border-medium)'
      }}
    >
      <div className="w-full px-6 py-2.5">
        <div className="flex items-center justify-between w-full">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
              style={{ 
                background: 'rgba(53, 208, 195, 0.15)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <AIBookIcon className="h-5 w-5" style={{ color: '#35d0c3' }} />
            </div>
            <h1 className="text-base brand-word" style={{ color: 'var(--color-text-primary)' }}>
              StudySync <span className="brand-ai">AI</span>
            </h1>
          </div>
          
          {/* Right Section - Theme Toggle and Auth */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {user ? (
              <>
                <span className="hidden sm:block text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  Welcome, {user.name}
                </span>
                <button onClick={onLogout} className="button-secondary text-sm px-4 py-2">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={onLoginClick} className="button-primary text-sm px-4 py-2">
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;