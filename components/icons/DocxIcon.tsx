import React from 'react';

const DocxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="docxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    <path
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
      fill="url(#docxGradient)"
    />
    <path d="M14 2V8H20" fill="#60a5fa" fillOpacity="0.5" />
    <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" fontSize="6" fontWeight="bold" fill="white" letterSpacing="-0.5">
      DOCX
    </text>
  </svg>
);

export default DocxIcon;
