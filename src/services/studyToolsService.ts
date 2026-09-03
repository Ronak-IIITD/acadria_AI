import { getClerkToken } from '../lib/clerkToken';
import { Flashcard, QuizQuestion, Quiz, Summary } from '@/domain/studyTypes';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getClerkToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Generate flashcards from document using backend API
 */
export async function generateFlashcards(
  documentId: string,
  count: number = 10
): Promise<Flashcard[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BACKEND_URL}/api/study/flashcards`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ document_id: documentId, count }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate flashcards');
    }

    const flashcardData = await response.json();
    
    // Convert to Flashcard objects with SM-2 defaults
    const flashcards: Flashcard[] = flashcardData.map((data: any, index: number) => ({
      id: `${documentId}-card-${Date.now()}-${index}`,
      front: data.front,
      back: data.back,
      difficulty: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5, // Default SM-2 starting value
      nextReviewDate: new Date(),
      created: new Date(),
      documentId,
      tags: data.tags || [],
    }));
    
    return flashcards;
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw error;
  }
}

/**
 * Generate a quiz from document using backend API
 */
export async function generateQuiz(
  documentId: string,
  questionCount: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed'
): Promise<Quiz> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BACKEND_URL}/api/study/quiz`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        document_id: documentId, 
        question_count: questionCount,
        difficulty 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate quiz');
    }

    const questionsData = await response.json();
    
    const questions: QuizQuestion[] = questionsData.map((data: any, index: number) => ({
      id: `${documentId}-quiz-${Date.now()}-${index}`,
      question: data.question,
      options: data.options,
      correctAnswer: data.correct_answer,
      explanation: data.explanation,
      difficulty: data.difficulty || difficulty,
      type: data.type,
    }));
    
    const quiz: Quiz = {
      id: `quiz-${documentId}-${Date.now()}`,
      documentId,
      questions,
      totalQuestions: questions.length,
      userId: 'anonymous', // User ID managed via Clerk Auth token in API calls
    };
    
    return quiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz. Please try again.');
  }
}

/**
 * Generate a summary of document using backend API
 */
export async function generateSummary(
  documentId: string,
  mode: 'brief' | 'detailed' | 'bullets' = 'detailed'
): Promise<Summary> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BACKEND_URL}/api/study/summary`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ document_id: documentId, mode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate summary');
    }

    const data = await response.json();
    
    const summary: Summary = {
      id: `summary-${documentId}-${mode}-${Date.now()}`,
      documentId,
      mode,
      content: data.summary,
      generatedAt: new Date(),
    };

    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary. Please try again.');
  }
}

/**
 * Extract key takeaways from document using backend API
 */
export async function generateKeyTakeaways(
  documentId: string,
  count: number = 5
): Promise<string[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BACKEND_URL}/api/study/takeaways`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ document_id: documentId, count }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate key takeaways');
    }

    const takeaways = await response.json();
    return takeaways;
  } catch (error) {
    console.error('Error generating key takeaways:', error);
    throw new Error('Failed to generate key takeaways. Please try again.');
  }
}