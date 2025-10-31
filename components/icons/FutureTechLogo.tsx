import React from 'react';

const FutureTechLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="20" fontFamily="Verdana, sans-serif" fontSize="18" fontStyle="italic">
      FutureTech
    </text>
  </svg>
);

export default FutureTechLogo;
