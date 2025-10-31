// Spaced Repetition types and algorithms
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: number; // 0-5 (SM-2 algorithm)
  interval: number; // days until next review
  repetitions: number; // number of successful reviews
  easeFactor: number; // 1.3 - 2.5
  nextReviewDate: Date;
  created: Date;
  lastReviewed?: Date;
  documentId: string;
  tags?: string[];
}

export interface StudySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  cardsReviewed: number;
  cardsCorrect: number;
  cardsIncorrect: number;
  documentId: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple-choice' | 'true-false' | 'short-answer';
}

export interface Quiz {
  id: string;
  documentId: string;
  questions: QuizQuestion[];
  score?: number;
  totalQuestions: number;
  completedAt?: Date;
  userId: string;
}

export interface Summary {
  id: string;
  documentId: string;
  mode: 'brief' | 'detailed' | 'bullets';
  content: string;
  generatedAt: Date;
}

export interface MindMapNode {
  id: string;
  label: string;
  level: number;
  parent?: string;
  x?: number;
  y?: number;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}

export interface MindMap {
  id: string;
  documentId: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  createdAt: Date;
}

/**
 * SM-2 Spaced Repetition Algorithm
 * Used by SuperMemo, Anki, and other flashcard apps
 * 
 * @param card - The flashcard to update
 * @param quality - User's response quality (0-5)
 *   0: Complete blackout
 *   1: Incorrect, but recognized
 *   2: Incorrect, seemed easy
 *   3: Correct with difficulty
 *   4: Correct with hesitation
 *   5: Perfect recall
 * @returns Updated flashcard
 */
export function calculateNextReview(card: Flashcard, quality: number): Flashcard {
  // Quality must be 0-5
  quality = Math.max(0, Math.min(5, Math.floor(quality)));
  
  let { easeFactor, interval, repetitions } = card;
  
  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Minimum ease factor is 1.3
  easeFactor = Math.max(1.3, easeFactor);
  
  // If quality < 3, reset the card
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    
    // Calculate new interval based on repetitions
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }
  
  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    lastReviewed: new Date(),
    difficulty: quality,
  };
}

/**
 * Get flashcards due for review
 */
export function getDueFlashcards(cards: Flashcard[]): Flashcard[] {
  const now = new Date();
  return cards.filter(card => new Date(card.nextReviewDate) <= now);
}

/**
 * Get new flashcards (never reviewed)
 */
export function getNewFlashcards(cards: Flashcard[]): Flashcard[] {
  return cards.filter(card => card.repetitions === 0 && !card.lastReviewed);
}

/**
 * Sort flashcards by review date (earliest first)
 */
export function sortCardsByDue(cards: Flashcard[]): Flashcard[] {
  return [...cards].sort((a, b) => 
    new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
  );
}

/**
 * Calculate study statistics
 */
export function calculateStudyStats(cards: Flashcard[]) {
  const now = new Date();
  const dueCards = getDueFlashcards(cards);
  const newCards = getNewFlashcards(cards);
  const reviewedCards = cards.filter(card => card.lastReviewed);
  
  // Cards mastered (repetitions >= 5)
  const masteredCards = cards.filter(card => card.repetitions >= 5);
  
  // Average ease factor
  const avgEaseFactor = cards.length > 0
    ? cards.reduce((sum, card) => sum + card.easeFactor, 0) / cards.length
    : 2.5;
  
  // Retention rate (cards with ease factor > 2.0)
  const retentionRate = cards.length > 0
    ? (cards.filter(card => card.easeFactor >= 2.0).length / cards.length) * 100
    : 0;
  
  return {
    totalCards: cards.length,
    dueCards: dueCards.length,
    newCards: newCards.length,
    reviewedCards: reviewedCards.length,
    masteredCards: masteredCards.length,
    avgEaseFactor: avgEaseFactor.toFixed(2),
    retentionRate: retentionRate.toFixed(1),
  };
}