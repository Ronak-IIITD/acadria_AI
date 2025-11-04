import type { FC } from 'react';
import ScrollReveal from './ScrollReveal';

const WhyThisWorks: FC = () => {
  const sciencePoints = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Active Recall',
      description: 'Retrieve information from memory to strengthen neural pathways and boost retention'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: 'Spaced Repetition',
      description: 'Review material at optimal intervals proven to maximize long-term retention'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Personalized Learning',
      description: 'AI adapts to your notes and learning style for focused, efficient study sessions'
    }
  ];

  return (
    <section id="why-it-works" className="relative py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <ScrollReveal animation="fade" delay={0.1}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.1), rgba(139, 147, 212, 0.1))',
                   border: '1px solid rgba(53, 208, 195, 0.2)'
                 }}>
              <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                Learning Science
              </span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold mb-6"
                style={{ 
                  color: 'var(--color-text-primary)',
                  letterSpacing: 'var(--letter-spacing-tight)',
                  lineHeight: 'var(--line-height-tight)'
                }}>
              Why This Actually Works
            </h2>
            
            <p className="text-lg sm:text-xl"
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: 'var(--line-height-relaxed)'
               }}>
              Built on proven cognitive science principles that help you learn faster and remember longer.
            </p>
          </div>
        </ScrollReveal>

        {/* Science Points Grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {sciencePoints.map((point, index) => (
            <ScrollReveal 
              key={point.title} 
              animation="slide-up" 
              delay={0.1 + index * 0.1}
            >
              <div 
                className="p-8 rounded-2xl transition-all duration-300 h-full flex flex-col"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(53, 208, 195, 0.2)',
                  backdropFilter: 'blur(10px)',
                  minHeight: '280px'
                }}
              >
                {/* Icon */}
                <div 
                  className="inline-flex p-3 rounded-xl mb-6"
                  style={{
                    background: 'rgba(53, 208, 195, 0.12)',
                    color: '#35d0c3',
                    width: 'fit-content'
                  }}
                >
                  {point.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3"
                    style={{ color: 'var(--color-text-primary)' }}>
                  {point.title}
                </h3>

                {/* Description */}
                <p className="text-base leading-relaxed"
                   style={{ color: 'var(--color-text-secondary)' }}>
                  {point.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyThisWorks;
