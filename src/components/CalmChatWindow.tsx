import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useContext } from 'react';
import type { AiModel, ChatMessage, StudyFile } from '../types';
import SendIcon from './icons/SendIcon';
import { getAiResponse, getAiSummary } from '../services/geminiService';
import LogoIcon from './icons/LogoIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
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

interface ChatWindowProps {
  files: StudyFile[];
  model: AiModel;
  pendingQuestion?: string;
  onQuestionSent?: () => void;
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

const WelcomeState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16 animate-fade-in">
    <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 shadow-sm">
      <LogoIcon className="h-16 w-16 text-gray-600 dark:text-gray-300" />
    </div>
    <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-4" style={{ letterSpacing: '-0.02em' }}>
      Welcome to StudySync AI
    </h2>
    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
      Upload your study materials to begin. I'll help you learn by answering questions based on your documents.
    </p>
    <div className="mt-12 flex flex-wrap gap-3 justify-center">
      <div className="px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/40 text-sm text-gray-600 dark:text-gray-300 shadow-sm">
        📄 Upload PDFs
      </div>
      <div className="px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/40 text-sm text-gray-600 dark:text-gray-300 shadow-sm">
        💬 Ask Questions
      </div>
      <div className="px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/40 text-sm text-gray-600 dark:text-gray-300 shadow-sm">
        🎯 Get Answers
      </div>
    </div>
  </div>
);

const CalmChatWindow: React.FC<ChatWindowProps> = ({ files, pendingQuestion, onQuestionSent }) => {
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
      const performWebSearch = useWebSearch;
      const { text: aiResponseText, suggestions: followUpSuggestions, sources } = await getAiResponse(textToSend, files, performWebSearch);
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: aiResponseText,
        sender: 'ai',
        timestamp: Date.now(),
        followUpSuggestions,
        sources,
      };

      setMessages(prev => prev.filter(m => !m.isTyping).concat(aiMessage));
    } catch (error) {
      console.error("Failed to get AI response", error);
      const errorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        text: "I'm having trouble connecting right now. Please try again in a moment.",
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
      const { text: summaryText } = await getAiSummary(type, contentToSummarize);
      
      const aiMessage: ChatMessage = {
        id: `ai-summary-${Date.now()}`,
        text: summaryText,
        sender: 'ai',
        timestamp: Date.now(),
      };

      setMessages(prev => prev.filter(m => !m.isTyping).concat(aiMessage));
    } catch (error) {
      console.error("Failed to get AI summary", error);
      const errorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        text: "Sorry, I couldn't generate the summary. Please try again.",
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
      return !inline && match ? (
        <SyntaxHighlighter
          style={theme === 'dark' ? vscDarkPlus : oneLight}
          language={match[1]}
          PreTag="pre"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  const placeholderText = files.length > 0
    ? useWebSearch
      ? "Ask anything (web search enabled)..."
      : "Ask a question about your documents..."
    : "Upload a document to start chatting";

  const filteredMessages = searchQuery.trim() 
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="chat-container">
      {/* Search Bar */}
      {messages.length > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
              className="absolute inset-y-0 right-0 pr-4 flex items-center button-icon"
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
              Start by asking a question about your documents
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
                  <LogoIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
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
                      <ReactMarkdown 
                        components={markdownComponents}
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.text}
                      </ReactMarkdown>
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
                      {msg.sources.map((sourceName, i) => {
                        const sourceFile = files.find(f => f.name === sourceName);
                        return (
                          <div
                            key={i}
                            className="flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white/60 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/40 shadow-sm"
                            title={sourceName}
                          >
                            {sourceFile && <FileIcon type={sourceFile.type} className="h-3.5 w-3.5 mr-1.5" />}
                            <span className="truncate">{sourceName}</span>
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
      <div className="space-y-3">
        <div className="chat-input-wrapper">
          <button
            onClick={() => setIsSummaryModalOpen(true)}
            disabled={isLoading || (messages.length === 0 && files.length === 0)}
            className="absolute left-3 top-1/2 -translate-y-1/2 button-icon"
            aria-label="Request a summary"
          >
            <SummarizeIcon className="h-5 w-5" />
          </button>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={placeholderText}
            className="chat-input min-h-[56px] max-h-[200px] resize-none"
            rows={1}
            disabled={files.length === 0 || isLoading}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSpeechSupported && (
              <button
                onClick={handleToggleListening}
                disabled={isLoading || files.length === 0}
                className="button-icon"
                aria-label={isListening ? "Stop recording" : "Use microphone"}
              >
                {isListening ? (
                  <StopCircleIcon className="h-5 w-5 text-red-400 animate-mic-pulse" />
                ) : (
                  <MicrophoneIcon className="h-5 w-5" />
                )}
              </button>
            )}
            
            <button
              onClick={() => handleSend()}
              disabled={isLoading || input.trim() === '' || files.length === 0 || isOverLimit}
              className="button-primary px-3 py-2"
              aria-label="Send message"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-2">
          <ToggleSwitch
            id="web-search-toggle"
            checked={useWebSearch}
            onChange={setUseWebSearch}
            label="Web Search"
            disabled={files.length === 0 || isLoading}
          />
          <div className="text-xs font-medium">
            <span className={
              isOverLimit 
                ? 'text-red-500 font-bold' 
                : isApproachingLimit 
                  ? 'text-amber-500 font-semibold'
                  : 'text-gray-500 dark:text-gray-400'
            }>
              {input.length} / {MAX_INPUT_LENGTH}
            </span>
          </div>
        </div>
      </div>

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
