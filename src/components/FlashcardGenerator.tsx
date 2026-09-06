import React, { useState } from 'react';
import { Flashcard } from '@/domain/studyTypes';
import { generateFlashcards } from '../services/studyToolsService';
import SparklesIcon from './icons/SparklesIcon';
import CloseIcon from './icons/CloseIcon';

interface FlashcardGeneratorProps {
  documentContent: string;
  documentId: string;
  documentTitle: string;
  onGenerate: (flashcards: Flashcard[]) => void;
  onClose: () => void;
}

export default function FlashcardGenerator({
  documentContent,
  documentId,
  documentTitle,
  onGenerate,
  onClose,
}: FlashcardGeneratorProps) {
  const [cardCount, setCardCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const flashcards = await generateFlashcards(documentId, cardCount);
      onGenerate(flashcards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-blue-600" />
            Generate Flashcards
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          AI will generate flashcards from <strong>{documentTitle}</strong> to help you study.
        </p>

        {/* Card Count Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of flashcards
          </label>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((count) => (
              <button
                key={count}
                onClick={() => setCardCount(count)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  cardCount === count
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Count Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or enter custom count
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={cardCount}
            onChange={(e) => setCardCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 10)))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 AI will extract key concepts and create question-answer pairs using spaced repetition algorithm.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}