import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useContext } from 'react';
import type { AiModel, ChatMessage, StudyFile, ContentBlock } from '../types';
import SendIcon from './icons/SendIcon';
import { getAiResponse, getAiSummary } from '../services/geminiService';
import AIBookIcon from './icons/AIBookIcon';
import AiMessageRenderer from './AiMessageRenderer';
import SearchIcon from './icons/SearchIcon';
import CloseIcon from './icons/CloseIcon';
import SummarizeIcon from './icons/SummarizeIcon';
import DocumentIcon from './icons/DocumentIcon';
import FileIcon from './FileIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopCircleIcon from './icons/StopCircleIcon';
import ToggleSwitch from './ToggleSwitch';
import { ThemeContext } from '../contexts/ThemeContext';


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

const WelcomeMessage: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
        <div className="mb-6 p-5 rounded-full" style={{
            background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.1) 0%, rgba(139, 147, 212, 0.1) 100%)',
            backdropFilter: 'blur(8px)'
        }}>
            <AIBookIcon className="h-12 w-12" style={{ color: 'var(--color-text-primary)' }} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3" style={{ letterSpacing: '-0.01em' }}>
            Welcome to StudySync AI
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md leading-relaxed" style={{ lineHeight: '1.7' }}>
            Upload your study materials on the left, then ask me anything! I'll provide answers based strictly on your documents.
        </p>
    </div>
);

const ChatWindow: React.FC<ChatWindowProps> = ({ files, pendingQuestion, onQuestionSent }) => {
  const { theme } = useContext(ThemeContext);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultIndices, setSearchResultIndices] = useState<number[]>([]);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(-1);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryView, setSummaryView] = useState<'options' | 'selectFile'>('options');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textPrefixRef = useRef('');


  // Scroll to bottom for new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages from localStorage on initial component mount, with migration for old format
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('chatHistory');
      if (savedMessages) {
        const parsedMessages: any[] = JSON.parse(savedMessages);

        // Migration for old formats to the new `followUpSuggestions` array format
        const migratedMessages: ChatMessage[] = parsedMessages.map(msg => {
          let newMsg = { ...msg };
          // @ts-ignore - handle old property
          if (newMsg.followUpSuggestion) {
            // @ts-ignore
            const suggestion = newMsg.followUpSuggestion;
            if (typeof suggestion === 'string') {
              newMsg.followUpSuggestions = [{ displayText: suggestion, query: suggestion }];
            } else if (typeof suggestion === 'object' && suggestion.displayText) {
              newMsg.followUpSuggestions = [suggestion];
            }
            // @ts-ignore
            delete newMsg.followUpSuggestion; // Remove old property
          }
          return newMsg;
        });

        setMessages(migratedMessages);
      }
    } catch (error) {
      console.error("Failed to parse or migrate chat history from localStorage", error);
      localStorage.removeItem('chatHistory'); // Clear corrupted data
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
            const event = { currentTarget: textareaRef.current } as React.FormEvent<HTMLTextAreaElement>;
            handleInputResize(event);
            textareaRef.current.focus(); // Auto-focus the input field after voice input
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognitionInstance;
    } else {
        setIsSpeechSupported(false);
        console.warn('Speech Recognition not supported by this browser.');
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll for new messages, but not when searching
  useLayoutEffect(() => {
    if (!searchQuery) {
      scrollToBottom();
    }
  }, [messages, searchQuery]);

  // Reset chat and clear storage if all files are removed
  useEffect(() => {
    if (files.length === 0) {
        setMessages([]);
        localStorage.removeItem('chatHistory');
    }
  }, [files]);

  // Handle pending question from PDF viewer
  useEffect(() => {
    if (pendingQuestion && pendingQuestion.trim() !== '') {
      setInput(pendingQuestion);
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Auto-resize textarea
        const event = { currentTarget: textareaRef.current } as React.FormEvent<HTMLTextAreaElement>;
        handleInputResize(event);
      }
      // Auto-send the question
      setTimeout(() => {
        handleSend(pendingQuestion);
        onQuestionSent?.();
      }, 100);
    }
  }, [pendingQuestion]);
  
  // Update search results when query or messages change
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResultIndices([]);
      setCurrentSearchResultIndex(-1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = messages.reduce((acc, msg, index) => {
      if (msg.text.toLowerCase().includes(query)) {
        acc.push(index);
      }
      return acc;
    }, [] as number[]);

    setSearchResultIndices(results);
    setCurrentSearchResultIndex(results.length > 0 ? 0 : -1);
  }, [searchQuery, messages]);

  // Scroll to the current search result
  useEffect(() => {
    if (currentSearchResultIndex !== -1 && searchResultIndices.length > 0) {
      const messageIndex = searchResultIndices[currentSearchResultIndex];
      const messageId = messages[messageIndex]?.id;
      if (messageId) {
        const element = messageRefs.current.get(messageId);
        element?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentSearchResultIndex, searchResultIndices, messages]);

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
        // Reset textarea height after sending
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
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

        console.log('📤 Sending question to AI:', textToSend);
        const { blocks, suggestions: followUpSuggestions, sources } = await getAiResponse(textToSend, files, performWebSearch);
        
        console.log('📥 Received response:', { blocks, suggestions: followUpSuggestions, sources });
        
        if (!blocks || blocks.length === 0) {
            console.warn('⚠️  Received empty blocks array!');
        }
        
        const aiMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            text: '', // Keep for backward compatibility
            blocks: blocks, // NEW: Structured blocks
            sender: 'ai',
            timestamp: Date.now(),
            followUpSuggestions,
            sources,
        };

        console.log('💬 Creating AI message:', aiMessage);
        setMessages(prev => prev.filter(m => !m.isTyping).concat(aiMessage));

    } catch (error) {
        console.error("Failed to get AI response", error);
        const errorMessage: ChatMessage = {
            id: `ai-error-${Date.now()}`,
            text: "Sorry, I couldn't connect to the AI. Please try again.",
            sender: 'ai',
            timestamp: Date.now(),
        };
        setMessages(prev => prev.filter(m => !m.isTyping).concat(errorMessage));
    } finally {
        setIsLoading(false);
    }
  }, [input, isLoading, files, useWebSearch]);

  const handleRequestSummary = useCallback(async (type: 'chat' | 'document', file?: StudyFile) => {
    setIsSummaryModalOpen(false); // Close modal
    
    let userMessageText = '';
    let contentToSummarize: ChatMessage[] | StudyFile;

    if (type === 'chat') {
        userMessageText = "Please summarize our conversation.";
        contentToSummarize = messages;
    } else if (file) {
        userMessageText = `Please summarize the document: "${file.name}"`;
        contentToSummarize = file;
    } else {
        return; // Should not happen
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
        setSummaryView('options'); // Reset modal view
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

  const handlePrevSearchResult = () => {
    setCurrentSearchResultIndex(prev => (prev > 0 ? prev - 1 : 0));
  };
  const handleNextSearchResult = () => {
    setCurrentSearchResultIndex(prev => (prev < searchResultIndices.length - 1 ? prev + 1 : prev));
  };
  
  const isOverLimit = input.length > MAX_INPUT_LENGTH;
  const isApproachingLimit = !isOverLimit && input.length >= MAX_INPUT_LENGTH * 0.9;
  
  const charCounterClasses = [
    'transition-colors duration-300',
    isOverLimit 
      ? 'text-red-500 font-bold' 
      : isApproachingLimit 
        ? 'text-amber-500 font-semibold'
        : 'text-gray-500 dark:text-gray-400'
  ].join(' ');

  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  // Removed markdownComponents - no longer needed with AiMessageRenderer

  const placeholderText = files.length > 0
    ? useWebSearch
      ? "Ask anything (web search enabled)..."
      : "Ask a question about your documents..."
    : "Upload a document to start chatting";

  const renderContent = () => {
    if (searchQuery && searchResultIndices.length === 0 && messages.length > 0) {
      return (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                No messages found for "<strong className="font-semibold">{searchQuery}</strong>".
            </p>
        </div>
      );
    }
    if (messages.length > 0) {
      return messages.map((msg, index) => {
        const isSearchResult = searchQuery.trim() !== '' && msg.text.toLowerCase().includes(searchQuery.toLowerCase());
        const isCurrentResult = isSearchResult && searchResultIndices[currentSearchResultIndex] === index;

        const classNames = [
          'flex items-start gap-4',
          'transition-all duration-300 rounded-xl',
          msg.sender === 'user' ? 'justify-end' : '',
          'animate-fade-in-up',
          isCurrentResult
            ? 'bg-purple-100/40 dark:bg-purple-900/20 ring-2 ring-purple-300/50 dark:ring-purple-500/30 p-3 -m-3'
            : '',
          isSearchResult && !isCurrentResult
            ? 'bg-yellow-50/50 dark:bg-yellow-900/10 p-3 -m-3'
            : '',
        ].join(' ');

        return (
          <div 
            key={msg.id}
            ref={el => {
              if (el) {
                messageRefs.current.set(msg.id, el);
              } else {
                messageRefs.current.delete(msg.id);
              }
            }}
            className={classNames}
          >
            {msg.sender === 'ai' && (
              <div className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center shadow-sm border" style={{
                background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.1) 0%, rgba(139, 147, 212, 0.1) 100%)',
                borderColor: 'var(--color-border-soft)'
              }}>
                  <AIBookIcon className="h-5 w-5" style={{ color: 'var(--color-text-primary)' }} />
              </div>
            )}
            <div className={`flex flex-col max-w-xs md:max-w-md lg:max-w-2xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-3.5 shadow-sm ${
                    msg.sender === 'user'
                    ? 'bg-gradient-to-br from-purple-400/90 to-blue-400/90 dark:from-purple-500/80 dark:to-blue-500/80 text-white rounded-3xl rounded-br-lg'
                    : 'bg-white/70 dark:bg-gray-800/40 text-gray-700 dark:text-gray-200 border border-gray-200/50 dark:border-gray-700/30 rounded-3xl rounded-bl-lg'
                }`} style={{ backdropFilter: 'blur(8px)' }}>
                    {msg.isTyping ? (
                    <div className="flex items-center space-x-2 p-1">
                        <span className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-typing-bounce"></span>
                        <span className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-typing-bounce [animation-delay:0.2s]"></span>
                        <span className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-typing-bounce [animation-delay:0.4s]"></span>
                    </div>
                    ) : (
                    msg.sender === 'ai' ? (
                        msg.blocks && msg.blocks.length > 0 ? (
                            <AiMessageRenderer blocks={msg.blocks} />
                        ) : (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        )
                    ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    )
                    )}
                </div>
                {!msg.isTyping && msg.timestamp && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                )}
                {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && !isLoading && (
                    <div className="mt-5 pt-4 border-t border-gray-200/60 dark:border-gray-700/40 w-full">
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">Sources:</h4>
                        <div className="flex flex-wrap items-start justify-start gap-2">
                            {msg.sources.map((sourceName, i) => {
                                const sourceFile = files.find(f => f.name === sourceName);
                                return (
                                    <div
                                        key={i}
                                        className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/50 rounded-full border border-gray-200/50 dark:border-gray-700/40 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 transition-colors"
                                        title={sourceName}
                                    >
                                        {sourceFile && <FileIcon type={sourceFile.type} className="h-3.5 w-3.5 mr-2 flex-shrink-0" />}
                                        <span className="truncate">{sourceName}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {msg.sender === 'ai' && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && !isLoading && (
                    <div className="mt-5 flex flex-wrap items-start justify-start gap-2">
                        {msg.followUpSuggestions.map((suggestion, i) => (
                           <button
                             key={i}
                             onClick={() => handleSend(suggestion.query)}
                             className="px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-900/30 rounded-full hover:bg-purple-100/90 dark:hover:bg-purple-800/40 transition-all transform hover:scale-102 active:scale-98 border border-purple-200/40 dark:border-purple-700/30 shadow-sm"
                             aria-label={`Follow-up: ${suggestion.displayText}`}
                           >
                             {suggestion.displayText}
                           </button>
                        ))}
                    </div>
                )}
            </div>
          </div>
        )
      });
    }
    if (files.length > 0) {
      return (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Ask a question to get started!
            </p>
        </div>
      );
    }
    return <WelcomeMessage />;
  };


  return (
    <div className="flex flex-col h-full p-6">
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          className="w-full bg-white/60 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/40 rounded-xl py-2.5 pl-11 pr-36 focus:ring-2 focus:ring-purple-300/50 dark:focus:ring-purple-500/30 focus:border-purple-300 dark:focus:border-purple-500/50 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all shadow-sm text-sm"
          style={{ backdropFilter: 'blur(8px)' }}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {searchQuery && searchResultIndices.length > 0 && (
              <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200/60 dark:border-gray-700/40 mr-3 pr-3">
                <span className="font-medium tabular-nums">{currentSearchResultIndex + 1} of {searchResultIndices.length}</span>
                <button
                  onClick={handlePrevSearchResult}
                  disabled={currentSearchResultIndex <= 0}
                  className="p-1 rounded-lg transition-colors enabled:hover:bg-gray-100/80 enabled:dark:hover:bg-gray-700/50 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
                  aria-label="Previous search result"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextSearchResult}
                  disabled={currentSearchResultIndex >= searchResultIndices.length - 1}
                  className="p-1 rounded-lg transition-colors enabled:hover:bg-gray-100/80 enabled:dark:hover:bg-gray-700/50 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
                  aria-label="Next search result"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                aria-label="Clear search"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-grow overflow-y-auto mb-6 pr-2 space-y-8 scroll-mask">
        {renderContent()}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-auto pt-4 border-t border-gray-200/40 dark:border-gray-700/30 px-6">
        <div className="relative">
          <button
            onClick={() => setIsSummaryModalOpen(true)}
            disabled={isLoading || (messages.length === 0 && files.length === 0)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
            className="w-full bg-white/60 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl p-4 pl-14 pr-28 resize-none focus:ring-2 focus:ring-purple-300/50 dark:focus:ring-purple-500/30 focus:border-purple-300 dark:focus:border-purple-500/50 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 transition-all shadow-sm text-sm leading-relaxed"
            rows={1}
            style={{ minHeight: '56px', maxHeight: '200px', backdropFilter: 'blur(8px)' }}
            onInput={handleInputResize}
            disabled={files.length === 0 || isLoading}
            aria-describedby="char-counter"
          />
          {isSpeechSupported && (
            <button
              onClick={handleToggleListening}
              disabled={isLoading || files.length === 0}
              className="absolute right-16 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl text-white bg-gradient-to-br from-purple-400 to-blue-400 dark:from-purple-500 dark:to-blue-500 hover:from-purple-500 hover:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-sm"
            aria-label="Send message"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 px-2">
          <ToggleSwitch
            id="web-search-toggle"
            checked={useWebSearch}
            onChange={setUseWebSearch}
            label="Web Search"
            disabled={files.length === 0 || isLoading}
          />
          <div id="char-counter" className="text-xs font-medium" aria-live="polite">
              <span className={charCounterClasses}>
                  {input.length} / {MAX_INPUT_LENGTH}
              </span>
          </div>
        </div>
      </div>
      {isSummaryModalOpen && (
        <div
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-lg flex items-center justify-center z-[100] animate-fade-in"
            onClick={() => {
                setIsSummaryModalOpen(false);
                setSummaryView('options'); // Reset on close
            }}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-200/50 dark:border-gray-700/30 animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                 <button 
                    onClick={() => {
                        setIsSummaryModalOpen(false);
                        setSummaryView('options');
                    }}
                    className="absolute top-5 right-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/50"
                    aria-label="Close summary options"
                >
                   <CloseIcon className="h-5 w-5" />
                </button>
                
                {summaryView === 'options' && (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3" style={{ letterSpacing: '-0.01em' }}>
                            Generate Summary
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            What would you like to summarize?
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleRequestSummary('chat')}
                                disabled={messages.filter(m => !m.isTyping).length === 0}
                                className="w-full text-left flex items-center p-5 bg-white/70 dark:bg-gray-800/40 rounded-2xl transition-all hover:bg-white/90 dark:hover:bg-gray-800/60 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200/50 dark:border-gray-700/30"
                            >
                                <div className="p-2.5 rounded-xl bg-purple-100/80 dark:bg-purple-900/30 mr-4">
                                    <SummarizeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400"/>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-100 mb-0.5">Chat History</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Summarize the current conversation.</p>
                                </div>
                            </button>
                             <button
                                onClick={() => setSummaryView('selectFile')}
                                disabled={files.length === 0}
                                className="w-full text-left flex items-center p-5 bg-white/70 dark:bg-gray-800/40 rounded-2xl transition-all hover:bg-white/90 dark:hover:bg-gray-800/60 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200/50 dark:border-gray-700/30"
                            >
                                <div className="p-2.5 rounded-xl bg-blue-100/80 dark:bg-blue-900/30 mr-4">
                                    <DocumentIcon className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-100 mb-0.5">A Document</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Select one of your uploaded files.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {summaryView === 'selectFile' && (
                     <div>
                        <button onClick={() => setSummaryView('options')} className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-5 flex items-center transition-colors">&larr; <span className="ml-1">Back to options</span></button>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-5" style={{ letterSpacing: '-0.01em' }}>
                            Select a Document
                        </h3>
                        <div className="max-h-64 overflow-y-auto pr-2 -mr-2 space-y-2">
                            {files.map(file => (
                                <button
                                    key={file.id}
                                    onClick={() => handleRequestSummary('document', file)}
                                    className="w-full text-left flex items-center p-4 bg-white/70 dark:bg-gray-800/40 rounded-xl transition-all hover:bg-white/90 dark:hover:bg-gray-800/60 hover:shadow-sm border border-gray-200/50 dark:border-gray-700/30"
                                >
                                    <FileIcon type={file.type} className="h-5 w-5 mr-3 flex-shrink-0"/>
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

export default ChatWindow;