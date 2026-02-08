import { useState, useRef, useEffect, useLayoutEffect, useCallback, useContext, FC } from 'react';
import type { AiModel, ChatMessage, StudyFile } from '../types';
import SendIcon from './icons/SendIcon';
import SparklesIcon from './icons/SparklesIcon';
import { getAiResponse, getAiSummary } from '../services/geminiService';
import AIAvatarIcon from './icons/AIAvatarIcon';
import AiMessageRenderer from './AiMessageRenderer';
import SearchIcon from './icons/SearchIcon';
import CloseIcon from './icons/CloseIcon';
import SummarizeIcon from './icons/SummarizeIcon';
import DocumentIcon from './icons/DocumentIcon';
import FileIcon from './FileIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopCircleIcon from './icons/StopCircleIcon';
import ToggleSwitch from './ToggleSwitch';
import { ThemeContext } from '../contexts/ThemeContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeCanvas from './CodeCanvas';
import StudyToolsBar from './StudyToolsBar';
import ChatInputArea from './ChatInputArea';

interface ChatWindowProps {
  files: StudyFile[];
  model: AiModel;
  onModelChange: (model: AiModel) => void;
  levelUpEnabled: boolean;
  onToggleLevelUp: (enabled: boolean) => void;
  pendingQuestion?: string;
  onQuestionSent?: () => void;
  onQuizClick?: () => void;
  onFlashcardsClick?: () => void;
}

// Type definitions for the Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

const MAX_INPUT_LENGTH = 2000;

const WelcomeState: FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
    {/* Logo Icon */}
    <div className="inline-flex p-4 rounded-full mb-6" style={{ 
      background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.15) 0%, rgba(139, 147, 212, 0.15) 100%)',
      backdropFilter: 'blur(8px)'
    }}>
      <AIAvatarIcon className="h-10 w-10" />
    </div>
    
    {/* Heading */}
    <h2 className="text-2xl font-semibold mb-3" style={{ 
      color: 'var(--color-text-primary)',
      letterSpacing: '-0.01em' 
    }}>
      Welcome to Acadira AI
    </h2>
    
    {/* Subtext */}
    <p className="text-sm mb-12 max-w-xl leading-relaxed" style={{ 
      color: 'var(--color-text-tertiary)' 
    }}>
      Upload your study materials and ask questions. Get intelligent answers based on your documents.
    </p>
    
    {/* Feature Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4">
      {/* Upload Card */}
      <div className="welcome-feature-card group">
        <div className="inline-flex p-3 rounded-full mb-4 transition-colors" style={{ 
          background: 'var(--color-accent-soft)',
          color: 'rgb(59, 130, 246)'
        }}>
          <svg className="h-6 w-6 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="font-semibold mb-2" style={{ 
          color: 'var(--color-text-primary)',
          fontSize: '0.9375rem'
        }}>
          Upload
        </h3>
        <p className="text-sm leading-relaxed" style={{ 
          color: 'var(--color-text-tertiary)' 
        }}>
          Add your study materials
        </p>
      </div>
      
      {/* Ask Card */}
      <div className="welcome-feature-card group">
        <div className="inline-flex p-3 rounded-full mb-4 transition-colors" style={{ 
          background: 'var(--color-accent-soft)',
          color: 'rgb(59, 130, 246)'
        }}>
          <svg className="h-6 w-6 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h3 className="font-semibold mb-2" style={{ 
          color: 'var(--color-text-primary)',
          fontSize: '0.9375rem'
        }}>
          Ask
        </h3>
        <p className="text-sm leading-relaxed" style={{ 
          color: 'var(--color-text-tertiary)' 
        }}>
          Type your questions
        </p>
      </div>
      
      {/* Learn Card */}
      <div className="welcome-feature-card group">
        <div className="inline-flex p-3 rounded-full mb-4 transition-colors" style={{ 
          background: 'var(--color-accent-soft)',
          color: 'rgb(59, 130, 246)'
        }}>
          <SparklesIcon className="h-6 w-6 transition-colors" />
        </div>
        <h3 className="font-semibold mb-2" style={{ 
          color: 'var(--color-text-primary)',
          fontSize: '0.9375rem'
        }}>
          Learn
        </h3>
        <p className="text-sm leading-relaxed" style={{ 
          color: 'var(--color-text-tertiary)' 
        }}>
          Get AI-powered insights
        </p>
      </div>
    </div>
  </div>
);

const CalmChatWindow: FC<ChatWindowProps> = ({ 
  files, 
  model,
  onModelChange,
  levelUpEnabled,
  onToggleLevelUp,
  pendingQuestion, 
  onQuestionSent,
  onQuizClick,
  onFlashcardsClick
}) => {
  const { theme } = useContext(ThemeContext);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryView, setSummaryView] = useState<'options' | 'selectFile'>('options');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textPrefixRef = useRef('');

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages from localStorage
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('chatHistory');
      if (savedMessages) {
        const parsedMessages: any[] = JSON.parse(savedMessages);
        const migratedMessages: ChatMessage[] = parsedMessages.map(msg => {
          let newMsg = { ...msg };
          // @ts-ignore
          if (newMsg.followUpSuggestion) {
            // @ts-ignore
            const suggestion = newMsg.followUpSuggestion;
            if (typeof suggestion === 'string') {
              newMsg.followUpSuggestions = [{ displayText: suggestion, query: suggestion }];
            } else if (typeof suggestion === 'object' && suggestion.displayText) {
              newMsg.followUpSuggestions = [suggestion];
            }
            // @ts-ignore
            delete newMsg.followUpSuggestion;
          }
          return newMsg;
        });
        setMessages(migratedMessages);
      }
    } catch (error) {
      console.error("Failed to load chat history", error);
      localStorage.removeItem('chatHistory');
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSpeechSupported(true);
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        const prefix = textPrefixRef.current;
        const separator = prefix.length > 0 && !/\s$/.test(prefix) ? ' ' : '';
        setInput(prefix + separator + transcript);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognitionInstance;
    }
  }, []);

  // Save messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll
  useLayoutEffect(() => {
    if (!searchQuery) {
      scrollToBottom();
    }
  }, [messages, searchQuery]);

  // Clear chat if no files
  useEffect(() => {
    if (files.length === 0) {
      setMessages([]);
      localStorage.removeItem('chatHistory');
    }
  }, [files]);

  // Handle pending question
  useEffect(() => {
    if (pendingQuestion && pendingQuestion.trim() !== '') {
      setInput(pendingQuestion);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      setTimeout(() => {
        handleSend(pendingQuestion);
        onQuestionSent?.();
      }, 100);
    }
  }, [pendingQuestion]);
  
  const handleSend = useCallback(async (messageToSend?: string) => {
    const textToSend = messageToSend || input;
    if (textToSend.trim() === '' || isLoading || textToSend.length > MAX_INPUT_LENGTH) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: textToSend,
      sender: 'user',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    if (!messageToSend) {
      setInput('');
    }
    
    setIsLoading(true);

    const typingIndicator: ChatMessage = {
      id: `ai-typing-${Date.now()}`,
      text: '',
      sender: 'ai',
      isTyping: true,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, typingIndicator]);

    try {
      console.log('📤 [CalmChat] Sending question to AI:', textToSend);
      console.log('🤖 [CalmChat] Using model:', model);
      console.log('🚀 [CalmChat] Level Up+ mode:', levelUpEnabled ? 'ENABLED' : 'disabled');
      const performWebSearch = useWebSearch;
      const { blocks, suggestions: followUpSuggestions, sources, metadata } = await getAiResponse(
        textToSend, 
        files, 
        performWebSearch,
        model,  // ← Pass selected model to API
        levelUpEnabled  // ← NEW: Pass Level Up+ mode to API
      );
      
      console.log('📥 [CalmChat] Received response:', { blocks, followUpSuggestions, sources, metadata });
      
      // Log context quality information
      if (metadata?.context_quality !== undefined) {
        const quality = metadata.context_quality;
        if (quality >= 0.7) {
          console.log('✅ High quality context retrieved:', quality.toFixed(2));
        } else if (quality >= 0.3) {
          console.log('⚠️ Medium quality context retrieved:', quality.toFixed(2));
        } else {
          console.warn('❌ Low quality context:', quality.toFixed(2));
        }
      }
      
      if (!blocks || blocks.length === 0) {
        console.warn('⚠️ [CalmChat] Received empty blocks array!');
      }
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: '', // Legacy field, kept for compatibility
        blocks: blocks,
        sender: 'ai',
        timestamp: Date.now(),
        followUpSuggestions,
        sources,
        metadata, // Include metadata for potential UI display
      };

      setMessages(prev => prev.filter(m => !m.isTyping).concat(aiMessage));
    } catch (error) {
      console.error("Failed to get AI response", error);
      const errorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        blocks: [{ type: 'text', value: "I'm having trouble connecting right now. Please try again in a moment." }],
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => prev.filter(m => !m.isTyping).concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, files, useWebSearch]);

  const handleRequestSummary = useCallback(async (type: 'chat' | 'document', file?: StudyFile) => {
    setIsSummaryModalOpen(false);
    
    let userMessageText = '';
    let contentToSummarize: ChatMessage[] | StudyFile;

    if (type === 'chat') {
      userMessageText = "Please summarize our conversation.";
      contentToSummarize = messages;
    } else if (file) {
      userMessageText = `Please summarize the document: "${file.name}"`;
      contentToSummarize = file;
    } else {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      sender: 'user',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const typingIndicator: ChatMessage = {
      id: `ai-typing-${Date.now()}`,
      text: '',
      sender: 'ai',
      isTyping: true,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, typingIndicator]);

    try {
      const { blocks } = await getAiSummary(type, contentToSummarize);
      
      const aiMessage: ChatMessage = {
        id: `ai-summary-${Date.now()}`,
        text: '', // Legacy field
        blocks: blocks,
        sender: 'ai',
        timestamp: Date.now(),
      };

      setMessages(prev => prev.filter(m => !m.isTyping).concat(aiMessage));
    } catch (error) {
      console.error("Failed to get AI summary", error);
      const errorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        text: "Sorry, I couldn't generate the summary. Please try again.",
        blocks: [{ type: 'text', value: "Sorry, I couldn't generate the summary. Please try again." }],
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => prev.filter(m => !m.isTyping).concat(errorMessage));
    } finally {
      setIsLoading(false);
      setSummaryView('options');
    }
  }, [messages]);

  const handleToggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      textPrefixRef.current = input;
      recognition.start();
      setIsListening(true);
    }
  }, [isListening, input]);
  
  const isOverLimit = input.length > MAX_INPUT_LENGTH;
  const isApproachingLimit = !isOverLimit && input.length >= MAX_INPUT_LENGTH * 0.9;

  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const code = String(children).replace(/\n$/, '');
      
      // Use CodeCanvas for block code
      if (!inline && match) {
        return (
          <CodeCanvas 
            code={code}
            language={match[1]}
          />
        );
      }
      
      // Use inline code for inline snippets
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    li({ node, children, ...props }: any) {
      // Add better spacing for list items containing math
      return (
        <li className="my-2 leading-relaxed" {...props}>
          {children}
        </li>
      );
    },
    ul({ node, children, ...props }: any) {
      // Add spacing around unordered lists
      return (
        <ul className="space-y-1 my-3" {...props}>
          {children}
        </ul>
      );
    },
    ol({ node, children, ...props }: any) {
      // Add spacing around ordered lists
      return (
        <ol className="space-y-1 my-3" {...props}>
          {children}
        </ol>
      );
    },
  };

  const placeholderText = files.length > 0
    ? useWebSearch
      ? "Ask anything (web search enabled)..."
      : "Ask anything from your uploaded material — I'll find it for you 📘"
    : "Upload a document to start chatting";

  const filteredMessages = searchQuery.trim() 
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="chat-container">
      {/* Study Tools Bar */}
      <StudyToolsBar
        onQuizClick={() => onQuizClick?.()}
        onFlashcardsClick={() => onFlashcardsClick?.()}
        onMindMapClick={() => {/* TODO */}}
        onTimelineClick={() => {/* TODO */}}
        onSearchClick={() => {/* TODO */}}
        disabled={files.length === 0}
      />
      
      {/* Search Bar */}
      {messages.length > 0 && (
        <div className="relative px-6">
          <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversation..."
            className="w-full chat-input py-3 pl-11 pr-12 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-10 flex items-center button-icon"
              aria-label="Clear search"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef} 
        className="flex-grow overflow-y-auto space-y-6"
        style={{ 
          maskImage: 'linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)'
        }}
      >
        {filteredMessages.length === 0 && files.length === 0 ? (
          <WelcomeState />
        ) : filteredMessages.length === 0 && searchQuery ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              No messages found for "<strong>{searchQuery}</strong>"
            </p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Ask anything from your uploaded material — I'll find it for you 📘
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div 
              key={msg.id}
              className={`chat-message ${msg.sender === 'user' ? 'chat-message-user' : ''}`}
              style={{ animationDelay: '0ms' }}
            >
              {msg.sender === 'ai' && (
                <div className="chat-avatar">
                  <AIAvatarIcon className="h-5 w-5" />
                </div>
              )}
              <div className={`flex flex-col gap-3 ${msg.sender === 'ai' ? 'flex-1 min-w-0' : ''}`}>
                <div className={`chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                  {msg.isTyping ? (
                    <div className="flex items-center space-x-2 py-1">
                      <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-typing-bounce"></span>
                      <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-typing-bounce [animation-delay:0.2s]"></span>
                      <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-typing-bounce [animation-delay:0.4s]"></span>
                    </div>
                  ) : msg.sender === 'ai' ? (
                    <div className="markdown-content">
                      {msg.blocks && msg.blocks.length > 0 ? (
                        <AiMessageRenderer blocks={msg.blocks} />
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No response generated</p>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
                
                {!msg.isTyping && msg.timestamp && (
                  <p className={`text-xs text-gray-400 dark:text-gray-500 ${msg.sender === 'user' ? 'text-right pr-2' : 'px-2'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}

                {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && !isLoading && (
                  <div className="px-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source, i) => {
                        const sourceTitle = typeof source === 'string' ? source : source.title;
                        const sourcePage = typeof source === 'string' ? undefined : source.page;
                        const sourceFile = files.find(f => f.name === sourceTitle);
                        const displayText = sourcePage ? `${sourceTitle} (p. ${sourcePage})` : sourceTitle;
                        return (
                          <div
                            key={i}
                            className="flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white/60 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/40 shadow-sm"
                            title={displayText}
                          >
                            {sourceFile && <FileIcon type={sourceFile.type} className="h-3.5 w-3.5 mr-1.5" />}
                            <span className="truncate">{displayText}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {msg.sender === 'ai' && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && !isLoading && (
                  <div className="flex flex-wrap gap-2 px-2">
                    {msg.followUpSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(suggestion.query)}
                        className="button-ghost text-xs"
                      >
                        {suggestion.displayText}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInputArea
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        isLoading={isLoading}
        disabled={files.length === 0 || isOverLimit}
        placeholder={placeholderText}
        selectedModel={model}
        onModelChange={onModelChange}
        levelUpEnabled={levelUpEnabled}
        onToggleLevelUp={onToggleLevelUp}
        selectedFiles={files}
        useWebSearch={useWebSearch}
        onToggleWebSearch={setUseWebSearch}
        textareaRef={textareaRef}
      />

      {/* Summary Modal */}
      {isSummaryModalOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-xl flex items-center justify-center z-[100] animate-fade-in"
          onClick={() => {
            setIsSummaryModalOpen(false);
            setSummaryView('options');
          }}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="relative glass-card max-w-md w-full mx-4 p-8 animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setIsSummaryModalOpen(false);
                setSummaryView('options');
              }}
              className="absolute top-5 right-5 button-icon"
              aria-label="Close summary options"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            
            {summaryView === 'options' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3" style={{ letterSpacing: '-0.01em' }}>
                  Generate Summary
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  What would you like to summarize?
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => handleRequestSummary('chat')}
                    disabled={messages.filter(m => !m.isTyping).length === 0}
                    className="w-full text-left flex items-center p-5 rounded-2xl transition-all hover:bg-white/90 dark:hover:bg-gray-800/60 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200/50 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/40"
                  >
                    <div className="p-3 rounded-xl mr-4 bg-purple-100/60 dark:bg-purple-900/20">
                      <SummarizeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100 mb-0.5">Chat History</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Summarize the current conversation</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSummaryView('selectFile')}
                    disabled={files.length === 0}
                    className="w-full text-left flex items-center p-5 rounded-2xl transition-all hover:bg-white/90 dark:hover:bg-gray-800/60 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200/50 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/40"
                  >
                    <div className="p-3 rounded-xl mr-4 bg-blue-100/60 dark:bg-blue-900/20">
                      <DocumentIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100 mb-0.5">A Document</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Select one of your uploaded files</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {summaryView === 'selectFile' && (
              <div>
                <button 
                  onClick={() => setSummaryView('options')} 
                  className="button-ghost text-sm mb-5"
                >
                  ← Back to options
                </button>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-5" style={{ letterSpacing: '-0.01em' }}>
                  Select a Document
                </h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {files.map(file => (
                    <button
                      key={file.id}
                      onClick={() => handleRequestSummary('document', file)}
                      className="w-full text-left flex items-center p-4 rounded-xl transition-all hover:bg-white/90 dark:hover:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/40"
                    >
                      <FileIcon type={file.type} className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="font-medium text-sm text-gray-700 dark:text-gray-200 truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalmChatWindow;
