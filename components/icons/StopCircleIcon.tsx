import React from 'react';

const StopCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V9z" clipRule="evenodd" />
  </svg>
);

export default StopCircleIcon;
