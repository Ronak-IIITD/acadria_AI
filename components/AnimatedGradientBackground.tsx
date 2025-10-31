import React from 'react';

const AnimatedGradientBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="animated-gradient-background">
      {children}
    </div>
  );
};

export default AnimatedGradientBackground;
