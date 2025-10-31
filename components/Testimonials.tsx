import React, { useState, useEffect } from 'react';

const testimonialsData = [
  {
    quote: "StudySync AI has completely changed how I prepare for exams. Being able to 'talk' to my notes is a game-changer. My comprehension has skyrocketed.",
    name: "Alex Johnson",
    title: "Med Student",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d"
  },
  {
    quote: "As a law student drowning in reading material, this tool is a lifesaver. It finds the exact clause I need in seconds. I can't imagine studying without it now.",
    name: "Samantha Lee",
    title: "Law Student",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e"
  },
  {
    quote: "The ability to switch between my documents and a general web search is incredibly powerful. It bridges the gap between my course content and real-world knowledge.",
    name: "David Chen",
    title: "Engineering Major",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f"
  }
];

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % testimonialsData.length);
    }, 7000); // Auto-rotate every 7 seconds
    return () => clearInterval(timer);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex(prevIndex => (prevIndex - 1 + testimonialsData.length) % testimonialsData.length);
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % testimonialsData.length);
  };

  const currentTestimonial = testimonialsData[currentIndex];

  return (
    <section className="py-20 sm:py-24">
      <div className="relative glass-card max-w-4xl mx-auto p-8 sm:p-12 overflow-hidden">
        <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-12">
                Loved by Students Everywhere
            </h2>
        </div>
        <div className="relative h-48 sm:h-32">
        {testimonialsData.map((testimonial, index) => (
            <div
                key={index}
                className="absolute inset-0 transition-opacity duration-500 ease-in-out"
                style={{ opacity: index === currentIndex ? 1 : 0, zIndex: index === currentIndex ? 10 : 1 }}
            >
                <blockquote className="text-center">
                    <p className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-gray-100 italic">
                        "{testimonial.quote}"
                    </p>
                </blockquote>
                <footer className="mt-8 text-center">
                    <div className="font-bold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-gray-600 dark:text-gray-400">{testimonial.title}</div>
                </footer>
            </div>
        ))}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors"
          aria-label="Previous testimonial"
        >
          <svg className="h-6 w-6 text-gray-800 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors"
          aria-label="Next testimonial"
        >
          <svg className="h-6 w-6 text-gray-800 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        
        {/* Avatars */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center space-x-12">
            {testimonialsData.map((testimonial, index) => (
                <img
                    key={index}
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className={`h-12 w-12 rounded-full object-cover transition-all duration-500 ease-in-out ${
                        index === currentIndex
                        ? 'scale-125 opacity-100 filter-none'
                        : 'scale-75 opacity-50 filter blur-sm'
                    }`}
                />
            ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;