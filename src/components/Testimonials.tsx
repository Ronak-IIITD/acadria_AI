import React from 'react';

const testimonialsData = [
  {
    quote:
      "StudySync AI has completely changed how I prepare for exams. Being able to 'talk' to my notes is a game-changer. My comprehension has skyrocketed.",
    name: 'Alex Johnson',
    title: 'Medical student',
    avatar: 'https://i.pravatar.cc/120?u=studysync-alex',
  },
  {
    quote:
      'As a law student drowning in reading material, this tool is a lifesaver. It finds the exact clause I need in seconds and keeps the context front and centre.',
    name: 'Samantha Lee',
    title: 'Law student',
    avatar: 'https://i.pravatar.cc/120?u=studysync-sam',
  },
  {
    quote:
      'The ability to switch between my documents and a clean, distraction-free chat helps me stay in the zone. It feels calm, even during finals.',
    name: 'David Chen',
    title: 'Engineering major',
    avatar: 'https://i.pravatar.cc/120?u=studysync-david',
  },
];

const Testimonials: React.FC = () => {
  return (
    <section className="section-shell">
      <div className="section-intro">
        <span className="eyebrow">Quiet confidence</span>
        <h2 className="section-heading">Designed to keep learners settled</h2>
        <p className="subheading">
          Students from medicine to law rely on the measured pace of StudySync AI to revise without feeling overwhelmed.
        </p>
      </div>

      <div className="card-grid">
        {testimonialsData.map(({ quote, name, title, avatar }) => (
          <article key={name} className="testimonial-card">
            <p className="testimonial-quote">“{quote}”</p>
            <div className="testimonial-meta">
              <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">{name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;