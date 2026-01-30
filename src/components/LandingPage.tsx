import type { FC } from 'react';
import Features from './Features';
import Footer from './Footer';
import Testimonials from './Testimonials';
import About from './About';
import WhyThisWorks from './WhyThisWorks';
import ScrollReveal from './ScrollReveal';

interface LandingPageProps {
  onGetStarted: () => void;
  onAdminLogin: () => void;
}

const LandingPage: FC<LandingPageProps> = ({ onGetStarted, onAdminLogin }) => {
  return (
    <div className="animate-fade-in relative">
      {/* Full Page Gradient Background */}
      <div className="fixed inset-0 -z-10"
           style={{
             background: 'linear-gradient(180deg, rgba(53, 208, 195, 0.08) 0%, rgba(139, 147, 212, 0.12) 50%, rgba(139, 147, 212, 0.08) 100%)'
           }}>
      </div>

      {/* Animated gradient overlay */}
      <div className="fixed inset-0 -z-10 opacity-60"
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
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-30 blur-2xl"
             style={{ background: 'linear-gradient(135deg, #35d0c3, #8b93d4)' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-25 blur-3xl"
             style={{ background: 'linear-gradient(225deg, #8b93d4, #35d0c3)' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(53, 208, 195, 0.3), rgba(139, 147, 212, 0.3))' }}></div>
      </div>

      {/* Hero Section - Bold Gradient Design */}
      <section id="home" className="relative text-center pt-20 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32 overflow-hidden">

        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          {/* Badge with stronger colors */}
          <ScrollReveal animation="fade" delay={0.1}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10 shadow-lg" 
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.15), rgba(139, 147, 212, 0.15))',
                   border: '1.5px solid rgba(53, 208, 195, 0.4)',
                   backdropFilter: 'blur(10px)'
                 }}>
              <div className="w-2 h-2 rounded-full animate-pulse" 
                   style={{ 
                     background: 'linear-gradient(135deg, #35d0c3, #8b93d4)',
                     boxShadow: '0 0 12px rgba(53, 208, 195, 0.6)'
                   }}></div>
              <span className="text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                AI-Powered Study Assistant
              </span>
            </div>
          </ScrollReveal>

          {/* Main Headline - Bolder and Sharper */}
          <ScrollReveal animation="slide-up" delay={0.2}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-8 animate-fade-in-up"
                style={{ 
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.03em',
                  lineHeight: '1.1',
                  textShadow: '0 2px 20px rgba(0, 0, 0, 0.05)',
                  animationDelay: '0.1s'
                }}>
              The AI Study Assistant
              <br />
              <span className="relative inline-block group"
                    style={{ 
                      background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'brightness(1.1)',
                                          textShadow: 'none'
                    }}>
                Built for Learners
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-40 transition-all duration-500 group-hover:opacity-100 group-hover:h-1.5"
                     style={{ background: 'linear-gradient(90deg, #35d0c3, #8b93d4)' }}></div>
              </span>
            </h1>
          </ScrollReveal>

          {/* Subtitle - More prominent */}
          <ScrollReveal animation="fade" delay={0.3}>
            <p className="mt-10 max-w-xl mx-auto text-lg sm:text-xl font-medium animate-fade-in-up"
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: '1.6',
                 letterSpacing: '-0.01em',
                 animationDelay: '0.2s'
               }}>
              Transform your lecture notes into personalized study tools—flashcards, quizzes, and an AI tutor that knows your material.
            </p>
          </ScrollReveal>

          {/* CTA Buttons - More prominent */}
          <ScrollReveal animation="scale" delay={0.4}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5">
            <button 
              onClick={onGetStarted} 
              className="group px-10 py-5 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 active:scale-98"
              style={{
                background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
                color: '#FFFFFF',
                boxShadow: '0 12px 48px rgba(53, 208, 195, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.2) inset',
                transitionDuration: '300ms'
              }}
            >
              <span className="flex items-center gap-3">
                Start Learning Free
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            
            <button 
              className="px-10 py-5 text-lg font-semibold rounded-2xl transition-all hover:scale-105 active:scale-98 backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: 'var(--color-text-primary)',
                border: '2px solid rgba(139, 147, 212, 0.3)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transitionDuration: '300ms'
              }}
            >
              Watch Demo
            </button>
          </div>
          
          {/* Trust text below CTA */}
          <p className="mt-6 text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
            Free to start. Built for Learners
          </p>
          </ScrollReveal>
          
          {/* Trust metrics strip */}
          <ScrollReveal animation="fade" delay={0.5}>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" style={{ color: '#35d0c3' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  4.9+ Student Rating
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" style={{ color: '#35d0c3' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  10,000+ Study Sessions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" style={{ color: '#35d0c3' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Loved by Learners
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Section */}
      <ScrollReveal animation="fade" delay={0.1}>
        <Features />
      </ScrollReveal>

      {/* Why This Works Section */}
      <ScrollReveal animation="fade" delay={0.1}>
        <WhyThisWorks />
      </ScrollReveal>

      {/* Testimonials Section */}
      <ScrollReveal animation="slide-up" delay={0.1}>
        <Testimonials />
      </ScrollReveal>

      {/* About Section */}
      <ScrollReveal animation="fade" delay={0.1}>
        <About />
      </ScrollReveal>

      {/* Footer Section */}
      <ScrollReveal animation="fade" delay={0.1}>
        <Footer onAdminLogin={onAdminLogin} />
      </ScrollReveal>
    </div>
  );
};

export default LandingPage;