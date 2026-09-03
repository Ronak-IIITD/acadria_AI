import type { StudyFile, ChatMessage, ContentBlock } from '../types';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getClerkToken } from '../lib/clerkToken';

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

// REMOVED: import { normalizeAIOutput } from '../utils/mathNormalize';
// Server-side now handles all normalization

// Add Mammoth.js type declaration for global script
declare const mammoth: any;

// Add PptxGenJS type declaration for global script
declare const PptxGenJS: any;

// Configure the PDF.js worker to use the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// NOTE: No GoogleGenAI client instantiated in browser.
// All AI calls are routed through authenticated backend endpoints.
// VITE_API_KEY is intentionally removed to prevent browser-side credential exposure.
// The backend (FastAPI) handles all Gemini/Groq/Grok provider calls using secret keys.

/**
 * Decodes a Base64 string to a UTF-8 string.
 * @param base64 The Base64 encoded string.
 * @returns The decoded string.
 */
const decodeBase64 = (base64: string): string => {
    try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
        console.error("Failed to decode base64 content:", e);
        return "";
    }
};

/**
 * Decodes a Base64 string to a UTF-8 string.
 * @param base64 The Base64 encoded string.
 * @returns The decoded string.
 */
const decodeBase64 = (base64: string): string => {
    try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
        console.error("Failed to decode base64 content:", e);
        return "";
    }
};

/**
 * Parses text content from a Base64 encoded PDF file.
 * @param base64 The Base64 encoded PDF content.
 * @returns The extracted text content, or an empty string if parsing fails.
 */
const parsePdfContent = async (base64: string): Promise<string> => {
    try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
                // Type guard to ensure item has 'str' property
                .filter((item: any): item is { str: string } => 'str' in item)
                .map((item: { str: string }) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }
        return fullText.trim();
    } catch (error) {
        console.error('Failed to parse PDF content:', error);
        return '';
    }
};

/**
 * Parses text content from a Base64 encoded DOCX file.
 * @param base64 The Base64 encoded DOCX content.
 * @returns The extracted text content, or an empty string if parsing fails.
 */
const parseDocxContent = async (base64: string): Promise<string> => {
    try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
        return result.value;
    } catch (error) {
        console.error('Failed to parse DOCX content:', error);
        return '';
    }
};

/**
 * Parses text content from a Base64 encoded PPTX file.
 * Uses a simple text extraction approach - extracts text from slides.
 * @param base64 The Base64 encoded PPTX content.
 * @returns The extracted text content, or an empty string if parsing fails.
 */
const parsePptxContent = async (base64: string): Promise<string> => {
    try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Use JSZip to extract text from PPTX (which is a zip file)
        const JSZip = (window as any).JSZip;
        if (!JSZip) {
            console.error('JSZip library not loaded');
            return '';
        }

        const zip = await JSZip.loadAsync(bytes);
        let fullText = '';

        // Extract text from slide XML files
        const slideFiles = Object.keys(zip.files).filter(name =>
            name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
        );

        for (const slideFile of slideFiles) {
            const content = await zip.files[slideFile].async('string');
            // Extract text from XML tags <a:t>text</a:t>
            const textMatches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
            if (textMatches) {
                const slideText = textMatches
                    .map((match: string) => match.replace(/<a:t[^>]*>|<\/a:t>/g, ''))
                    .join(' ');
                fullText += slideText + '\n\n';
            }
        }

        return fullText.trim();
    } catch (error) {
        console.error('Failed to parse PPTX content:', error);
        return '';
    }
};

/**
 * Splits a long text into smaller chunks based on paragraphs and a maximum character count.
 * @param text The text to split.
 * @param maxCharactersPerChunk The maximum number of characters for each chunk.
 * @returns An array of text chunks.
 */
const chunkText = (text: string, maxCharactersPerChunk: number = 8000): string[] => {
    if (!text) return [];

    // Split by paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
        // If a single paragraph is larger than the max size, it must be split.
        if (paragraph.length > maxCharactersPerChunk) {
            // First, add any existing text in currentChunk as its own chunk.
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = "";
            }

            // Now, split the oversized paragraph.
            let remainingParagraph = paragraph;
            while (remainingParagraph.length > maxCharactersPerChunk) {
                // Find a good split point (sentence or word boundary).
                let splitPos = remainingParagraph.lastIndexOf('.', maxCharactersPerChunk);
                if (splitPos === -1) {
                    splitPos = remainingParagraph.lastIndexOf(' ', maxCharactersPerChunk);
                }
                if (splitPos === -1) { // If no space found, hard cut.
                    splitPos = maxCharactersPerChunk;
                }
                chunks.push(remainingParagraph.substring(0, splitPos + 1).trim());
                remainingParagraph = remainingParagraph.substring(splitPos + 1);
            }
            // The remainder of the paragraph becomes the start of the next chunk.
            currentChunk = remainingParagraph.trim();

        } else if ((currentChunk + "\n\n" + paragraph).length > maxCharactersPerChunk) {
            // Adding the next paragraph would exceed the chunk size. Push the current chunk.
            chunks.push(currentChunk.trim());
            currentChunk = paragraph;
        } else {
            // Add the paragraph to the current chunk.
            currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
        }
    }

    // Add the last remaining chunk
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks.filter(c => c.length > 0);
};

/**
 * Finds the most relevant chunks based on keyword matching with the question.
 * @param chunks Array of text chunks.
 * @param question The user's question.
 * @param maxChunks Maximum number of chunks to return.
 * @returns Array of the most relevant chunks with their scores.
 */
const findRelevantChunks = (chunks: string[], question: string, maxChunks: number = 6): string[] => {
    if (chunks.length <= maxChunks) {
        return chunks;
    }

    // Extract keywords from the question (simple approach: remove common words)
    const commonWords = new Set(['what', 'when', 'where', 'who', 'why', 'how', 'is', 'are', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'as', 'can', 'could', 'would', 'should', 'do', 'does', 'did', 'have', 'has', 'had', 'be', 'been', 'being', 'was', 'were']);
    const questionWords = question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.has(word));

    // Score each chunk based on keyword matches
    const scoredChunks = chunks.map((chunk, index) => {
        const chunkLower = chunk.toLowerCase();
        let score = 0;

        // Count keyword occurrences
        for (const word of questionWords) {
            const regex = new RegExp(word, 'gi');
            const matches = chunkLower.match(regex);
            if (matches) {
                score += matches.length * 10;
            }
        }

        // Bonus for chunks near the beginning (often contain introductory/key information)
        if (index < 3) {
            score += (3 - index) * 5;
        }

        return { chunk, score, index };
    });

    // Sort by score (descending) and take top chunks
    scoredChunks.sort((a, b) => b.score - a.score);

    // Return the top chunks, but keep them in original document order for context
    const topChunks = scoredChunks.slice(0, maxChunks);
    topChunks.sort((a, b) => a.index - b.index);

    return topChunks.map(item => item.chunk);
};

// Helper function to format chat history for the summary prompt
const formatChatHistory = (messages: ChatMessage[]): string => {
    return messages
        .filter(msg => !msg.isTyping && !msg.text.toLowerCase().includes('summarize')) // Exclude typing indicators and summary requests
        .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`)
        .join('\n');
};

export const getAiSummary = async (
    type: 'chat' | 'document',
    content: ChatMessage[] | StudyFile
): Promise<{ blocks: ContentBlock[] }> => {
    // All AI summary generation is now handled via backend API
    // to avoid browser-side API key exposure
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

    try {
        const headers = await getAuthHeaders();

        if (type === 'chat') {
            const chatMessageArray = content as ChatMessage[];
            const chatHistory = formatChatHistory(chatMessageArray);
            if (!chatHistory) {
                return { blocks: [{ type: 'text', value: "There is no chat history to summarize." }] };
            }

            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    text: "Summarize our chat conversation above. Focus on key questions and main points. Provide summary in markdown format.",
                    model: "gemini",
                    level_up_mode: false,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    blocks: data.blocks || [{ type: 'text', value: "No summary generated." }],
                    suggestions: data.suggestions || [],
                };
            } else {
                throw new Error("Backend API failed");
            }
        } else {
            // type === 'document'
            const file = content as StudyFile;
            let textContent: string | null = null;

            // For text-based files, extract from base64 (client-side parsing is OK for display,
            # but the actual AI summary goes through backend)
            if (file.type === 'TXT' || file.type === 'MD' || file.type === 'RTF') {
                textContent = file.content ? decodeBase64(file.content) : null;
            } else {
                // For PDF/DOCX/PPTX, we extract text client-side for the summary request,
                # but note: in production, the backend should handle full extraction
                switch (file.type) {
                    case 'PDF': textContent = file.content ? await parsePdfContent(file.content) : null; break;
                    case 'DOCX': textContent = file.content ? await parseDocxContent(file.content) : null; break;
                    case 'PPTX': textContent = file.content ? await parsePptxContent(file.content) : null; break;
                    default: break;
                }
            }

            if (!textContent || !textContent.trim()) {
                return { blocks: [{ type: 'text', value: `Sorry, I could not read any content from the document "${file.name}" to summarize.` }] };
            }

            // Truncate if very large (client-side preprocessing for the API request)
            const MAX_SUMMARY_CHARS = 50000;
            if (textContent.length > MAX_SUMMARY_CHARS) {
                console.warn(`Document ${file.name} is very large (${textContent.length} chars). Using first ${MAX_SUMMARY_CHARS} characters for summary.`);

                const chunkSize = Math.floor(MAX_SUMMARY_CHARS / 3);
                const beginning = textContent.substring(0, chunkSize);
                const middleStart = Math.floor((textContent.length - chunkSize) / 2);
                const middle = textContent.substring(middleStart, middleStart + chunkSize);
                const end = textContent.substring(textContent.length - chunkSize);

                textContent = `${beginning}\n\n[... content omitted for brevity ...]\n\n${middle}\n\n[... content omitted for brevity ...]\n\n${end}`;
            }

            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    text: `Summarize the following document. Extract key topics, main arguments, and important conclusions. Structure using Markdown with headings, subheadings, and bullet points. Document: ${file.name}\n\n${textContent}`,
                    model: "gemini",
                    level_up_mode: false,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    blocks: data.blocks || [{ type: 'text', value: "No summary generated." }],
                    suggestions: data.suggestions || [],
                };
            } else {
                throw new Error("Backend API failed");
            }
        }
    } catch (error: any) {
        console.error("Error getting AI summary:", error);
        return { blocks: [{ type: 'text', value: "Sorry, I encountered an error while trying to generate the summary." }] };
    }
};


export const getAiResponse = async (
    question: string,
    contextFiles: StudyFile[],
    performWebSearch: boolean,
    selectedModel: string = 'gemini',  // ← Model selection (gemini/grok)
    levelUpMode: boolean = false  // ← NEW: Level Up+ mode
): Promise<{ 
    blocks: ContentBlock[], 
    suggestions: { displayText: string; query: string }[], 
    sources: string[],
    metadata?: {
        context_quality?: number;
        context_retrieved?: boolean;
        grounded?: boolean;
    }
}> => {
    // Check if backend API is available
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

    try {
        // Try to use backend API first
        const headers = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                text: question,
                use_web_search: performWebSearch,
                model: selectedModel,  // ← Send model to backend
                level_up_mode: levelUpMode  // ← NEW: Send Level Up+ mode
            })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                blocks: data.blocks || [],
                suggestions: data.suggestions || [],
                sources: data.sources || [],
                metadata: data.metadata || {} // Include context quality and other metadata
            };
        } else {
            // Parse error details from backend
            let errorInfo;
            try {
                errorInfo = await response.json();
            } catch {
                errorInfo = { message: `HTTP ${response.status}: ${response.statusText}` };
            }

            // Check if it's a structured error response
            if (errorInfo?.detail && typeof errorInfo.detail === 'object') {
                const detail = errorInfo.detail;
                const errorType = detail.error || 'unknown';
                const suggestion = detail.suggestion || 'Please try again.';
                const retryAfter = detail.retry_after;

                console.error(`⚠️ Backend API error (${errorType}):`, detail.message);

                // Throw a structured error that the frontend can handle
                const error = new Error(suggestion);
                (error as any).errorType = errorType;
                (error as any).retryAfter = retryAfter;
                (error as any).originalMessage = detail.message;
                throw error;
            } else {
                // Fallback for non-structured errors
                console.warn('⚠️  Backend API failed:', errorInfo);
                throw new Error(errorInfo?.message || errorInfo?.detail || 'Backend API failed');
            }
        }
    } catch (error: any) {
        // Check if it's a structured error we threw (not a network error)
        if (error.errorType) {
            // Re-throw structured errors for proper handling in ChatWindow
            throw error;
        }
        // For network errors, fall back to frontend processing
        console.warn('⚠️  Backend API not available, using frontend fallback:', error);
    }

    // Frontend AI fallback intentionally removed.
    // This uses the old text-based approach
    // Frontend AI fallback intentionally removed.
    // All AI calls are routed through authenticated backend endpoints
    // to prevent browser-side API key exposure. If the backend is unavailable,
    # the user should try again later or check their connection.
    // Frontend calls using browser-owned API keys (VITE_API_KEY) are
    # intentionally disabled. The backend (FastAPI) handles all provider calls
    # using secret keys stored server-side.

    throw new Error("Frontend AI fallback disabled. All AI calls must go through the authenticated backend endpoint. Please try again or check your connection.");

/**
 * Generate flashcards from document content using Gemini AI
 * @param documentContent The text content to generate flashcards from
 * @param count Number of flashcards to generate
 * @returns Array of flashcard data with front, back, and tags
 */
export const generateFlashcardsFromContent = async (
    documentContent: string,
    count: number = 10
): Promise<Array<{ front: string; back: string; tags: string[] }>> => {
    if (!API_KEY || API_KEY === 'placeholder-key') {
        throw new Error('API key not configured. Please set VITE_API_KEY in your .env file.');
    }

    const prompt = `You are a study assistant helping students learn. Generate ${count} high-quality flashcards from the following document content.

**Document Content:**
${documentContent}

**Instructions:**
1. Create exactly ${count} flashcards covering the most important concepts
2. Each flashcard should have:
   - Front: A clear, concise question or prompt
   - Back: A comprehensive answer with explanation
3. Vary difficulty levels (some easy recall, some deeper understanding)
4. Focus on key concepts, definitions, processes, and relationships
5. Make questions specific and unambiguous

**Math Formatting:**
If your flashcards contain mathematical expressions, wrap them in tags with proper LaTeX:
- Inline math: <m>\\frac{x^{2}}{2}</m>
- Block equations: <mb>\\int_{0}^{1} x^{2} \\, dx = \\frac{1}{3}</mb>
- Use \\frac{}{} for fractions, \\sqrt{} for roots, ^{} for exponents

**Format your response as a JSON array:**
[
  {
    "front": "Question or prompt text",
    "back": "Answer with explanation",
    "tags": ["concept1", "concept2"]
  }
]

Return ONLY the JSON array, no additional text or markdown code blocks.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        const responseText = response.text || '';
        let jsonText = responseText.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7);
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith('```')) {
            jsonText = jsonText.slice(0, -3);
        }

        const flashcardData = JSON.parse(jsonText.trim());

        if (!Array.isArray(flashcardData)) {
            throw new Error('Invalid response format from AI');
        }

        return flashcardData.map((data: any) => ({
            front: data.front || '',
            back: data.back || '',
            tags: data.tags || [],
        }));
    } catch (error) {
        console.error('Error generating flashcards:', error);
        throw new Error('Failed to generate flashcards. The AI response may have been in an unexpected format.');
    }
};
