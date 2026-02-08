import type { FC } from 'react';
import ScrollReveal from './ScrollReveal';

const testimonialsData = [
  {
    quote:
      "Turned my 200-page lecture notes into flashcards in under 5 minutes. Revision before finals was actually manageable for the first time.",
    name: 'Priya Sharma',
    title: 'Computer Science, IIT Delhi',
    initials: 'PS',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    rotation: -1
  },
  {
    quote:
      'Asked 50+ questions from my uploaded PDFs while studying for CA exams. Every answer cited the exact page. No more hunting through notes.',
    name: 'Arjun Mehta',
    title: 'Commerce Student, University of Delhi',
    initials: 'AM',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    rotation: 0
  },
  {
    quote:
      'Generated practice quizzes from my organic chemistry notes. Scored 15% higher after using this for two weeks. Retention is actually sticking now.',
    name: 'Sneha Reddy',
    title: 'Medical Student, AIIMS',
    initials: 'SR',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    rotation: 1
  },
];

const Testimonials: FC = () => {
  return (
    <section id="testimonials" className="relative py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <ScrollReveal animation="fade" delay={0.1}>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.1), rgba(139, 147, 212, 0.1))',
                   border: '1px solid rgba(53, 208, 195, 0.2)'
                 }}>
              <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                Testimonials
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5"
                style={{ 
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.2'
                }}>
              Real Students,{' '}
              <span style={{ 
                background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Real Results
              </span>
            </h2>
            
            <p className="text-lg"
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: '1.7'
               }}>
              See how students across IITs, NITs, and AIIMS are using AI to study smarter.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {testimonialsData.map(({ quote, name, title, initials, gradient, rotation }, index) => (
            <ScrollReveal 
              key={name} 
              animation="slide-up" 
              delay={0.1 + index * 0.1}
              className="flex"
            >
              <article 
                className="group relative flex flex-col w-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'rotate(0deg) translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotate(${rotation}deg)`;
                }}
              >
                {/* Card */}
                <div 
                  className="relative p-8 rounded-3xl flex flex-col w-full h-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.5)'
                  }}
                >
                  {/* Header with Stars and Avatar */}
                  <div className="flex items-center justify-between mb-6">
                    {/* Star Rating */}
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i}
                          className="w-4 h-4" 
                          style={{ color: '#fbbf24' }}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Avatar */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg"
                      style={{ 
                        background: gradient,
                        boxShadow: `0 4px 12px ${gradient.includes('667eea') ? 'rgba(102, 126, 234, 0.4)' : gradient.includes('f093fb') ? 'rgba(240, 147, 251, 0.4)' : 'rgba(79, 172, 254, 0.4)'}`
                      }}
                    >
                      {initials}
                    </div>
                  </div>

                  {/* Large Quote Mark */}
                  <div 
                    className="text-6xl font-serif leading-none mb-2 opacity-20"
                    style={{ 
                      background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    "
                  </div>

                  {/* Quote */}
                  <p className="text-sm leading-relaxed flex-grow mb-6"
                     style={{ 
                       color: 'var(--color-text-secondary)',
                       lineHeight: '1.8'
                     }}>
                    {quote}
                  </p>

                  {/* Author Info */}
                  <div className="pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {title}
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
