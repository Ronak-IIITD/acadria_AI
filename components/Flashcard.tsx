import { useState } from 'react';
import { Flashcard as FlashcardType, calculateNextReview } from '../studyTypes';

interface FlashcardProps {
  card: FlashcardType;
  onRate: (card: FlashcardType, quality: number) => void;
  onSkip?: () => void;
  showAnswer: boolean;
  onToggleAnswer: () => void;
}

const QUALITY_LABELS = [
  { value: 0, label: 'Blackout', color: 'bg-red-600', description: 'Complete blackout' },
  { value: 1, label: 'Wrong', color: 'bg-red-500', description: 'Incorrect, but recognized' },
  { value: 2, label: 'Hard', color: 'bg-orange-500', description: 'Incorrect, seemed easy' },
  { value: 3, label: 'Good', color: 'bg-yellow-500', description: 'Correct with difficulty' },
  { value: 4, label: 'Easy', color: 'bg-green-500', description: 'Correct with hesitation' },
  { value: 5, label: 'Perfect', color: 'bg-green-600', description: 'Perfect recall' },
];

export default function Flashcard({ card, onRate, onSkip, showAnswer, onToggleAnswer }: FlashcardProps) {
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);

  const handleRate = (quality: number) => {
    setSelectedQuality(quality);
    const updatedCard = calculateNextReview(card, quality);
    
    // Small delay for visual feedback
    setTimeout(() => {
      onRate(updatedCard, quality);
      setSelectedQuality(null);
    }, 300);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = new Date(date).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    return 'Overdue';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Card Container with 3D Flip Animation */}
      <div className="perspective-1000 min-h-[400px]">
        <div 
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${
            showAnswer ? 'rotate-y-180' : ''
          }`}
          onClick={!showAnswer ? onToggleAnswer : undefined}
          style={{
            transformStyle: 'preserve-3d',
            transform: showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front of Card */}
          <div 
            className="absolute w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 min-h-[400px] flex flex-col justify-center items-center backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm mb-4">Question</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                {card.front}
              </h2>
              <div className="text-gray-400 dark:text-gray-500 text-sm mt-8">
                Click to reveal answer
              </div>
            </div>
          </div>

          {/* Back of Card */}
          <div 
            className="absolute w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 min-h-[400px] flex flex-col justify-center backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="w-full">
              <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Question</div>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                {card.front}
              </p>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Answer</div>
                <p className="text-xl text-gray-900 dark:text-white whitespace-pre-wrap">
                  {card.back}
                </p>
              </div>
              
              {/* Card Stats */}
              {card.repetitions > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Reviews: {card.repetitions}</span>
                  <span>Ease: {card.easeFactor.toFixed(2)}</span>
                  <span>Next: {formatDate(card.nextReviewDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      {showAnswer && (
        <div className="mt-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-3">
            How well did you remember this?
          </p>
          <div className="grid grid-cols-6 gap-2">
            {QUALITY_LABELS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRate(option.value)}
                disabled={selectedQuality !== null}
                className={`${option.color} hover:opacity-90 text-white font-semibold py-3 px-2 rounded-lg transition-all ${
                  selectedQuality === option.value ? 'ring-4 ring-blue-500 scale-105' : ''
                } disabled:opacity-50`}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Skip Button */}
          {onSkip && (
            <div className="flex justify-center mt-4">
              <button
                onClick={onSkip}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
              >
                Skip this card
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {card.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}