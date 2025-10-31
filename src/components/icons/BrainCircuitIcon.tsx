import React from 'react';

const BrainCircuitIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M12 2a4.5 4.5 0 0 0-4.5 4.5v1.45a.5.5 0 0 1-.5.5H6a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1a.5.5 0 0 1 .5.5V17a4.5 4.5 0 1 0 9 0v-5.05a.5.5 0 0 1 .5-.5h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a.5.5 0 0 1-.5-.5V6.5A4.5 4.5 0 0 0 12 2Z" />
    <path d="M12 12v2.5" />
    <path d="M10 12a2 2 0 1 0 4 0" />
    <path d="M12 9.5V6.5" />
    <path d="M10 16a2 2 0 1 1 4 0" />
    <path d="M12 17v2.5" />
  </svg>
);

export default BrainCircuitIcon;