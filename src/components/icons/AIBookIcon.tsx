import React from 'react';

type Props = {
  className?: string;
  title?: string;
  style?: React.CSSProperties;
};

/**
 * AI Book Icon - Clean and modern design
 * Simple open book with AI circuit nodes
 */
const AIBookIcon: React.FC<Props> = ({ className, title = 'AI Learning', style }) => {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Open book - Left page */}
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      
      {/* Open book - Right page */}
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      
      {/* AI Circuit nodes */}
      <circle cx="6" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <line x1="6.8" y1="10" x2="8.2" y2="11.2" strokeWidth="1" />
      
      <circle cx="18" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <line x1="17.2" y1="10" x2="15.8" y2="11.2" strokeWidth="1" />
    </svg>
  );
};

export default AIBookIcon;
