



export interface User {
  name: string;
  email: string;
}

export interface StudyFile {
  id: string;
  name: string;
  type: 'PDF' | 'TXT' | 'DOCX' | 'MD' | 'RTF' | 'PPTX';
  size: number; // in bytes
  content: string; // Base64 content for simplicity in this MVP
}

export interface ContentBlock {
  type: 'text' | 'math' | 'code';
  value: string;
  language?: string; // For code blocks
  filename?: string; // Optional filename for code blocks
}

export interface ChatMessage {
  id: string;
  text: string; // Deprecated: use blocks instead
  blocks?: ContentBlock[]; // NEW: Structured content blocks
  sender: 'user' | 'ai';
  timestamp: number;
  isTyping?: boolean;
  followUpSuggestions?: {
    displayText: string;
    query: string;
  }[];
  sources?: string[];
}

export enum AiModel {
  GEMINI_FLASH = 'gemini-flash',
  GEMINI_PRO = 'gemini-pro',
  GEMINI_2_0_FLASH_EXP = 'gemini-2.0-flash-exp',
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  GEMINI_2_5_PRO = 'gemini-2.5-pro',
  GEMINI_3_PRO = 'gemini-3-pro',
  GROK = 'grok',
  GPT4ALL = 'gpt4all',
  LLAMA2 = 'llama2',
}
