import React from 'react';
import InnovateCorpLogo from './icons/InnovateCorpLogo';
import FutureTechLogo from './icons/FutureTechLogo';
import QuantumLeapLogo from './icons/QuantumLeapLogo';

const Footer: React.FC = () => {
  return (
    <footer className="text-center py-12 mt-20 border-t border-white/10">
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400/80 uppercase tracking-wider mb-4">
          Trusted By The Best
        </h4>
        <div className="flex justify-center items-center space-x-8 text-gray-500 dark:text-gray-400/60">
          <InnovateCorpLogo className="h-6" />
          <FutureTechLogo className="h-5" />
          <QuantumLeapLogo className="h-7" />
        </div>
      </div>
      <p className="text-gray-800 dark:text-gray-300/70 text-sm">&copy; {new Date().getFullYear()} StudySync AI. All rights reserved.</p>
    </footer>
  );
};

export default Footer;