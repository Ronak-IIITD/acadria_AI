import React, { useState, useEffect } from 'react';
import CloseIcon from './icons/CloseIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import TrophyIcon from './icons/TrophyIcon';
import ClockIcon from './icons/ClockIcon';
import { Quiz, QuizQuestion } from '@/domain/studyTypes';

interface QuizTakerProps {
  quiz: Quiz;
  onClose: () => void;
  onComplete: (score: number, totalQuestions: number) => void;
}

export default function QuizTaker({ quiz, onClose, onComplete }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasAnswered = !!userAnswers[currentQuestion.id];
  const isCorrect = userAnswers[currentQuestion.id] === currentQuestion.correctAnswer;

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const handleAnswer = (answer: string) => {
    if (hasAnswered) return;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));

    setShowExplanation((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      completeQuiz();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const completeQuiz = () => {
    const finalScore = quiz.questions.reduce((acc, q) => {
      return acc + (userAnswers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);
    setScore(finalScore);
    setIsCompleted(true);
    onComplete(finalScore, quiz.totalQuestions);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'hard': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  if (isCompleted) {
    const percentage = Math.round((score / quiz.totalQuestions) * 100);
    const isPassing = percentage >= 70;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close quiz"
          >
            <CloseIcon className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center">
            <div className={`inline-flex p-4 rounded-full mb-4 ${isPassing ? 'bg-green-100 dark:bg-green-900/20' : 'bg-orange-100 dark:bg-orange-900/20'}`}>
              <TrophyIcon className={`w-12 h-12 ${isPassing ? 'text-green-600' : 'text-orange-600'}`} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Quiz Complete!
            </h2>

            <div className="text-6xl font-bold mb-4">
              <span className={isPassing ? 'text-green-600' : 'text-orange-600'}>
                {percentage}%
              </span>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              You answered <span className="font-semibold text-gray-900 dark:text-white">{score}</span> out of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{quiz.totalQuestions}</span> questions correctly
            </p>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                <span>{formatTime(elapsedTime)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setUserAnswers({});
                  setShowExplanation({});
                  setIsCompleted(false);
                  setScore(0);
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all"
              >
                Retry Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="w-4 h-4" />
                <span>{formatTime(elapsedTime)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Close quiz"
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Question {currentQuestionIndex + 1} of {quiz.totalQuestions}</span>
              <span>{Object.keys(userAnswers).length} answered</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {currentQuestion.question}
          </h3>

          {/* Answer Options */}
          {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => {
                const isSelected = userAnswers[currentQuestion.id] === option;
                const isCorrectOption = option === currentQuestion.correctAnswer;
                const showResult = hasAnswered;

                let buttonClass = 'w-full p-4 text-left rounded-lg border-2 transition-all ';
                
                if (showResult) {
                  if (isCorrectOption) {
                    buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20';
                  } else if (isSelected) {
                    buttonClass += 'border-red-500 bg-red-50 dark:bg-red-900/20';
                  } else {
                    buttonClass += 'border-gray-200 dark:border-gray-700 opacity-50';
                  }
                } else {
                  buttonClass += 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={hasAnswered}
                    className={buttonClass}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        showResult
                          ? isCorrectOption
                            ? 'border-green-500 bg-green-500'
                            : isSelected
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-300'
                          : 'border-gray-300'
                      }`}>
                        {showResult && (isCorrectOption || isSelected) && (
                          isCorrectOption ? (
                            <CheckCircleIcon className="w-4 h-4 text-white" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-white" />
                          )
                        )}
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'true-false' && (
            <div className="space-y-3 mb-6">
              {['True', 'False'].map((option) => {
                const isSelected = userAnswers[currentQuestion.id] === option;
                const isCorrectOption = option === currentQuestion.correctAnswer;
                const showResult = hasAnswered;

                let buttonClass = 'w-full p-4 text-left rounded-lg border-2 transition-all ';
                
                if (showResult) {
                  if (isCorrectOption) {
                    buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20';
                  } else if (isSelected) {
                    buttonClass += 'border-red-500 bg-red-50 dark:bg-red-900/20';
                  } else {
                    buttonClass += 'border-gray-200 dark:border-gray-700 opacity-50';
                  }
                } else {
                  buttonClass += 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer';
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={hasAnswered}
                    className={buttonClass}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        showResult
                          ? isCorrectOption
                            ? 'border-green-500 bg-green-500'
                            : isSelected
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-300'
                          : 'border-gray-300'
                      }`}>
                        {showResult && (isCorrectOption || isSelected) && (
                          isCorrectOption ? (
                            <CheckCircleIcon className="w-4 h-4 text-white" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-white" />
                          )
                        )}
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-lg">
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'short-answer' && (
            <div className="mb-6">
              <textarea
                value={userAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                disabled={hasAnswered}
                placeholder="Type your answer here..."
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                rows={4}
              />
              {!hasAnswered && (
                <button
                  onClick={() => handleAnswer(userAnswers[currentQuestion.id] || '')}
                  disabled={!userAnswers[currentQuestion.id]?.trim()}
                  className="mt-3 px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              )}
            </div>
          )}

          {/* Explanation */}
          {showExplanation[currentQuestion.id] && (
            <div className={`p-4 rounded-lg border-2 ${
              isCorrect
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </p>
                  {!isCorrect && currentQuestion.type !== 'short-answer' && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      The correct answer is: <span className="font-semibold">{currentQuestion.correctAnswer}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!hasAnswered}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
              {!isLastQuestion && <ChevronRightIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
