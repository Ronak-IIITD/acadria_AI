import { useState, useEffect, type FC } from 'react';
import AIBookIcon from './icons/AIBookIcon';

interface LandingHeaderProps {
  onGetStarted: () => void;
}

const LandingHeader: FC<LandingHeaderProps> = ({ onGetStarted }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        threshold: 0.3,
        rootMargin: '-100px 0px -50% 0px'
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

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'why-it-works', label: 'Why It Works' },
    { id: 'testimonials', label: 'Reviews' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
        isScrolled ? 'w-[95%] max-w-4xl' : 'w-[90%] max-w-3xl'
      }`}
      style={{
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(24px) saturate(200%)',
        background: isScrolled 
          ? 'rgba(255, 255, 255, 0.85)'
          : 'rgba(255, 255, 255, 0.6)',
        boxShadow: isScrolled
          ? '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
          : '0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
      }}
    >
      <div className="w-full px-6 py-3">
        <div className="flex items-center justify-between w-full">
          {/* Logo Section */}
          <a 
            href="#home" 
            onClick={(e) => handleSmoothScroll(e, 'home')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
              style={{ 
                background: 'rgba(53, 208, 195, 0.12)',
                border: '1px solid rgba(53, 208, 195, 0.2)'
              }}
            >
              <AIBookIcon className="h-5 w-5" style={{ color: '#35d0c3' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Acadira <span style={{ color: '#35d0c3' }}>AI</span>
            </span>
          </a>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleSmoothScroll(e, link.id)}
                className="relative px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg hover:bg-black/5"
                style={{ 
                  color: activeSection === link.id ? '#35d0c3' : 'var(--color-text-secondary)'
                }}
              >
                {link.label}
                {activeSection === link.id && (
                  <div 
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full" 
                    style={{ 
                      background: 'linear-gradient(90deg, #35d0c3, #8b93d4)',
                      width: '16px'
                    }} 
                  />
                )}
              </a>
            ))}
          </nav>
          
          {/* CTA Button */}
          <button
            onClick={onGetStarted}
            className="px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.9) 0%, rgba(139, 147, 212, 0.9) 100%)',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(53, 208, 195, 0.25)',
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
