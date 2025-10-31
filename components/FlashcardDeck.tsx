import React, { useState, useEffect } from 'react';
import Flashcard from './Flashcard';
import { Flashcard as FlashcardType, getDueFlashcards, getNewFlashcards, calculateStudyStats } from '../studyTypes';
import CloseIcon from './icons/CloseIcon';

interface FlashcardDeckProps {
  cards: FlashcardType[];
  onUpdateCard: (card: FlashcardType) => void;
  onClose: () => void;
  documentTitle?: string;
}

export default function FlashcardDeck({ cards, onUpdateCard, onClose, documentTitle }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyCards, setStudyCards] = useState<FlashcardType[]>([]);
  const [sessionStartTime] = useState(new Date());
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    // Prioritize due cards, then new cards
    const dueCards = getDueFlashcards(cards);
    const newCards = getNewFlashcards(cards).slice(0, 10); // Limit new cards per session
    
    const sessionCards = [...dueCards, ...newCards];
    setStudyCards(sessionCards);
    
    if (sessionCards.length === 0) {
      setSessionComplete(true);
    }
  }, [cards]);

  // Add keyboard navigation
  useEffect(() => {
    const currentCard = studyCards[currentIndex];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle keys if session is complete
      if (sessionComplete) return;

      switch (event.key) {
        case 'ArrowLeft':
          // Previous card
          if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowAnswer(false);
          }
          break;
        case 'ArrowRight':
          // Next card (only if answer is shown or skip)
          if (showAnswer && currentIndex < studyCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
          }
          break;
        case 'ArrowUp':
        case ' ':
        case 'Enter':
          // Flip card
          event.preventDefault();
          setShowAnswer(prev => !prev);
          break;
        case 'ArrowDown':
          // Skip card
          if (currentIndex < studyCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
          }
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          // Quick rating (only when answer is shown)
          if (showAnswer && currentCard) {
            const quality = parseInt(event.key);
            handleRate(currentCard, quality);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, showAnswer, sessionComplete, studyCards]);

  const currentCard = studyCards[currentIndex];
  const stats = calculateStudyStats(cards);

  const handleRate = (updatedCard: FlashcardType, quality: number) => {
    onUpdateCard(updatedCard);
    setCardsReviewed(prev => prev + 1);
    
    // Move to next card
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setSessionComplete(true);
    }
  };

  const handleSkip = () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setSessionComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setCardsReviewed(0);
    setSessionComplete(false);
  };

  const progress = studyCards.length > 0 ? ((currentIndex + 1) / studyCards.length) * 100 : 0;
  const sessionDuration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 60000);

  if (sessionComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Study Session Complete!
            </h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Cards Reviewed:</span>
                <span className="font-semibold">{cardsReviewed}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Session Duration:</span>
                <span className="font-semibold">{sessionDuration} min</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Total Cards:</span>
                <span className="font-semibold">{stats.totalCards}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Mastered:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {stats.masteredCards}
                </span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Retention Rate:</span>
                <span className="font-semibold">{stats.retentionRate}%</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Study Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (studyCards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Cards to Review
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You're all caught up! Come back later for your next review session.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {documentTitle || 'Flashcard Study Session'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Card {currentIndex + 1} of {studyCards.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCards}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.dueCards}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Due</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.masteredCards}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Mastered</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.retentionRate}%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Retention</div>
          </div>
        </div>

        {/* Flashcard */}
        {currentCard && (
          <Flashcard
            card={currentCard}
            onRate={handleRate}
            onSkip={handleSkip}
            showAnswer={showAnswer}
            onToggleAnswer={() => setShowAnswer(!showAnswer)}
          />
        )}
      </div>
    </div>
  );
}