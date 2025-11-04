import type { FC } from 'react';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import FileCheckIcon from './icons/FileCheckIcon';
import SparklesIcon from './icons/SparklesIcon';
import ScrollReveal from './ScrollReveal';

const features = [
  {
    icon: BrainCircuitIcon,
    title: 'Ask Questions, Get Personal Answers',
    description: 'Chat with an AI tutor trained on YOUR notes. Every answer cites the exact passage from your material — no hallucinations, no internet noise.',
    color: 'var(--color-accent-primary)',
    bgColor: 'var(--color-accent-primary-soft)'
  },
  {
    icon: SparklesIcon,
    title: 'Auto-Generate Quizzes & Flashcards',
    description: 'Upload your PDFs, handwritten notes, or slides and instantly get custom study materials. Flashcards, quizzes, and summaries — all from YOUR content.',
    color: 'var(--color-accent-lavender)',
    bgColor: 'var(--color-accent-lavender-soft)'
  },
  {
    icon: FileCheckIcon,
    title: 'Upload Any Format, We Handle It',
    description: 'PDFs, DOCX, TXT, images, and slides — all formats supported. AI preserves structure and meaning for accurate study tools.',
    color: 'var(--color-accent-secondary)',
    bgColor: 'var(--color-accent-secondary-soft)'
  },
];

const Features: FC = () => {
  return (
    <section id="features" className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fade" delay={0.1}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.1), rgba(139, 147, 212, 0.1))',
                   border: '1px solid rgba(53, 208, 195, 0.2)'
                 }}>
              <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                Features
              </span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold mb-6"
                style={{ 
                  color: 'var(--color-text-primary)',
                  letterSpacing: 'var(--letter-spacing-tight)',
                  lineHeight: 'var(--line-height-tight)'
                }}>
              Everything You Need to Study Smarter
            </h2>
            
            <p className="text-lg sm:text-xl"
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: 'var(--line-height-relaxed)'
               }}>
              Upload your materials once. Get flashcards, quizzes, summaries, and an AI tutor — all personalized to what you're learning.
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
                className="group relative p-8 rounded-3xl h-full flex flex-col"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid var(--color-border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  transform: 'translateZ(0)',
                  transition: 'all 0.3s ease-out',
                  minHeight: '320px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateZ(20px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateZ(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {/* Icon */}
                <div 
                  className="inline-flex p-3 rounded-xl mb-6 transition-transform group-hover:scale-110"
                  style={{ 
                    backgroundColor: bgColor,
                    color: color,
                    transitionDuration: 'var(--transition-base)',
                    width: 'fit-content'
                  }}
                >
                  <Icon className="h-5 w-5" />
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