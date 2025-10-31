import React from 'react';

const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    aria-hidden="true"
  >
    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
    <path d="M5.5 10.5a.5.5 0 01.5-.5h8a.5.5 0 010 1h-8a.5.5 0 01-.5-.5z" />
    <path d="M5 10a4 4 0 004 4v3.5a.5.5 0 00.5.5h1a.5.5 0 00.5-.5V14a4 4 0 004-4h-1.5a.5.5 0 010-1H15a5 5 0 01-5 5V9a5 5 0 01-5-5H3a.5.5 0 010-1H5z" />
  </svg>
);

export default MicrophoneIcon;
