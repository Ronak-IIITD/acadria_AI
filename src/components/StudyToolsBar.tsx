import React from 'react';

interface StudyToolsBarProps {
  onQuizClick: () => void;
  onFlashcardsClick: () => void;
  onMindMapClick: () => void;
  onTimelineClick: () => void;
  onSearchClick: () => void;
  disabled?: boolean;
}

const StudyToolsBar: React.FC<StudyToolsBarProps> = ({
  onQuizClick,
  onFlashcardsClick,
  onMindMapClick,
  onTimelineClick,
  onSearchClick,
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b overflow-x-hidden" style={{
      borderColor: 'var(--color-border-light)',
      background: 'var(--color-bg-secondary)',
      minHeight: '52px'
    }}>
      {/* Chat - Active */}
      <button
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
        style={{
          background: 'var(--color-accent-primary)',
          color: 'white',
          height: '36px'
        }}
      >
        <div className="w-2 h-2 rounded-full bg-green-400"></div>
        <span>Chat</span>
      </button>

      {/* Flashcards */}
      <button
        onClick={onFlashcardsClick}
        disabled={disabled}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
        style={{
          color: 'var(--color-text-secondary)',
          height: '36px'
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>Flashcards</span>
      </button>

      {/* Quizzes */}
      <button
        onClick={onQuizClick}
        disabled={disabled}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
        style={{
          color: 'var(--color-text-secondary)',
          height: '36px'
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <span>Quizzes</span>
      </button>

      {/* Podcast */}
      <button
        disabled={true}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all opacity-40 cursor-not-allowed whitespace-nowrap flex-shrink-0"
        style={{
          color: 'var(--color-text-secondary)',
          height: '36px'
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span>Podcast</span>
      </button>

      {/* Summary */}
      <button
        disabled={disabled}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
        style={{
          color: 'var(--color-text-secondary)',
          height: '36px'
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Summary</span>
      </button>

      {/* Chapters */}
      <button
        disabled={true}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all opacity-40 cursor-not-allowed whitespace-nowrap flex-shrink-0"
        style={{
          color: 'var(--color-text-secondary)',
          height: '36px'
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span>Chapters</span>
      </button>
    </div>
  );
};

export default StudyToolsBar;
