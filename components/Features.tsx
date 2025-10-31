import React from 'react';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import FileCheckIcon from './icons/FileCheckIcon';
import SparklesIcon from './icons/SparklesIcon';

const features = [
  {
    icon: <BrainCircuitIcon className="h-10 w-10 mb-4" />,
    title: "Smart Q&A",
    description: "Get precise, context-aware answers based exclusively on your uploaded documents. No more endless searching.",
  },
  {
    icon: <FileCheckIcon className="h-10 w-10 mb-4" />,
    title: "Multi-Format Support",
    description: "Seamlessly upload and analyze PDF, DOCX, and TXT files. All your study materials, all in one place.",
  },
  {
    icon: <SparklesIcon className="h-10 w-10 mb-4" />,
    title: "Dual-Mode Intelligence",
    description: "Rely on document-based answers for focused study, or tap into general knowledge for broader questions.",
  },
];

const Features: React.FC = () => {
  return (
    <section className="py-20 sm:py-24">
      <div className="text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Why StudySync AI?</h2>
        <p className="mt-4 text-lg text-gray-800 dark:text-gray-100 font-medium">The ultimate toolkit for efficient learning.</p>
      </div>
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="glass-card p-8 text-center flex flex-col items-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 text-purple-600 dark:text-purple-400"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {feature.icon}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
            <p className="mt-2 text-base text-gray-800 dark:text-gray-200">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;