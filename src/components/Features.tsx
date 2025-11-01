import React from 'react';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import FileCheckIcon from './icons/FileCheckIcon';
import SparklesIcon from './icons/SparklesIcon';

const features = [
  {
    icon: BrainCircuitIcon,
    title: 'Grounded Q&A',
    description: 'Ask anything about your material and receive responses that cite the passages your notes came from.',
  },
  {
    icon: FileCheckIcon,
    title: 'Thoughtful imports',
    description: 'PDF, DOCX, TXT, and slides are parsed gently, keeping structure intact for accurate summaries.',
  },
  {
    icon: SparklesIcon,
    title: 'Study modes in sync',
    description: 'Flashcards, quizzes, and key takeaways all originate from the same calm workspace — no context switching.',
  },
];

const Features: React.FC = () => {
  return (
    <section id="features" className="section-shell">
      <div className="section-intro">
        <span className="eyebrow">In rhythm with your study flow</span>
        <h2 className="section-heading">A toolkit that stays out of the spotlight</h2>
        <p className="subheading">
          Each capability quietly supports comprehension so you can focus on understanding instead of configuring.
        </p>
      </div>
      <div className="card-grid">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="feature-card">
            <div className="feature-icon">
              <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              <p className="text-[0.98rem] leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;