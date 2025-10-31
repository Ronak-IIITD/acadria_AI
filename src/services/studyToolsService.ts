import { generateFlashcardsFromContent, getAiResponse } from './geminiService';
import { Flashcard, QuizQuestion, Quiz, Summary } from '@/domain/studyTypes';

/**
 * Generate flashcards from document content using Gemini AI
 */
export async function generateFlashcards(
  documentContent: string,
  documentId: string,
  count: number = 10
): Promise<Flashcard[]> {
  try {
    const flashcardData = await generateFlashcardsFromContent(documentContent, count);
    
    // Convert to Flashcard objects with SM-2 defaults
    const flashcards: Flashcard[] = flashcardData.map((data, index) => ({
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
    throw error; // Re-throw to show the actual error message
  }
}

/**
 * Generate a quiz from document content
 */
export async function generateQuiz(
  documentContent: string,
  documentId: string,
  questionCount: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed'
): Promise<Quiz> {
  const prompt = `You are a study assistant creating a quiz. Generate ${questionCount} quiz questions from the following document content.

**Document Content:**
${documentContent}

**Instructions:**
1. Create exactly ${questionCount} questions
2. Difficulty level: ${difficulty}
3. Mix question types:
   - Multiple choice (4 options, 1 correct)
   - True/False
   - Short answer
4. Include explanations for correct answers
5. Cover different topics from the document

**Format your response as a JSON array:**
[
  {
    "type": "multiple-choice" | "true-false" | "short-answer",
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"], // only for multiple-choice
    "correctAnswer": "The correct answer",
    "explanation": "Why this is correct and what concept it tests",
    "difficulty": "easy" | "medium" | "hard"
  }
]

Return ONLY the JSON array, no additional text.`;

  try {
    const response = await getAiResponse(prompt, [], false);
    
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
    else if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
    if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);
    
    const questionsData = JSON.parse(jsonText.trim());
    
    const questions: QuizQuestion[] = questionsData.map((data: any, index: number) => ({
      id: `${documentId}-quiz-${Date.now()}-${index}`,
      question: data.question,
      options: data.options,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      difficulty: data.difficulty || difficulty,
      type: data.type,
    }));
    
    const quiz: Quiz = {
      id: `quiz-${documentId}-${Date.now()}`,
      documentId,
      questions,
      totalQuestions: questions.length,
      userId: 'current-user', // TODO: Get from auth context
    };
    
    return quiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz. Please try again.');
  }
}

/**
 * Generate a summary of document content
 */
export async function generateSummary(
  documentContent: string,
  documentId: string,
  mode: 'brief' | 'detailed' | 'bullets' = 'detailed'
): Promise<Summary> {
  let prompt = '';
  
  switch (mode) {
    case 'brief':
      prompt = `Provide a brief 2-3 sentence summary of the following content. Focus on the absolute main points only.

**Content:**
${documentContent}

**Summary:**`;
      break;
    
    case 'bullets':
      prompt = `Extract the key takeaways from the following content as a bulleted list. Include 5-10 main points.

**Content:**
${documentContent}

**Key Takeaways:**
• `;
      break;
    
    case 'detailed':
    default:
      prompt = `Provide a comprehensive summary of the following content. Include:
1. Main topic/thesis
2. Key concepts and their relationships
3. Important details and examples
4. Conclusions or implications

**Content:**
${documentContent}

**Detailed Summary:**`;
      break;
  }
  
  try {
    const response = await getAiResponse(prompt, [], false);
    const content = response.text;
    
    const summary: Summary = {
      id: `summary-${documentId}-${mode}-${Date.now()}`,
      documentId,
      mode,
      content,
      generatedAt: new Date(),
    };
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary. Please try again.');
  }
}

/**
 * Extract key takeaways from document
 */
export async function generateKeyTakeaways(
  documentContent: string,
  count: number = 5
): Promise<string[]> {
  const prompt = `Extract the ${count} most important key takeaways from the following content. Each takeaway should be a single, clear statement.

**Content:**
${documentContent}

**Format:**
Return ONLY a JSON array of strings:
["Takeaway 1", "Takeaway 2", "Takeaway 3", ...]

No additional text or formatting.`;

  try {
    const response = await getAiResponse(prompt, [], false);
    
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
    else if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
    if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);
    
    const takeaways = JSON.parse(jsonText.trim());
    return takeaways;
  } catch (error) {
    console.error('Error generating key takeaways:', error);
    throw new Error('Failed to generate key takeaways. Please try again.');
  }
}