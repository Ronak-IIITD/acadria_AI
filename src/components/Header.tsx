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
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'pt-3' : 'pt-6'}`}>
       <div className={`container mx-auto px-6 sm:px-8 lg:px-10 max-w-6xl transition-all duration-300 
         ${isScrolled 
            ? 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-2xl border border-gray-200/50 dark:border-gray-700/30 shadow-sm' 
            : 'bg-transparent backdrop-blur-none rounded-2xl border-transparent'
         }`}
       >
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-purple-100/50 to-blue-100/50 dark:from-purple-900/20 dark:to-blue-900/20">
              <LogoIcon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100" style={{ letterSpacing: '-0.02em' }}>
              StudySync AI
            </h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <ThemeToggle />
            {user ? (
              <>
                <span className="hidden sm:block text-gray-600 dark:text-gray-400 text-sm font-medium">Welcome, {user.name}</span>
                <button
                  onClick={onLogout}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-purple-400 to-blue-400 dark:from-purple-500 dark:to-blue-500 rounded-xl shadow-sm hover:from-purple-500 hover:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-300/50 dark:focus:ring-purple-500/30 transition-all duration-300 transform hover:scale-102 active:scale-98"
                >
                  Logout
                </button>
              </>
            ) : (
               <button
                  onClick={onLoginClick}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-purple-400 to-blue-400 dark:from-purple-500 dark:to-blue-500 rounded-xl shadow-sm hover:from-purple-500 hover:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-300/50 dark:focus:ring-purple-500/30 transition-all duration-300 transform hover:scale-102 active:scale-98"
                >
                  Sign In
                </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;