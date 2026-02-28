import { GoogleGenAI } from "@google/genai";
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

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    console.warn("⚠️ VITE_API_KEY not set in .env file. AI features will not work. Get your key at https://makersuite.google.com/app/apikey");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || 'placeholder-key' });

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
    if (!API_KEY || API_KEY === 'placeholder-key') {
        return Promise.resolve({
            blocks: [{ type: 'text', value: "This is a mock summary as the API key is not configured." }]
        });
    }

    try {
        let prompt = '';
        let summaryTitle = '### Summary';

        if (type === 'chat') {
            const chatHistory = formatChatHistory(content as ChatMessage[]);
            if (!chatHistory) {
                return { blocks: [{ type: 'text', value: "There is no chat history to summarize." }] };
            }
            summaryTitle = '### Summary of Chat History';
            prompt = `
                You are a helpful assistant. Your task is to summarize the provided chat conversation between a "user" and an "ai". 
                Focus on the key questions asked by the user and the main points of the AI's answers. 
                Do not summarize any user requests for summaries.
                Present the summary in a clear, concise, and well-structured format using Markdown.

                Chat History:
                ---
                ${chatHistory}
                ---

                Summary:
            `;
        } else { // type === 'document'
            const file = content as StudyFile;
            summaryTitle = `### Summary of ${file.name}`;
            let textContent: string | null = null;

            switch (file.type) {
                case 'TXT':
                case 'MD':
                case 'RTF':
                    textContent = file.content ? decodeBase64(file.content) : null;
                    break;
                case 'PDF': textContent = file.content ? await parsePdfContent(file.content) : null; break;
                case 'DOCX': textContent = file.content ? await parseDocxContent(file.content) : null; break;
                case 'PPTX': textContent = file.content ? await parsePptxContent(file.content) : null; break;
            }

            if (!textContent || !textContent.trim()) {
                return { blocks: [{ type: 'text', value: `Sorry, I could not read any content from the document "${file.name}" to summarize.` }] };
            }

            // For large documents, intelligently truncate to fit within context limits
            const MAX_SUMMARY_CHARS = 80000; // ~100k tokens for Gemini 2.5 Flash
            if (textContent.length > MAX_SUMMARY_CHARS) {
                console.warn(`Document ${file.name} is very large (${textContent.length} chars). Using first ${MAX_SUMMARY_CHARS} characters for summary.`);

                // Take content from beginning, middle, and end for a comprehensive summary
                const chunkSize = Math.floor(MAX_SUMMARY_CHARS / 3);
                const beginning = textContent.substring(0, chunkSize);
                const middleStart = Math.floor((textContent.length - chunkSize) / 2);
                const middle = textContent.substring(middleStart, middleStart + chunkSize);
                const end = textContent.substring(textContent.length - chunkSize);

                textContent = `${beginning}\n\n[... content omitted for brevity ...]\n\n${middle}\n\n[... content omitted for brevity ...]\n\n${end}`;
            }

            prompt = `
                You are a helpful assistant. Your task is to provide a comprehensive summary of the following document. 
                Extract the key topics, main arguments, and important conclusions. 
                Structure the summary using Markdown with headings, subheadings, and bullet points for clarity.
                ${textContent.includes('[... content omitted for brevity ...]') ? '\n**Note**: This is a very large document. The summary is based on representative sections from the beginning, middle, and end.' : ''}

                Document Name: ${file.name}
                Document Size: ${textContent.length} characters
                ---
                Document Content:
                ${textContent}
                ---

                Summary of ${file.name}:
            `;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        // Return as structured blocks (plain text summary)
        const summaryText = `${summaryTitle}\n\n${response.text}`;
        return { blocks: [{ type: 'text', value: summaryText }] };

    } catch (error) {
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

    // Fallback to frontend processing (keep existing logic for now)
    // This uses the old text-based approach
    if (!API_KEY || API_KEY === 'placeholder-key') {
        console.error('❌ API KEY NOT CONFIGURED! Set VITE_API_KEY in .env file');
        return Promise.resolve({
            blocks: [
                {
                    type: 'text' as const,
                    value: "⚠️ API key is not configured. Please set VITE_API_KEY in your .env file. Get your key at https://makersuite.google.com/app/apikey"
                }
            ],
            suggestions: [],
            sources: [],
        });
    }

    console.log('🔑 Using API key for frontend fallback (first 10 chars):', API_KEY.substring(0, 10) + '...');

    try {
        const contentChunks: string[] = [];
        const unreadableFiles: string[] = [];
        const MAX_CONTEXT_CHARS = 80000;
        const MAX_CHUNKS_PER_FILE = 6;
        let totalContextSize = 0;

        for (const file of contextFiles) {
            let textContent: string | null = null;
            switch (file.type) {
                case 'TXT':
                case 'MD':
                case 'RTF':
                    textContent = file.content ? decodeBase64(file.content) : null;
                    break;
                case 'PDF': textContent = file.content ? await parsePdfContent(file.content) : null; break;
                case 'DOCX': textContent = file.content ? await parseDocxContent(file.content) : null; break;
                case 'PPTX': textContent = file.content ? await parsePptxContent(file.content) : null; break;
                default: break;
            }

            if (textContent && textContent.trim()) {
                const allChunks = chunkText(textContent);
                if (allChunks.length > 0) {
                    const relevantChunks = findRelevantChunks(allChunks, question, MAX_CHUNKS_PER_FILE);

                    let fileContextAdded = false;
                    for (let i = 0; i < relevantChunks.length; i++) {
                        const chunk = relevantChunks[i];
                        const chunkWithHeader = `### Document: ${file.name} (Part ${i + 1} of ${relevantChunks.length}) ###\n\n${chunk}`;

                        if (totalContextSize + chunkWithHeader.length > MAX_CONTEXT_CHARS) {
                            console.warn(`Context limit reached. Skipping remaining chunks from ${file.name}`);
                            break;
                        }

                        contentChunks.push(chunkWithHeader);
                        totalContextSize += chunkWithHeader.length;
                        fileContextAdded = true;
                    }

                    if (!fileContextAdded) {
                        unreadableFiles.push(file.name);
                    }
                } else {
                    unreadableFiles.push(file.name);
                }
            } else {
                unreadableFiles.push(file.name);
            }
        }

        if (contentChunks.length === 0 && contextFiles.length > 0 && !performWebSearch) {
            const message = `Sorry, I could not read the content from the uploaded documents: ${unreadableFiles.join(', ')}. Please try other files.`;
            return {
                blocks: [{ type: 'text' as const, value: message }],
                suggestions: [],
                sources: []
            };
        }

        const context = contentChunks.join('\n\n---\n\n');

        console.log(`Context size: ${totalContextSize} characters, ${contentChunks.length} chunks from ${contextFiles.length} file(s)`);

        // Use structured JSON prompt with grounding
        const prompt = `You are Acadira AI — a calm, knowledgeable, and helpful academic assistant for students.

**🚨 CRITICAL GROUNDING RULE - YOU MUST FOLLOW THIS:**
You answer questions using ONLY the content provided in the uploaded documents below.
Do NOT hallucinate or invent facts. Do NOT use external knowledge.
If the answer is not found in the context below, you MUST politely say: "I don't have that information in your uploaded notes. Please upload relevant documents or rephrase your question."

You are an assistant that outputs ONLY JSON. ALWAYS return valid JSON (no commentary, no extra text).

**CRITICAL FORMAT REQUIREMENT:**
Return a JSON array of content blocks with this EXACT structure:
[
  {"type":"text", "value":"plain text explanation (no LaTeX)"},
  {"type":"math", "value":"PURE_LATEX_EXPRESSION (no $, no $$, no HTML)"},
  {"type":"code", "value":"code content", "language":"javascript", "filename":"optional.js"}
]

**SUPPORTED BLOCK TYPES:**
1. **text** - Plain text explanations (no LaTeX, no code)
2. **math** - Pure LaTeX mathematical expressions (no delimiters, no HTML)
3. **code** - Code snippets with language specification

**STRICT RULES:**
1. Every math block's value must contain ONLY LaTeX (e.g., \\int_0^1 x^2 \\,dx = \\frac{1}{3}).
2. DO NOT include HTML tags like <mb>, <m>, <div>, or markdown markers in math blocks.
3. DO NOT include backtick fences, dollar signs, or stray asterisks in math values.
4. Code blocks must have "type":"code", "value":"actual code", and "language":"lang_name".
5. Supported languages: javascript, typescript, python, java, cpp, c, csharp, html, css, json, sql, bash, shell, jsx, tsx
6. If there's both explanation and equation, return TWO blocks: first text, then math.
7. DO NOT duplicate content - write each equation or code snippet exactly once.

**GOOD EXAMPLE OUTPUT:**
[
  {"type":"text","value":"Here's how to calculate the integral:"},
  {"type":"math","value":"\\int_0^1 x^2 \\, dx = \\frac{1}{3}"},
  {"type":"text","value":"In JavaScript, you can implement this as:"},
  {"type":"code","value":"function integrate(a, b) {\\n  return Math.pow(b, 3) / 3 - Math.pow(a, 3) / 3;\\n}","language":"javascript"}
]

**BAD EXAMPLES (DO NOT DO THIS):**
[
  {"type":"math","value":"<mb>\\\\int x^2 dx</mb>"},  NO HTML TAGS!
  {"type":"math","value":"$$\\\\int x^2 dx$$"},       NO DOLLAR SIGNS!
  {"type":"text","value":"The answer is \\\\int x^2"} LaTeX must be in math block!
  {"type":"text","value":"backtick-python-newline-code-backtick"}     Code must be in code block!
]

**📚 UPLOADED DOCUMENT CONTEXT (YOUR ONLY SOURCE OF INFORMATION):**
\${context || "⚠️ NO DOCUMENTS PROVIDED - User needs to provide context."}

**Question:** \${question}

**🚨 CRITICAL GROUNDING INSTRUCTIONS - READ CAREFULLY:**
${context ? `- **USE ONLY THE CONTEXT ABOVE:** Base your ENTIRE answer on the document context provided above
- **NEVER USE EXTERNAL KNOWLEDGE:** Do not invent, assume, or recall information not present in the context
- **IF INFORMATION IS MISSING:** If the context does not contain information to answer the question, respond with: "I don't have that specific information in your uploaded documents. Please upload additional materials or rephrase your question."
- **CITE YOUR SOURCES:** Reference specific parts of the documents when answering
- **STAY GROUNDED:** Every statement must be traceable back to the provided context` : `- **NO CONTEXT AVAILABLE:** Respond with: "I don't have any documents to reference. Please upload your study materials so I can help you."`}

**Instructions:**
- **FORMATTING REQUIREMENTS:**
  * Start with a clear heading/topic in bold text (use **heading** format)
  * Follow with a brief explanatory paragraph about the topic
  * Use bullet points (•) for listing key concepts, steps, or features
  * Use sub-bullets (◦ or -) for nested details under main points
  * Structure your response hierarchically: Heading → Description → Main Points → Sub-points
- If the question asks for code examples, use code blocks with proper language specification
- **CRITICAL: If the uploaded document contains code in a specific language (e.g., Java, Python, C++), USE THAT SAME LANGUAGE in your code examples**
- Analyze the document context to determine the programming language being used
- Match the coding style, syntax, and conventions of the language in the documents
- Break down complex topics: use text blocks for explanation, math blocks for equations, code blocks for code
- When providing code, always specify the correct language based on the document context

**EXAMPLE OF GOOD FORMATTING:**
"**Object-Oriented Programming Basics**

Object-oriented programming (OOP) is a programming paradigm based on the concept of objects. This approach helps organize code into reusable components.

**Key Concepts:**
• **Classes and Objects**
  ◦ Classes are blueprints for creating objects
  ◦ Objects are instances of classes
• **Encapsulation**
  ◦ Bundling data and methods together
  ◦ Hiding internal details"

**Answer (output ONLY valid JSON array):**`;

        const modelConfig = {
            model: 'gemini-2.5-flash',
            contents: prompt,
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        const response = await ai.models.generateContent(modelConfig);
        const rawResponseText = response.text || '';

        console.log('🤖 RAW AI OUTPUT:', rawResponseText.substring(0, 500));

        // Try to parse as JSON
        try {
            let jsonText = rawResponseText.trim();

            // Remove markdown code blocks if present
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.slice(7);
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.slice(3);
            }
            if (jsonText.endsWith('```')) {
                jsonText = jsonText.slice(0, -3);
            }

            const parsed = JSON.parse(jsonText.trim());

            if (Array.isArray(parsed)) {
                console.log('✅ Successfully parsed structured JSON with', parsed.length, 'blocks');
                return {
                    blocks: parsed,
                    suggestions: [],
                    sources: []
                };
            } else {
                console.warn('⚠️  Parsed JSON is not an array:', typeof parsed);
            }
        } catch (e) {
            console.warn('⚠️  Failed to parse JSON:', e);
            console.log('Raw text that failed to parse:', rawResponseText);
        }

        // Fallback: convert text to blocks
        console.log('📄 Using fallback: converting text to single text block');
        const textBlock: ContentBlock = {
            type: 'text',
            value: rawResponseText
        };

        return {
            blocks: [textBlock],
            suggestions: [],
            sources: []
        };

    } catch (error) {
        console.error("❌ Error getting AI response:", error);
        return {
            blocks: [
                {
                    type: 'text' as const,
                    value: `Sorry, I encountered an error: ${error instanceof Error ? error.message : String(error)}`
                }
            ],
            suggestions: [],
            sources: []
        };
    }
};

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
