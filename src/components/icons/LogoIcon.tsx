import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Chat bubble shape */}
    <path d="M17 3H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1l3 3 3-3h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path>
    {/* AI Spark inside */}
    <path d="m12 7-1 2-2 1 2 1 1 2 1-2 2-1-2-1z"></path>
  </svg>
);

export default LogoIcon;