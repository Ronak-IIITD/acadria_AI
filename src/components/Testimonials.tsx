import type { FC } from 'react';
import ScrollReveal from './ScrollReveal';

const testimonialsData = [
  {
    quote:
      "StudySync AI has completely changed how I prepare for exams. Being able to 'talk' to my notes is a game-changer. My comprehension has skyrocketed.",
    name: 'Alex Johnson',
    title: 'Medical Student',
    avatar: 'https://i.pravatar.cc/120?u=studysync-alex',
    rating: 5
  },
  {
    quote:
      'As a law student drowning in reading material, this tool is a lifesaver. It finds the exact clause I need in seconds and keeps the context front and centre.',
    name: 'Samantha Lee',
    title: 'Law Student',
    avatar: 'https://i.pravatar.cc/120?u=studysync-sam',
    rating: 5
  },
  {
    quote:
      'The ability to switch between my documents and a clean, distraction-free chat helps me stay in the zone. It feels calm, even during finals.',
    name: 'David Chen',
    title: 'Engineering Major',
    avatar: 'https://i.pravatar.cc/120?u=studysync-david',
    rating: 5
  },
];

const Testimonials: FC = () => {
  return (
    <section id="testimonials" className="relative py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <ScrollReveal animation="fade" delay={0.1}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.1), rgba(139, 147, 212, 0.1))',
                   border: '1px solid rgba(53, 208, 195, 0.2)'
                 }}>
              <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                Testimonials
              </span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold mb-6"
                style={{ 
                  color: 'var(--color-text-primary)',
                  letterSpacing: 'var(--letter-spacing-tight)',
                  lineHeight: 'var(--line-height-tight)'
                }}>
              Loved by Students Who Value Clarity
            </h2>
            
            <p className="text-lg sm:text-xl"
               style={{ 
                 color: 'var(--color-text-secondary)',
                 lineHeight: 'var(--line-height-relaxed)'
               }}>
              Students from medicine to law rely on the measured pace of StudySync AI to revise without feeling overwhelmed.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonialsData.map(({ quote, name, title, avatar, rating }, index) => (
            <ScrollReveal 
              key={name} 
              animation="zoom" 
              delay={0.1 + index * 0.1}
            >
              <article 
                className="group p-8 rounded-3xl"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid var(--color-border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  transform: 'translateZ(0)',
                  transition: 'all 0.3s ease-out',
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
                <div className="flex gap-1 mb-6">
                  {[...Array(rating)].map((_, i) => (
                    <svg 
                      key={i}
                      className="w-5 h-5" 
                      style={{ color: 'var(--color-accent-primary)' }}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-base leading-relaxed mb-8"
                   style={{ 
                     color: 'var(--color-text-secondary)',
                     lineHeight: 'var(--line-height-relaxed)'
                   }}>
                  "{quote}"
                </p>

                <div className="flex items-center gap-4">
                  <img 
                    src={avatar} 
                    alt={name} 
                    className="w-12 h-12 rounded-full object-cover"
                    style={{ border: '2px solid var(--color-border-light)' }}
                  />
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {name}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
