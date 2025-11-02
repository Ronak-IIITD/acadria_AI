import React from 'react';

type Props = {
  className?: string;
  title?: string;
  style?: React.CSSProperties;
};

/**
 * AI Avatar Icon - For chat messages with gradient
 * Uses blue-to-purple gradient
 */
const AIAvatarIcon: React.FC<Props> = ({ className, title = 'AI Assistant', style }) => {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      fill="none"
      stroke="url(#aiAvatarGradient)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="aiAvatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      {/* Open book - Left page */}
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      
      {/* Open book - Right page */}
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      
      {/* AI Circuit nodes */}
      <circle cx="6" cy="9" r="1.5" fill="url(#aiAvatarGradient)" stroke="none" />
      <circle cx="9" cy="12" r="1.2" fill="url(#aiAvatarGradient)" stroke="none" />
      <line x1="6.8" y1="10" x2="8.2" y2="11.2" strokeWidth="1" />
      
      <circle cx="18" cy="9" r="1.5" fill="url(#aiAvatarGradient)" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="url(#aiAvatarGradient)" stroke="none" />
      <line x1="17.2" y1="10" x2="15.8" y2="11.2" strokeWidth="1" />
    </svg>
  );
};

export default AIAvatarIcon;
