import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import AIBookIcon from './icons/AIBookIcon';

interface ChatHeaderProps {
  onMenuClick: () => void;
  fileCount: number;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onMenuClick, 
  fileCount 
}) => {
  const handleLogoClick = async () => {
    if (window.confirm('Return to home? You will be logged out.')) {
      try {
        await signOut(auth);
        localStorage.removeItem('chatHistory');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  return (
    <div 
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{
        background: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border-light)'
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo - StudySync (Clickable to go home) */}
        <button 
          onClick={handleLogoClick}
          className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Return to home"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300"
            style={{ 
              background: 'rgba(53, 208, 195, 0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(53, 208, 195, 0.2)'
            }}
          >
            <AIBookIcon className="h-5 w-5" style={{ color: '#35d0c3' }} />
          </div>
          <span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            StudySync <span style={{
              background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>AI</span>
          </span>
        </button>
      </div>

      {/* File Count Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-secondary)'
      }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{fileCount} source{fileCount !== 1 ? 's' : ''} selected</span>
      </div>
    </div>
  );
};

export default ChatHeader;
