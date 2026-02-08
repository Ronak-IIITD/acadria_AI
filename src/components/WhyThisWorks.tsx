import type { FC } from 'react';
import ScrollReveal from './ScrollReveal';

const WhyThisWorks: FC = () => {
  const sciencePoints = [
    {
      step: '01',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Active Recall',
      description: 'Retrieve information from memory to strengthen neural pathways and boost retention. Our AI quiz generator creates questions that force your brain to work.',
      color: '#8B93D4'
    },
    {
      step: '02',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: 'Spaced Repetition',
      description: 'Review material at optimal intervals proven to maximize long-term retention. Flashcards resurface exactly when you need them.',
      color: '#35d0c3'
    },
    {
      step: '03',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Personalized Learning',
      description: 'AI adapts to your notes and learning style for focused, efficient study sessions. Every tool is built from YOUR material, not generic content.',
      color: '#9BC4BC'
    }
  ];

  return (
    <section id="why-it-works" className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <ScrollReveal animation="fade" delay={0.1}>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.1), rgba(139, 147, 212, 0.1))',
                   border: '1px solid rgba(53, 208, 195, 0.2)'
                 }}>
              <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                Learning Science
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5"
                style={{ 
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.2'
                }}>
              Why This{' '}
              <span style={{ 
                background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Actually Works
              </span>
            </h2>
            
            <p className="text-lg"
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: '1.7'
               }}>
              Built on proven cognitive science principles that help you learn faster and remember longer.
            </p>
          </div>
        </ScrollReveal>

        {/* Connected Flow Design */}
        <div className="relative">
          {/* Connecting Line - Desktop Only */}
          <div 
            className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2"
            style={{
              background: 'linear-gradient(90deg, rgba(139,147,212,0.2) 0%, rgba(53,208,195,0.3) 50%, rgba(155,196,188,0.2) 100%)'
            }}
          />

          {/* Science Points Grid with Offset */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {sciencePoints.map((point, index) => (
              <ScrollReveal 
                key={point.title} 
                animation="slide-up" 
                delay={0.1 + index * 0.15}
              >
                <div 
                  className="group relative"
                  style={{
                    marginTop: index === 1 ? '2rem' : index === 2 ? '4rem' : '0'
                  }}
                >
                  {/* Card with Deeper Glassmorphism */}
                  <div 
                    className="relative p-8 rounded-3xl transition-all duration-500"
                    style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(20px) saturate(150%)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.4)'
                    }}
                  >
                    {/* Step Number */}
                    <div 
                      className="absolute -top-4 left-8 px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: point.color,
                        color: '#fff',
                        boxShadow: `0 4px 12px ${point.color}40`
                      }}
                    >
                      {point.step}
                    </div>

                    {/* Icon */}
                    <div 
                      className="inline-flex p-3 rounded-2xl mb-5 mt-2 transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${point.color}15 0%, ${point.color}05 100%)`,
                        color: point.color,
                        boxShadow: `0 4px 16px ${point.color}20`
                      }}
                    >
                      {point.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-3"
                        style={{ color: 'var(--color-text-primary)' }}>
                      {point.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm leading-relaxed"
                       style={{ 
                         color: 'var(--color-text-secondary)',
                         lineHeight: '1.7'
                       }}>
                      {point.description}
                    </p>

                    {/* Connection Dot on Line (Desktop) */}
                    <div 
                      className="hidden md:block absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-4"
                      style={{
                        background: '#fff',
                        borderColor: point.color,
                        boxShadow: `0 0 0 4px rgba(255,255,255,0.5), 0 4px 12px ${point.color}40`
                      }}
                    />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyThisWorks;
