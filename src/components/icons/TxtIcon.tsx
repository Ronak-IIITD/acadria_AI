import React from 'react';

const TxtIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="txtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6b7280" />
        <stop offset="100%" stopColor="#4b5563" />
      </linearGradient>
    </defs>
    <path
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
      fill="url(#txtGradient)"
    />
    <path d="M14 2V8H20" fill="#9ca3af" fillOpacity="0.5" />
    <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">
      TXT
    </text>
  </svg>
);

export default TxtIcon;
