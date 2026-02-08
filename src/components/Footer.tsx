import type { FC } from 'react';
import AIBookIcon from './icons/AIBookIcon';

interface FooterProps {
  onAdminLogin?: () => void;
}

const Footer: FC<FooterProps> = ({ onAdminLogin }) => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'FAQ', href: '#faq' },
    ],
    company: [
      { name: 'About', href: '#about' },
      { name: 'Contact', href: '#contact' },
      { name: 'Blog', href: '#blog' },
    ],
    legal: [
      { name: 'Privacy', href: '#privacy' },
      { name: 'Terms', href: '#terms' },
    ],
  };

  return (
    <footer className="relative mt-20 sm:mt-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4 ml-1">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300"
                style={{
                  background: 'rgba(53, 208, 195, 0.12)',
                  color: '#35d0c3'
                }}
              >
                <AIBookIcon className="h-6 w-6" />
              </div>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Acadira AI
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6 ml-1" 
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: '1.6'
               }}>
              Built for students by students. Focus first. AI that helps you learn deeply.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4 ml-1">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg transition-all hover:scale-110 hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-surface-soft)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-text-primary)',
                  transitionDuration: '200ms'
                }}
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg transition-all hover:scale-110 hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-surface-soft)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-text-primary)',
                  transitionDuration: '200ms'
                }}
                aria-label="Discord"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg transition-all hover:scale-110 hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-surface-soft)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-text-primary)',
                  transitionDuration: '200ms'
                }}
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-4 capitalize" 
                  style={{ color: 'var(--color-text-primary)' }}>
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors hover:opacity-70"
                      style={{ 
                        color: 'var(--color-text-secondary)',
                        transitionDuration: '200ms'
                      }}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4"
             style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              © {currentYear} Acadira AI. All rights reserved.
            </p>
            {onAdminLogin && (
              <button
                onClick={onAdminLogin}
                className="text-xs font-medium opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-text-tertiary)' }}
                aria-label="Admin Access"
              >
                Admin
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <span>Crafted with</span>
            <svg className="w-4 h-4" style={{ color: '#ef4444' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>for focused learners</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;