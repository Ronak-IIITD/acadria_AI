import type { FC } from 'react';

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
    <section className="relative py-20 sm:py-24 lg:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
               style={{ 
                 backgroundColor: 'var(--color-accent-lavender-soft)',
                 border: '1px solid var(--color-border-light)'
               }}>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Testimonials
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold mb-6"
              style={{ 
                color: 'var(--color-text-primary)',
                letterSpacing: 'var(--letter-spacing-tight)',
                lineHeight: 'var(--line-height-tight)'
              }}>
            Designed to Keep Learners Settled
          </h2>
          
          <p className="text-lg sm:text-xl"
             style={{ 
               color: 'var(--color-text-secondary)',
               lineHeight: 'var(--line-height-relaxed)'
             }}>
            Students from medicine to law rely on the measured pace of StudySync AI to revise without feeling overwhelmed.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonialsData.map(({ quote, name, title, avatar, rating }) => (
            <article 
              key={name}
              className="group p-8 rounded-3xl transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-surface-soft)',
                border: '1px solid var(--color-border-light)',
                boxShadow: 'var(--shadow-sm)',
                transitionDuration: 'var(--transition-base)'
              }}
            >
              {/* Rating Stars */}
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

              {/* Quote */}
              <p className="text-base leading-relaxed mb-8"
                 style={{ 
                   color: 'var(--color-text-secondary)',
                   lineHeight: 'var(--line-height-relaxed)'
                 }}>
                "{quote}"
              </p>

              {/* Author */}
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;