import React from 'react';
import Features from './Features';
import Footer from './Footer';
import ProductIllustration from './ProductIllustration';
import Testimonials from './Testimonials';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative text-center pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="hero-headline text-5xl sm:text-6xl lg:text-7xl font-bold mb-8" style={{ letterSpacing: '-0.02em', lineHeight: '1.1' }}>
            Smarter Studying Starts Here.
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-normal leading-relaxed">
            Transform your study materials into interactive conversations. StudySync AI helps you learn faster and understand deeper.
          </p>
          <button 
            onClick={onGetStarted} 
            className="cta-magnetic mt-12 px-10 py-4 text-base font-medium text-white bg-gradient-to-br from-purple-400 to-blue-400 dark:from-purple-500 dark:to-blue-500 rounded-2xl shadow-md hover:from-purple-500 hover:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-300/50 dark:focus:ring-purple-500/30 transition-all duration-300 ease-in-out active:scale-98"
          >
            Get Started For Free
          </button>
        </div>
        
        <ProductIllustration />
        
        {/* Decorative background glow - Subtle */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/10 dark:bg-purple-500/10 rounded-full filter blur-3xl opacity-60"
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300/10 dark:bg-blue-500/10 rounded-full filter blur-3xl opacity-60"
        ></div>
      </section>

      <Features />

      <Testimonials />

      <Footer />
    </div>
  );
};

export default LandingPage;