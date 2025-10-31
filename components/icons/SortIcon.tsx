import React from 'react';

const SortIcon: React.FC<{ className?: string; direction?: 'asc' | 'desc' }> = ({ className, direction = 'asc' }) => (
  <svg
    className={`${className} transition-transform duration-200 ${direction === 'desc' ? 'rotate-180' : ''}`}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.56l-1.72 1.72a.75.75 0 01-1.06-1.06l3-3a.75.75 0 011.06 0l3 3a.75.75 0 11-1.06 1.06l-1.72-1.72V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
  </svg>
);

export default SortIcon;