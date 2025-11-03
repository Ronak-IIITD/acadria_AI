import type { FC } from 'react';
import Features from './Features';
import Footer from './Footer';
import Testimonials from './Testimonials';
import ScrollReveal from './ScrollReveal';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section - Bold Gradient Design */}
      <section className="relative text-center pt-20 pb-24 sm:pt-32 sm:pb-32 lg:pt-40 lg:pb-40 overflow-hidden">
        {/* Full-width gradient background */}
        <div className="absolute inset-0"
             style={{
               background: 'linear-gradient(180deg, rgba(53, 208, 195, 0.08) 0%, rgba(139, 147, 212, 0.12) 50%, rgba(139, 147, 212, 0.08) 100%)'
             }}>
        </div>

        {/* Animated gradient overlay */}
        <div className="absolute inset-0 opacity-60"
             style={{
               background: `
                 radial-gradient(circle at 20% 30%, rgba(53, 208, 195, 0.25), transparent 50%),
                 radial-gradient(circle at 80% 70%, rgba(139, 147, 212, 0.25), transparent 50%),
                 radial-gradient(circle at 50% 50%, rgba(155, 196, 188, 0.15), transparent 60%)
               `,
               mixBlendMode: 'normal'
             }}>
        </div>

        {/* Sharp geometric shapes for depth */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-30 blur-2xl"
               style={{ background: 'linear-gradient(135deg, #35d0c3, #8b93d4)' }}></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-25 blur-3xl"
               style={{ background: 'linear-gradient(225deg, #8b93d4, #35d0c3)' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
               style={{ background: 'radial-gradient(circle, rgba(53, 208, 195, 0.3), rgba(139, 147, 212, 0.3))' }}></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          {/* Badge with stronger colors */}
          <ScrollReveal animation="fade" delay={0.1}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-10 shadow-lg" 
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.15), rgba(139, 147, 212, 0.15))',
                   border: '2px solid rgba(53, 208, 195, 0.4)',
                   backdropFilter: 'blur(10px)'
                 }}>
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" 
                   style={{ 
                     background: 'linear-gradient(135deg, #35d0c3, #8b93d4)',
                     boxShadow: '0 0 12px rgba(53, 208, 195, 0.6)'
                   }}></div>
              <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                AI-Powered Study Assistant
              </span>
            </div>
          </ScrollReveal>

          {/* Main Headline - Bolder and Sharper */}
          <ScrollReveal animation="slide-up" delay={0.2}>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-8"
                style={{ 
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.03em',
                  lineHeight: '1.1',
                  textShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
                }}>
              Study Smarter,
              <br />
              <span className="relative inline-block"
                    style={{ 
                      background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'brightness(1.1)',
                      textShadow: 'none'
                    }}>
                Not Harder
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-40"
                     style={{ background: 'linear-gradient(90deg, #35d0c3, #8b93d4)' }}></div>
              </span>
            </h1>
          </ScrollReveal>

          {/* Subtitle - More prominent */}
          <ScrollReveal animation="fade" delay={0.3}>
            <p className="mt-10 max-w-3xl mx-auto text-xl sm:text-2xl font-medium"
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: '1.6',
                 letterSpacing: '-0.01em'
               }}>
              Transform your study materials into interactive conversations. 
              Get intelligent, context-aware answers from your documents instantly.
            </p>
          </ScrollReveal>

          {/* CTA Buttons - More prominent */}
          <ScrollReveal animation="scale" delay={0.4}>
            <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-5">
            <button 
              onClick={onGetStarted} 
              className="group px-10 py-5 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-98"
              style={{
                background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
                color: '#FFFFFF',
                boxShadow: '0 10px 40px rgba(53, 208, 195, 0.35), 0 0 0 2px rgba(255, 255, 255, 0.2) inset',
                transitionDuration: '300ms'
              }}
            >
              <span className="flex items-center gap-3">
                Get Started Free
                <svg className="w-6 h-6 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            
            <button 
              className="px-10 py-5 text-lg font-semibold rounded-2xl transition-all hover:scale-105 active:scale-98 backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--color-text-primary)',
                border: '2px solid rgba(139, 147, 212, 0.3)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transitionDuration: '300ms'
              }}
            >
              Watch Demo
            </button>
          </div>
          </ScrollReveal>

          {/* Trust Indicators - More visible */}
          <ScrollReveal animation="fade" delay={0.5}>
            <div className="mt-20 flex flex-wrap items-center justify-center gap-10 text-base font-medium"
                 style={{ color: 'var(--color-text-secondary)' }}>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm"
                 style={{ background: 'rgba(143, 200, 157, 0.1)' }}>
              <svg className="w-6 h-6" style={{ color: '#35d0c3' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm"
                 style={{ background: 'rgba(143, 200, 157, 0.1)' }}>
              <svg className="w-6 h-6" style={{ color: '#35d0c3' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm"
                 style={{ background: 'rgba(143, 200, 157, 0.1)' }}>
              <svg className="w-6 h-6" style={{ color: '#35d0c3' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Privacy focused</span>
            </div>
          </div>
          </ScrollReveal>
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
             style={{
               background: 'linear-gradient(to top, var(--color-bg-primary), transparent)'
             }}></div>
      </section>

      {/* Features Section */}
      <ScrollReveal animation="fade" delay={0.1}>
        <Features />
      </ScrollReveal>

      {/* Testimonials Section */}
      <ScrollReveal animation="slide-up" delay={0.1}>
        <Testimonials />
      </ScrollReveal>

      {/* Footer Section */}
      <ScrollReveal animation="fade" delay={0.1}>
        <Footer />
      </ScrollReveal>
    </div>
  );
};

export default LandingPage;