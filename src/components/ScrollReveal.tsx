import React, { ReactNode } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface ScrollRevealProps {
  children: ReactNode;
  animation?: 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'zoom' | 'scale';
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  rootMargin = '0px 0px -100px 0px',
  triggerOnce = true,
  className = ''
}) => {
  const { ref, isVisible } = useScrollReveal({ threshold, rootMargin, triggerOnce });

  const getAnimationStyle = () => {
    const baseStyle: React.CSSProperties = {
      transition: `all ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
      transitionDelay: `${delay}s`,
    };

    if (!isVisible) {
      switch (animation) {
        case 'fade':
          return { ...baseStyle, opacity: 0 };
        case 'slide-up':
          return { ...baseStyle, opacity: 0, transform: 'translateY(60px)' };
        case 'slide-left':
          return { ...baseStyle, opacity: 0, transform: 'translateX(60px)' };
        case 'slide-right':
          return { ...baseStyle, opacity: 0, transform: 'translateX(-60px)' };
        case 'zoom':
          return { ...baseStyle, opacity: 0, transform: 'scale(0.8)' };
        case 'scale':
          return { ...baseStyle, opacity: 0, transform: 'scale(0.95)' };
        default:
          return { ...baseStyle, opacity: 0 };
      }
    }

    return {
      ...baseStyle,
      opacity: 1,
      transform: 'translateY(0) translateX(0) scale(1)',
    };
  };

  return (
    <div ref={ref as any} style={getAnimationStyle()} className={className}>
      {children}
    </div>
  );
};

export default ScrollReveal;
