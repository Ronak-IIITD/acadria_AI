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
    color: '#8B93D4',
    bgGradient: 'linear-gradient(135deg, rgba(139, 147, 212, 0.15) 0%, rgba(139, 147, 212, 0.05) 100%)'
  },
  {
    icon: SparklesIcon,
    title: 'Auto-Generate Quizzes & Flashcards',
    description: 'Upload your PDFs, handwritten notes, or slides and instantly get custom study materials. Flashcards, quizzes, and summaries — all from YOUR content.',
    color: '#35d0c3',
    bgGradient: 'linear-gradient(135deg, rgba(53, 208, 195, 0.15) 0%, rgba(53, 208, 195, 0.05) 100%)'
  },
  {
    icon: FileCheckIcon,
    title: 'Upload Any Format, We Handle It',
    description: 'PDFs, DOCX, TXT, images, and slides — all formats supported. AI preserves structure and meaning for accurate study tools.',
    color: '#9BC4BC',
    bgGradient: 'linear-gradient(135deg, rgba(155, 196, 188, 0.15) 0%, rgba(155, 196, 188, 0.05) 100%)'
  },
];

const Features: FC = () => {
  return (
    <section id="features" className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fade" delay={0.1}>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.1), rgba(139, 147, 212, 0.1))',
                   border: '1px solid rgba(53, 208, 195, 0.2)'
                 }}>
              <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                Features
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5"
                style={{ 
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.2'
                }}>
              Everything You Need to{' '}
              <span style={{ 
                background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Study Smarter
              </span>
            </h2>
            
            <p className="text-lg"
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: '1.7'
               }}>
              Upload your materials once. Get flashcards, quizzes, summaries, and an AI tutor — all personalized to what you're learning.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature Cards Grid - Clean Minimal Design */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map(({ icon: Icon, title, description, color, bgGradient }, index) => (
            <ScrollReveal 
              key={title} 
              animation="slide-up" 
              delay={0.1 + index * 0.1}
            >
              <div 
                className="group relative h-full"
                style={{
                  transform: 'translateY(0)',
                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Card */}
                <div 
                  className="relative p-8 rounded-3xl h-full flex flex-col"
                  style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '280px'
                  }}
                >
                  {/* Floating Icon Container */}
                  <div 
                    className="relative mb-6"
                    style={{ width: 'fit-content' }}
                  >
                    {/* Icon Glow Effect */}
                    <div 
                      className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                      style={{ 
                        background: color,
                        transform: 'scale(1.5)'
                      }}
                    />
                    
                    {/* Icon */}
                    <div 
                      className="relative inline-flex p-4 rounded-2xl transition-all duration-300 group-hover:scale-110"
                      style={{ 
                        background: bgGradient,
                        color: color,
                        boxShadow: `0 4px 16px ${color}20`
                      }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold mb-3"
                      style={{ color: 'var(--color-text-primary)' }}>
                    {title}
                  </h3>
                  
                  <p className="text-sm leading-relaxed"
                     style={{ 
                       color: 'var(--color-text-secondary)',
                       lineHeight: '1.7'
                     }}>
                    {description}
                  </p>

                  {/* Subtle Gradient Border on Hover */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      padding: '1px',
                      background: `linear-gradient(135deg, ${color}40, transparent)`,
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      WebkitMaskComposite: 'xor'
                    }}
                  />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
