import type { FC } from 'react';
import ScrollReveal from './ScrollReveal';

const values = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Fast & Efficient',
    color: '#8B93D4'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Privacy First',
    color: '#35d0c3'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    title: 'Smart Learning',
    color: '#9BC4BC'
  }
];

const stats = [
  { value: '50K+', label: 'Students Helped' },
  { value: '1M+', label: 'Study Sessions' },
  { value: '4.9', label: 'Average Rating' },
  { value: '99%', label: 'Satisfaction' }
];

const About: FC = () => {
  return (
    <section id="about" className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        {/* Unified Narrative Card */}
        <ScrollReveal animation="fade" delay={0.1}>
          <div 
            className="relative p-10 sm:p-14 rounded-[2.5rem] text-center overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(20px) saturate(150%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" 
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.1), rgba(139, 147, 212, 0.1))',
                   border: '1px solid rgba(53, 208, 195, 0.2)'
                 }}>
              <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                About Us
              </span>
            </div>

            {/* Mission Statement - Typography Focused */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 leading-tight"
                style={{ 
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em'
                }}>
              We believe learning should be{' '}
              <span style={{ 
                background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                intuitive, engaging,
              </span>
              {' '}and accessible to everyone.
            </h2>
            
            <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-12"
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: '1.8'
               }}>
              Acadira AI was built by student, for students. We know the struggle of late-night cramming 
              and scattered notes. That's why we created a platform that transforms your study materials 
              into personalized learning experiences — making studying more efficient, effective, and 
              actually enjoyable.
            </p>

            {/* Values Strip with Connecting Lines */}
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 mb-12">
              {/* Connecting Line (Desktop) */}
              <div 
                className="hidden sm:block absolute top-1/2 left-1/4 right-1/4 h-px -translate-y-1/2"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(139,147,212,0.3) 20%, rgba(53,208,195,0.3) 50%, rgba(155,196,188,0.3) 80%, transparent 100%)'
                }}
              />

              {values.map((value, index) => (
                <div 
                  key={value.title}
                  className="group relative flex flex-col items-center gap-3 z-10"
                >
                  {/* Icon Container */}
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${value.color}15 0%, ${value.color}05 100%)`,
                      color: value.color,
                      boxShadow: `0 4px 16px ${value.color}20, inset 0 1px 1px rgba(255,255,255,0.5)`
                    }}
                  >
                    {value.icon}
                  </div>
                  
                  {/* Label */}
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {value.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Trust Indicators / Stats */}
            <div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t"
              style={{ borderColor: 'rgba(0,0,0,0.05)' }}
            >
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <div 
                    className="text-2xl sm:text-3xl font-bold mb-1"
                    style={{
                      background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default About;
