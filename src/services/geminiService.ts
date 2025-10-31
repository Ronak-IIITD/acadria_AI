import { GoogleGenAI } from "@google/genai";
import type { StudyFile, ChatMessage } from '../types';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

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
const chunkText = (text: string, maxCharactersPerChunk: number = 2000): string[] => {
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
): Promise<{ text: string }> => {
    if (!process.env.API_KEY || process.env.API_KEY === 'placeholder-key') {
        return Promise.resolve({ 
            text: "This is a mock summary as the API key is not configured."
        });
    }

    try {
        let prompt = '';
        let summaryTitle = '### Summary';

        if (type === 'chat') {
            const chatHistory = formatChatHistory(content as ChatMessage[]);
            if (!chatHistory) {
                return { text: "There is no chat history to summarize." };
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
                return { text: `Sorry, I could not read any content from the document "${file.name}" to summarize.` };
            }

            prompt = `
                You are a helpful assistant. Your task is to provide a comprehensive summary of the following document. 
                Extract the key topics, main arguments, and important conclusions. 
                Structure the summary using Markdown with headings, subheadings, and bullet points for clarity.

                Document Name: ${file.name}
                ---
                Document Content:
                ${textContent}
                ---

                Summary of ${file.name}:
            `;
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const summaryText = `${summaryTitle}\n\n${response.text}`;

        return { text: summaryText };

    } catch (error) {
        console.error("Error getting AI summary:", error);
        return { text: "Sorry, I encountered an error while trying to generate the summary." };
    }
};


export const getAiResponse = async (
    question: string, 
    contextFiles: StudyFile[], 
    performWebSearch: boolean
): Promise<{ text: string, suggestions: { displayText: string; query: string }[], sources: string[] }> => {
    if (!process.env.API_KEY || process.env.API_KEY === 'placeholder-key') {
        return Promise.resolve({ 
            text: "This is a mock response as the API key is not configured. Please set the API_KEY environment variable to get real AI-powered answers.",
            suggestions: [],
            sources: [],
        });
    }
    
    try {
        const contentChunks: string[] = [];
        const unreadableFiles: string[] = [];

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
                const chunks = chunkText(textContent);
                if (chunks.length > 0) {
                    chunks.forEach((chunk, index) => {
                        contentChunks.push(`### Document: ${file.name} (Part ${index + 1} of ${chunks.length}) ###\n\n${chunk}`);
                    });
                } else { unreadableFiles.push(file.name); }
            } else { unreadableFiles.push(file.name); }
        }

        if (contentChunks.length === 0 && contextFiles.length > 0 && !performWebSearch) {
            const message = `Sorry, I could not read the content from the uploaded documents: ${unreadableFiles.join(', ')}. Please try other files. Currently, I can process .txt, .pdf, and .docx files.`;
            return { text: message, suggestions: [], sources: [] };
        }

        const context = contentChunks.join('\n\n---\n\n');
        
        let prompt: string;
        const modelConfig: { model: string, contents: string, config?: any } = {
            model: 'gemini-2.5-flash',
            contents: '',
        };

        if (performWebSearch) {
            prompt = `
                You are StudySync AI, a helpful and versatile assistant for students.
                **Instructions:**
                1. You have been asked to perform a web search to answer the user's question.
                2. Use the provided search results to formulate a comprehensive answer. You MUST cite your web sources using numbered annotations like [1], [2], etc., directly in the text where the information is used. These numbers will correspond to the list of sources appended to your answer.
                3. If "Provided Context from Documents" is available, you may use it for supplementary information, but prioritize web search results. If you use information from a document, you MUST cite it by its full name (e.g., "(from 'My_Lecture_Notes.pdf')").
                4. Format your answers clearly using Markdown (e.g., lists, bolding, italics) for better readability.
                5. For mathematical equations and formulas, use LaTeX syntax. Use $$...$$ for block-level equations and $...$ for inline equations.

                **After providing your answer, suggest up to 3 relevant follow-up questions the user might have. Enclose these suggestions in a special block like this, with each suggestion on a new line:**
                <SUGGESTIONS>
                What are the implications of this?
                How does this compare to [alternative topic]?
                Where can I find more detailed information?
                </SUGGESTIONS>

                **Provided Context from Documents:**
                ${context || "No documents provided."}
                
                **Question:** ${question}
                
                **Answer (based on web search):**
            `;
            modelConfig.config = {
                tools: [{ googleSearch: {} }],
            };
        } else {
            prompt = `
                You are a highly specialized AI assistant for StudySync. Your SOLE purpose is to answer questions based *only* on the text provided in the "Provided Context" section. You are a tool for information retrieval from a closed set of documents.

                **ABSOLUTE RULES:**
                1.  You MUST base your entire answer **exclusively** on the information found within the "Provided Context".
                2.  If the "Provided Context" does not contain the information needed to answer the question, you MUST respond with the exact phrase: "I could not find an answer to your question in the uploaded documents."
                3.  **DO NOT** under any circumstances use any external knowledge, information from the internet, personal opinions, or make inferences that are not directly supported by the text. It is a severe violation of your instructions to invent information or answer from memory.
                4.  When you find an answer, you MUST cite the source document(s) by name within your response (e.g., "According to 'Biology_Chapter_5.pdf', ..."). The document names are provided in the context headings. This is crucial for user trust and transparency.
                5.  Format your answers clearly using Markdown. For math, use LaTeX syntax ($...$ for inline, $$...$$ for block).

                **After providing your answer, list the primary source documents you used in a special block like this, with each source on a new line:**
                <SOURCES>
                Document_Name_1.pdf
                Document_Name_2.txt
                </SOURCES>

                **After providing your answer, suggest up to 3 relevant follow-up questions the user might have. Enclose these suggestions in a special block like this, with each suggestion on a new line:**
                <SUGGESTIONS>
                What is the next step in the process?
                Can you explain that in simpler terms?
                How does this relate to Topic X?
                </SUGGESTIONS>

                **Provided Context:**
                ${context || "No documents provided. You must inform the user that they need to upload documents before you can answer any questions."}
                
                **User's Question:** ${question}
                
                **Answer (based ONLY on the Provided Context):**
            `;
        }

        modelConfig.contents = prompt;

        const response = await ai.models.generateContent(modelConfig);
        
        const rawResponseText = response.text || '';
        let aiResponseText: string = rawResponseText;
        let suggestions: { displayText: string; query: string }[] = [];
        let sources: string[] = [];

        const suggestionBlockRegex = /<SUGGESTIONS>([\s\S]*?)<\/SUGGESTIONS>/;
        const suggestionMatch = aiResponseText.match(suggestionBlockRegex);

        if (suggestionMatch && suggestionMatch[1]) {
            aiResponseText = aiResponseText.replace(suggestionBlockRegex, '').trim();
            suggestions = suggestionMatch[1]
                .split('\n')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)
                .map((s: string) => ({ displayText: s, query: s }));
        }
        
        const sourceBlockRegex = /<SOURCES>([\s\S]*?)<\/SOURCES>/;
        const sourceMatch = aiResponseText.match(sourceBlockRegex);
        
        if (!performWebSearch && sourceMatch && sourceMatch[1]) {
            aiResponseText = aiResponseText.replace(sourceBlockRegex, '').trim();
            sources = sourceMatch[1]
                .split('\n')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
        }


        if (performWebSearch) {
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            const searchSources = groundingMetadata?.groundingChunks
                ?.map(chunk => chunk.web)
                .filter((web): web is { uri: string; title?: string } => 
                    typeof web === 'object' && web !== null && typeof (web as any).uri === 'string'
                );
            
            if (searchSources && searchSources.length > 0) {
                const uniqueSources = Array.from(new Map(searchSources.map(s => [s.uri, s])).values());
                const sourcesMarkdown = `\n\n---\n**Sources:**\n` + uniqueSources.map((source: any, index: number) => `${index + 1}. [${source.title || source.uri}](${source.uri})`).join('\n');
                aiResponseText += sourcesMarkdown;
            }
        }
        
        if (unreadableFiles.length > 0) {
            const unreadableNote = `\n\n---\n*Note: The content of the following file(s) could not be read and was not included in the context: ${unreadableFiles.join(', ')}.*`;
            aiResponseText += unreadableNote;
        }

        return { text: aiResponseText, suggestions, sources };

    } catch (error) {
        console.error("Error getting AI response:", error);
        return { text: "Sorry, I encountered an error while trying to answer your question.", suggestions: [], sources: [] };
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
            model: 'gemini-2.5-flash',
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