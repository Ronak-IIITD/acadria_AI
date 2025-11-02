



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
  type: 'text' | 'math';
  value: string;
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
  GEMINI_FLASH = 'gemini-2.5-flash',
  GPT4ALL = 'GPT4All (Local)',
  LLAMA2 = 'LLaMA 2 (Local)',
}
