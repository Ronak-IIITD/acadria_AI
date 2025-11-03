import type { FC } from 'react';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import FileCheckIcon from './icons/FileCheckIcon';
import SparklesIcon from './icons/SparklesIcon';
import ScrollReveal from './ScrollReveal';

const features = [
  {
    icon: BrainCircuitIcon,
    title: 'Grounded Q&A',
    description: 'Ask anything about your material and receive responses that cite the passages your notes came from.',
    color: 'var(--color-accent-primary)',
    bgColor: 'var(--color-accent-primary-soft)'
  },
  {
    icon: FileCheckIcon,
    title: 'Thoughtful Imports',
    description: 'PDF, DOCX, TXT, and slides are parsed gently, keeping structure intact for accurate summaries.',
    color: 'var(--color-accent-secondary)',
    bgColor: 'var(--color-accent-secondary-soft)'
  },
  {
    icon: SparklesIcon,
    title: 'Study Modes in Sync',
    description: 'Flashcards, quizzes, and key takeaways all originate from the same calm workspace — no context switching.',
    color: 'var(--color-accent-lavender)',
    bgColor: 'var(--color-accent-lavender-soft)'
  },
];

const Features: FC = () => {
  return (
    <section id="features" className="relative py-20 sm:py-24 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fade" delay={0.1}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
                 style={{ 
                   backgroundColor: 'var(--color-accent-secondary-soft)',
                   border: '1px solid var(--color-border-light)'
                 }}>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Features
              </span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold mb-6"
                style={{ 
                  color: 'var(--color-text-primary)',
                  letterSpacing: 'var(--letter-spacing-tight)',
                  lineHeight: 'var(--line-height-tight)'
                }}>
              A Toolkit That Stays Out of the Spotlight
            </h2>
            
            <p className="text-lg sm:text-xl"
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: 'var(--line-height-relaxed)'
               }}>
              Each capability quietly supports comprehension so you can focus on understanding instead of configuring.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {features.map(({ icon: Icon, title, description, color, bgColor }, index) => (
            <ScrollReveal 
              key={title} 
              animation="slide-up" 
              delay={0.1 + index * 0.1}
            >
              <div 
                className="group relative p-8 rounded-3xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-surface-soft)',
                  border: '1px solid var(--color-border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  transitionDuration: 'var(--transition-base)'
                }}
              >
                {/* Icon */}
                <div 
                  className="inline-flex p-4 rounded-2xl mb-6 transition-transform group-hover:scale-110"
                  style={{ 
                    backgroundColor: bgColor,
                    color: color,
                    transitionDuration: 'var(--transition-base)'
                  }}
                >
                  <Icon className="h-7 w-7" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3"
                    style={{ color: 'var(--color-text-primary)' }}>
                  {title}
                </h3>
                
                <p className="text-base leading-relaxed"
                   style={{ 
                     color: 'var(--color-text-secondary)',
                     lineHeight: 'var(--line-height-relaxed)'
                   }}>
                  {description}
                </p>

                {/* Hover Effect Border */}
                <div 
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    border: '2px solid',
                    borderColor: color,
                    transitionDuration: 'var(--transition-base)'
                  }}
                ></div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;