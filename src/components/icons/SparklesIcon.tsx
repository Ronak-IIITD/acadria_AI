import React from 'react';

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m12 3-1.5 3L7 7.5l3 1.5L11.5 12l1.5-3L16 7.5l-3-1.5z" />
    <path d="M5 11.5 3 12l2 1.5 1.5 3 1.5-3 2-1.5-2-1.5z" />
    <path d="M21 11.5 19 12l2 1.5 1.5 3 1.5-3 2-1.5-2-1.5z" />
  </svg>
);

export default SparklesIcon;