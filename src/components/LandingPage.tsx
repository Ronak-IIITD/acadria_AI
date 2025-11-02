import type { FC } from 'react';
import Features from './Features';
import Footer from './Footer';
import Testimonials from './Testimonials';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section - Modern & Spacious */}
      <section className="relative text-center pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" 
               style={{ 
                 backgroundColor: 'var(--color-accent-primary-soft)',
                 border: '1px solid var(--color-border-light)'
               }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-accent-primary)' }}></div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              AI-Powered Study Assistant
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
              style={{ 
                color: 'var(--color-text-primary)',
                letterSpacing: 'var(--letter-spacing-tight)',
                lineHeight: 'var(--line-height-tight)'
              }}>
            Study Smarter,
            <br />
            <span style={{ 
              background: 'linear-gradient(135deg, var(--brand-grad-start), var(--brand-grad-end))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Not Harder
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl font-normal"
             style={{ 
               color: 'var(--color-text-secondary)',
               lineHeight: 'var(--line-height-relaxed)'
             }}>
            Transform your study materials into interactive conversations. 
            Get intelligent, context-aware answers from your documents instantly.
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onGetStarted} 
              className="group px-8 py-4 text-base font-medium rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-98"
              style={{
                background: 'linear-gradient(135deg, var(--brand-grad-start), var(--brand-grad-end))',
                color: 'var(--color-text-inverse)',
                transitionDuration: 'var(--transition-base)'
              }}
            >
              <span className="flex items-center gap-2">
                Get Started Free
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            
            <button 
              className="px-8 py-4 text-base font-medium rounded-2xl transition-all hover:scale-105 active:scale-98"
              style={{
                backgroundColor: 'var(--color-surface-soft)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-light)',
                transitionDuration: 'var(--transition-base)'
              }}
            >
              Watch Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm"
               style={{ color: 'var(--color-text-muted)' }}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: 'var(--color-success)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: 'var(--color-success)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: 'var(--color-success)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Privacy focused</span>
            </div>
          </div>
        </div>

        {/* Subtle Background Decorations */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full filter blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: 'var(--brand-grad-start)' }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full filter blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: 'var(--brand-grad-end)' }}
        ></div>
      </section>

      {/* Features Section */}
      <Features />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;