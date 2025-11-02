import type { FC } from 'react';
import LogoIcon from './icons/LogoIcon';

const Footer: FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'FAQ', href: '#faq' },
    ],
    company: [
      { name: 'About', href: '#about' },
      { name: 'Blog', href: '#blog' },
      { name: 'Careers', href: '#careers' },
    ],
    legal: [
      { name: 'Privacy', href: '#privacy' },
      { name: 'Terms', href: '#terms' },
      { name: 'Security', href: '#security' },
    ],
  };

  return (
    <footer className="relative mt-20 sm:mt-24 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--color-accent-primary-soft)', color: 'var(--color-accent-primary)' }}>
                <LogoIcon className="h-6 w-6" />
              </div>
              <span className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                StudySync AI
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6" 
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: 'var(--line-height-relaxed)'
               }}>
              Crafted for calm, focused learning.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {['twitter', 'github', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href={`#${social}`}
                  className="p-2 rounded-lg transition-all hover:scale-110"
                  style={{
                    backgroundColor: 'var(--color-surface-soft)',
                    border: '1px solid var(--color-border-light)',
                    color: 'var(--color-text-secondary)',
                    transitionDuration: 'var(--transition-fast)'
                  }}
                  aria-label={social}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
              ))}
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
                      className="text-sm transition-colors"
                      style={{ 
                        color: 'var(--color-text-secondary)',
                        transitionDuration: 'var(--transition-fast)'
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
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            © {currentYear} StudySync AI. All rights reserved.
          </p>
          
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <span>Made with</span>
            <svg className="w-4 h-4" style={{ color: 'var(--color-error)' }} fill="currentColor" viewBox="0 0 20 20">
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