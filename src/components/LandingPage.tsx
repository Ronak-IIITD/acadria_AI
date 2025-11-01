import React from 'react';
import Features from './Features';
import Footer from './Footer';
import ProductIllustration from './ProductIllustration';
import Testimonials from './Testimonials';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const heroHighlights = [
    'Grounded responses pulled straight from your uploaded material.',
    'Summaries, flashcards, and quizzes crafted without the busywork.',
    'A quiet, balanced interface built for longer study sessions.',
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 sm:pt-28 sm:pb-24">
        <div className="absolute inset-x-0 top-[-25%] h-[420px] bg-gradient-to-b from-white/80 to-transparent dark:from-slate-900/80" aria-hidden="true" />
        <div className="absolute inset-0" aria-hidden="true">
          <div className="mx-auto h-full max-w-7xl px-6 lg:px-10">
            <div className="grid h-full grid-cols-12 gap-4">
              <div className="col-span-3 col-start-1 hidden rounded-full bg-[rgba(111,124,191,0.08)] blur-3xl lg:block" />
              <div className="col-span-4 col-start-6 hidden rounded-full bg-[rgba(139,184,168,0.1)] blur-3xl lg:block" />
              <div className="col-span-3 col-start-10 hidden rounded-full bg-[rgba(167,174,230,0.12)] blur-3xl lg:block" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col gap-10">
              <div className="space-y-6">
                <span className="eyebrow">StudySync AI</span>
                <h1 className="hero-headline text-balance text-4xl font-semibold sm:text-5xl lg:text-[3.4rem]" style={{ letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                  Study in a calmer, more intentional space.
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  Bring your notes, articles, and slides into a focused workspace that keeps distractions away and insights close.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button onClick={onGetStarted} className="button-primary w-full sm:w-auto">
                  Get started for free
                </button>
                <a className="button-secondary w-full sm:w-auto" href="#features">
                  Explore the toolkit
                </a>
              </div>

              <ul className="grid gap-4">
                {heroHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.98rem] leading-relaxed text-gray-600 dark:text-gray-300">
                    <span
                      className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ backgroundColor: 'var(--color-accent-primary-soft)', color: 'var(--color-accent-primary)' }}
                    >
                      •
                    </span>
                    <span className="text-balance">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-accent-primary-soft)', color: 'var(--color-accent-primary)' }}>
                    ★
                  </span>
                  Loved by focused learners worldwide
                </div>
                <div className="hidden sm:block h-4 w-px" style={{ backgroundColor: 'var(--color-border-soft)' }} />
                <div>Grounded answers with citations, every time</div>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="surface-card relative w-full max-w-md rounded-[28px] p-8 shadow-lg lg:max-w-lg xl:max-w-xl">
                <div className="space-y-8">
                  <div className="badge-muted w-fit">Calm by design</div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                      Everything you need, nothing extra
                    </h3>
                    <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                      Upload material once, then move seamlessly between summaries, flashcards, and questions — all styled to stay out of your way.
                    </p>
                  </div>

                  <div className="grid gap-5 rounded-2xl border" style={{ borderColor: 'var(--color-border-soft)', backgroundColor: 'var(--color-bg-secondary)' }}>
                    <div className="flex items-center justify-between gap-4 border-b px-5 py-4" style={{ borderColor: 'var(--color-border-soft)' }}>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Flashcard session</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">12 cards · 8 due now</div>
                      </div>
                      <span className="badge-muted">In progress</span>
                    </div>
                    <div className="px-5 pb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      "It feels like a quiet study room. The answers are grounded in my notes, and the interface keeps me present." — Maya, Grad Student
                    </div>
                  </div>
                </div>
                <ProductIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Features />

      <Testimonials />

      <Footer />
    </div>
  );
};

export default LandingPage;