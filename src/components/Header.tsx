import { useState, useEffect, FC } from 'react';
import AIBookIcon from './icons/AIBookIcon';
import type { User } from '../types';

interface HeaderProps { 
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  isScrolled: boolean;
}

const Header: FC<HeaderProps> = ({ user, onLogout, onLoginClick, isScrolled }) => {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.3, // Section needs to be 30% visible
        rootMargin: '-100px 0px -50% 0px' // Adjust for header and better detection
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header
      className="header-translucent fixed top-3 left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 mx-auto"
      style={{
        width: 'calc(100% - 1.5rem)',
        maxWidth: '900px',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        backdropFilter: 'blur(24px) saturate(200%)',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.14),
          0 2px 8px rgba(0, 0, 0, 0.08),
          inset 0 1px 1px rgba(255, 255, 255, 0.25)
        `
      }}
    >
      <div className="w-full px-5 py-2.5">
        <div className="flex items-center justify-between w-full">
          {/* Logo Section */}
          <a 
            href="#home" 
            onClick={(e) => handleSmoothScroll(e, 'home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
              style={{ 
                background: 'rgba(53, 208, 195, 0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(53, 208, 195, 0.2)'
              }}
            >
              <AIBookIcon className="h-5.0 w-5.0" style={{ color: '#35d0c3' }} />
            </div>
            <h1 className="text-base brand-word font-semibold transition-opacity duration-200 group-hover:opacity-80" style={{ color: 'var(--color-text-primary)' }}>
              StudySync <span className="brand-ai">AI</span>
            </h1>
          </a>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <a 
              href="#home" 
              onClick={(e) => handleSmoothScroll(e, 'home')}
              className="relative text-sm font-medium transition-all duration-200 hover:opacity-80"
              style={{ color: activeSection === 'home' ? '#35d0c3' : 'var(--color-text-secondary)' }}
            >
              Home
              {activeSection === 'home' && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" 
                     style={{ background: 'linear-gradient(90deg, #35d0c3, #8b93d4)' }} />
              )}
            </a>
            <a 
              href="#features" 
              onClick={(e) => handleSmoothScroll(e, 'features')}
              className="relative text-sm font-medium transition-all duration-200 hover:opacity-80"
              style={{ color: (activeSection === 'features' || activeSection === 'why-it-works') ? '#35d0c3' : 'var(--color-text-secondary)' }}
            >
              Features
              {(activeSection === 'features' || activeSection === 'why-it-works') && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" 
                     style={{ background: 'linear-gradient(90deg, #35d0c3, #8b93d4)' }} />
              )}
            </a>
            <a 
              href="#about" 
              onClick={(e) => handleSmoothScroll(e, 'about')}
              className="relative text-sm font-medium transition-all duration-200 hover:opacity-80"
              style={{ color: (activeSection === 'about' || activeSection === 'testimonials') ? '#35d0c3' : 'var(--color-text-secondary)' }}
            >
              About
              {(activeSection === 'about' || activeSection === 'testimonials') && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" 
                     style={{ background: 'linear-gradient(90deg, #35d0c3, #8b93d4)' }} />
              )}
            </a>
          </nav>
          
          {/* Right Section - Auth */}
          <div className="flex items-center space-x-2.5">
            {user ? (
              <>
                <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  Welcome, {user.name}
                </span>
                <button onClick={onLogout} className="button-secondary text-xs px-3.5 py-1.5 rounded-xl">
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={onLoginClick} 
                className="text-sm px-5 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.85) 0%, rgba(139, 147, 212, 0.85) 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(53, 208, 195, 0.2)',
                }}
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;