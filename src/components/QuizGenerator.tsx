import React, { useState } from 'react';
import CloseIcon from './icons/CloseIcon';
import SparklesIcon from './icons/SparklesIcon';
import BrainIcon from './icons/BrainIcon';

interface QuizGeneratorProps {
  documentTitle: string;
  onGenerate: (count: number, difficulty: 'easy' | 'medium' | 'hard' | 'mixed') => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function QuizGenerator({
  documentTitle,
  onGenerate,
  onClose,
  isLoading = false,
}: QuizGeneratorProps) {
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');

  const handleGenerate = () => {
    if (questionCount >= 1 && questionCount <= 20) {
      onGenerate(questionCount, difficulty);
    }
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy', emoji: '😊', color: 'green' },
    { value: 'medium', label: 'Medium', emoji: '🤔', color: 'yellow' },
    { value: 'hard', label: 'Hard', emoji: '😰', color: 'red' },
    { value: 'mixed', label: 'Mixed', emoji: '🎲', color: 'purple' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Close quiz generator"
        >
          <CloseIcon className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <BrainIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Generate Quiz
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {documentTitle}
            </p>
          </div>
        </div>

        {/* Question Count */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Number of Questions
          </label>
          <div className="flex gap-2 mb-3">
            {[5, 10, 15, 20].map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                  questionCount === count
                    ? 'bg-blue-500 text-white shadow-md scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1</span>
            <span className="font-semibold text-blue-500">{questionCount}</span>
            <span>20</span>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Difficulty Level
          </label>
          <div className="grid grid-cols-2 gap-2">
            {difficultyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDifficulty(option.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  difficulty === option.value
                    ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{option.emoji}</div>
                <div className={`text-sm font-medium ${
                  difficulty === option.value
                    ? `text-${option.color}-600 dark:text-${option.color}-400`
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
          <div className="flex gap-2 text-sm text-blue-800 dark:text-blue-200">
            <SparklesIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              AI will generate {questionCount} {difficulty === 'mixed' ? 'mixed difficulty' : difficulty} question{questionCount !== 1 ? 's' : ''} based on your document content.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading || questionCount < 1 || questionCount > 20}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Generate Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
