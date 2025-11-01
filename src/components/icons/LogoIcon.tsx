import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    
    {/* Main robot head - rounded square */}
    <rect 
      x="8" 
      y="12" 
      width="32" 
      height="28" 
      rx="6" 
      fill="url(#logoGradient)"
    />
    
    {/* Antenna */}
    <circle cx="24" cy="8" r="2.5" fill="currentColor" opacity="0.8" />
    <line x1="24" y1="10.5" x2="24" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    
    {/* Eyes */}
    <circle cx="18" cy="22" r="3" fill="white" />
    <circle cx="30" cy="22" r="3" fill="white" />
    <circle cx="18" cy="22" r="1.5" fill="#1E293B" />
    <circle cx="30" cy="22" r="1.5" fill="#1E293B" />
    
    {/* Book pages in the lower part */}
    <g opacity="0.95">
      {/* Left page */}
      <path 
        d="M 12 30 L 12 36 Q 12 37 13 37 L 23 37 L 23 30 Z" 
        fill="white"
      />
      {/* Right page */}
      <path 
        d="M 25 30 L 25 37 L 35 37 Q 36 37 36 36 L 36 30 Z" 
        fill="white"
      />
      {/* Center spine */}
      <line x1="24" y1="30" x2="24" y2="37" stroke="#3B82F6" strokeWidth="2" opacity="0.5" />
      
      {/* Text lines on pages */}
      <line x1="14" y1="32" x2="21" y2="32" stroke="#3B82F6" strokeWidth="1" opacity="0.3" />
      <line x1="14" y1="34.5" x2="21" y2="34.5" stroke="#3B82F6" strokeWidth="1" opacity="0.3" />
      <line x1="27" y1="32" x2="34" y2="32" stroke="#3B82F6" strokeWidth="1" opacity="0.3" />
      <line x1="27" y1="34.5" x2="34" y2="34.5" stroke="#3B82F6" strokeWidth="1" opacity="0.3" />
    </g>
    
    {/* AI Sparkle accent */}
    <path 
      d="M 38 16 L 39 18 L 41 19 L 39 20 L 38 22 L 37 20 L 35 19 L 37 18 Z" 
      fill="currentColor" 
      opacity="0.6"
    />
  </svg>
);

export default LogoIcon;