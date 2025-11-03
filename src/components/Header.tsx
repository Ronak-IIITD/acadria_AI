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
      className="fixed top-3 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out header-translucent"
      style={{
        width: 'calc(100% - 6rem)',
        maxWidth: '900px',
        borderRadius: '24px',
        border: '1.5px solid rgba(255, 255, 255, 0.18)',
        boxShadow: isScrolled 
          ? '0 8px 32px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.15) inset' 
          : '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(255, 255, 255, 0.15) inset',
        willChange: 'transform, box-shadow'
      }}
    >
      <div className="w-full px-5 py-2.5">
        <div className="flex items-center justify-between w-full">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300"
              style={{ 
                background: 'rgba(53, 208, 195, 0.12)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <AIBookIcon className="h-5.0 w-5.0" style={{ color: '#35d0c3' }} />
            </div>
            <h1 className="text-base brand-word font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              StudySync <span className="brand-ai">AI</span>
            </h1>
          </div>
          
          {/* Right Section - Theme Toggle and Auth */}
          <div className="flex items-center space-x-2.5">
            <ThemeToggle />
            {user ? (
              <>
                <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  Welcome, {user.name}
                </span>
                <button onClick={onLogout} className="button-secondary text-xs px-3.5 py-1.5 rounded-xl">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={onLoginClick} className="button-primary text-xs px-4 py-2 rounded-xl">
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