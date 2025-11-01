import React from 'react';
import InnovateCorpLogo from './icons/InnovateCorpLogo';
import FutureTechLogo from './icons/FutureTechLogo';
import QuantumLeapLogo from './icons/QuantumLeapLogo';

const Footer: React.FC = () => {
  return (
    <footer className="mt-24 border-t" style={{ borderColor: 'var(--color-border-soft)' }}>
      <div className="section-shell py-12 text-center">
        <div className="space-y-8">
          <div>
            <span className="eyebrow">Trusted by teams that value focus</span>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-10 text-gray-500 dark:text-gray-400/70">
              <InnovateCorpLogo className="h-6" />
              <FutureTechLogo className="h-5" />
              <QuantumLeapLogo className="h-7" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} StudySync AI. Crafted for calm, focused learning.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;