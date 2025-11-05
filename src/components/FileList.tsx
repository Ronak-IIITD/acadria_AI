import React, { useState, useMemo } from 'react';
import type { StudyFile } from '../types';
import TrashIcon from './icons/TrashIcon';
import SearchIcon from './icons/SearchIcon';
import SortIcon from './icons/SortIcon';
import FileIcon from './FileIcon';
import SparklesIcon from './icons/SparklesIcon';
import QuizIcon from './icons/QuizIcon';
import SummarizeIcon from './icons/SummarizeIcon';
import LightbulbIcon from './icons/LightbulbIcon';

interface FileListProps {
  files: StudyFile[];
  selectedFileIds: Set<string>;
  onToggleFile: (fileId: string) => void;
  onSelectAll: () => void;
  onDelete: (fileId: string) => void;
  onView?: (file: StudyFile) => void;
  flashcardCounts?: Record<string, number>;
  onGenerateFlashcards?: (file: StudyFile) => void;
  onStudyFlashcards?: (file: StudyFile) => void;
  onGenerateQuiz?: (file: StudyFile) => void;
  onGenerateSummary?: (file: StudyFile) => void;
  onGenerateKeyTakeaways?: (file: StudyFile) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileList: React.FC<FileListProps> = ({ 
  files,
  selectedFileIds,
  onToggleFile,
  onSelectAll,
  onDelete, 
  onView, 
  flashcardCounts = {}, 
  onGenerateFlashcards, 
  onStudyFlashcards,
  onGenerateQuiz,
  onGenerateSummary,
  onGenerateKeyTakeaways
}) => {
  const [fileToDelete, setFileToDelete] = useState<StudyFile | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: 'name' | 'size' | 'type') => {
    if (key === sortKey) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const processedFiles = useMemo(() => {
    return files
      .filter(file => file.name.toLowerCase().includes(filterQuery.toLowerCase()))
      .sort((a, b) => {
        let comparison = 0;
        if (sortKey === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortKey === 'size') {
          comparison = a.size - b.size;
        } else { // type
          comparison = a.type.localeCompare(b.type);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [files, filterQuery, sortKey, sortOrder]);

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      onDelete(fileToDelete.id);
      setFileToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setFileToDelete(null);
  };

  if (files.length === 0) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400 mt-8 flex flex-col items-center animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 dark:text-gray-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
        <p className="mt-4 text-sm font-medium">No documents uploaded yet.</p>
        <p className="text-xs text-gray-500 dark:text-gray-400/80">Drag & drop files above to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 space-y-3">
        {/* Select All Sources Button */}
        {files.length > 0 && (
          <button
            onClick={onSelectAll}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-medium text-sm transition-all"
            style={{
              background: selectedFileIds.size === files.length ? 'var(--color-accent-primary)' : 'var(--color-bg-elevated)',
              color: selectedFileIds.size === files.length ? 'white' : 'var(--color-text-primary)',
              border: '1.5px solid var(--color-border-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {selectedFileIds.size === files.length ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                )}
              </svg>
              <span>
                {selectedFileIds.size === files.length ? 'All sources selected' : 'Select all sources'}
              </span>
            </span>
            <span className="text-xs opacity-75">
              {selectedFileIds.size}/{files.length}
            </span>
          </button>
        )}
        
        {/* Filter Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          </div>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={`Search ${files.length} document${files.length === 1 ? '' : 's'}...`}
            aria-label="Search documents"
            style={{
              width: '100%',
              background: 'var(--color-bg-elevated)',
              border: '1.5px solid var(--color-border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.5rem 1rem 0.5rem 2.5rem',
              boxShadow: 'var(--shadow-sm)',
              color: 'var(--color-text-primary)',
              fontSize: '0.9375rem',
              transition: 'all var(--transition-base)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-accent-primary)';
              e.target.style.boxShadow = 'var(--shadow-md), 0 0 0 3px var(--color-accent-primary-soft)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border-medium)';
              e.target.style.boxShadow = 'var(--shadow-sm)';
            }}
          />
        </div>
        
        {/* Sort Controls */}
        <div className="flex items-center justify-between text-xs font-medium px-1" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="font-semibold">Sort by:</span>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {(['name', 'size', 'type'] as const).map(key => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  transition: 'all var(--transition-base)',
                  background: sortKey === key ? '#3B82F6' : 'var(--color-bg-elevated)',
                  color: sortKey === key ? 'white' : 'var(--color-text-secondary)',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer'
                }}
                aria-label={`Sort by ${key}`}
                aria-pressed={sortKey === key}
                onMouseEnter={(e) => {
                  if (sortKey !== key) {
                    e.currentTarget.style.background = 'var(--color-bg-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortKey !== key) {
                    e.currentTarget.style.background = 'var(--color-bg-elevated)';
                  }
                }}
              >
                <span className="capitalize">{key}</span>
                {sortKey === key && <SortIcon className="h-4 w-4 ml-1" direction={sortOrder} />}
              </button>
            ))}
          </div>
        </div>
      </div>
      {processedFiles.length > 0 ? (
        <ul className="space-y-3">
          {processedFiles.map(file => (
            <li
              key={file.id}
              style={{
                background: 'var(--color-bg-elevated)',
                padding: '0.625rem',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                transition: 'all 0.3s ease',
                border: '1px solid var(--color-border-medium)',
                boxShadow: 'var(--shadow-xs)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-hover)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-elevated)';
                e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              className="group animate-fade-in-up"
            >
              <div className="flex items-start min-w-0 flex-1 gap-3">
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFile(file.id);
                  }}
                  className="mt-1 flex-shrink-0"
                  aria-label={selectedFileIds.has(file.id) ? 'Deselect source' : 'Select source'}
                  title={selectedFileIds.has(file.id) ? 'Click to deselect this source' : 'Click to select this source'}
                >
                  <div 
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: selectedFileIds.has(file.id) ? 'var(--color-accent-primary)' : 'var(--color-border-medium)',
                      background: selectedFileIds.has(file.id) ? 'var(--color-accent-primary)' : 'transparent'
                    }}
                  >
                    {selectedFileIds.has(file.id) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
                
                <div style={{ height: '1.5rem', width: '1.5rem', flexShrink: 0, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                  <FileIcon type={file.type} className="h-6 w-6" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p 
                    style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: 'var(--color-text-primary)', 
                      wordBreak: 'break-word',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }} 
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px', fontWeight: 500 }}>
                    {file.type} - {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              {/* Action buttons container - horizontal scrollable layout */}
              <div className="transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 pt-2">
                {/* Flashcard Badge - Always visible if cards exist */}
                {flashcardCounts[file.id] > 0 && (
                  <div className="opacity-100 flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-md border border-purple-100 dark:border-purple-800/30 mb-2 w-fit">
                    <SparklesIcon className="h-3 w-3 text-purple-500 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-300">
                      {flashcardCounts[file.id]} cards
                    </span>
                  </div>
                )}
                
                {/* Main action buttons - horizontal scrollable row */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {/* Generate Flashcards Button */}
                  {onGenerateFlashcards && (
                    <button
                      onClick={() => onGenerateFlashcards(file)}
                      className="px-2.5 py-1.5 font-medium rounded-md transition-all text-left flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.12) 100%)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.18) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.12) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0)';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0) scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px) scale(1)';
                      }}
                      aria-label={`Generate flashcards for ${file.name}`}
                      title="Generate flashcards with AI"
                    >
                      <div className="flex items-center gap-1.5" style={{ color: '#3b82f6' }}>
                        <SparklesIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs whitespace-nowrap">Cards</span>
                      </div>
                    </button>
                  )}
                  
                  {/* Generate Quiz Button */}
                  {onGenerateQuiz && (
                    <button
                      onClick={() => onGenerateQuiz(file)}
                      className="px-2.5 py-1.5 font-medium rounded-md transition-all text-left flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(79, 70, 229, 0.12) 100%)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(79, 70, 229, 0.18) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(79, 70, 229, 0.12) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0)';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0) scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px) scale(1)';
                      }}
                      aria-label={`Generate quiz for ${file.name}`}
                      title="Generate quiz with AI"
                    >
                      <div className="flex items-center gap-1.5" style={{ color: '#6366f1' }}>
                        <QuizIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs whitespace-nowrap">Quiz</span>
                      </div>
                    </button>
                  )}
                  
                  {/* Generate Summary Button */}
                  {onGenerateSummary && (
                    <button
                      onClick={() => onGenerateSummary(file)}
                      className="px-2.5 py-1.5 font-medium rounded-md transition-all text-left flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(22, 163, 74, 0.12) 100%)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(22, 163, 74, 0.18) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(22, 163, 74, 0.12) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0)';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0) scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px) scale(1)';
                      }}
                      aria-label={`Generate summary for ${file.name}`}
                      title="Generate summary with AI"
                    >
                      <div className="flex items-center gap-1.5" style={{ color: '#22c55e' }}>
                        <SummarizeIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs whitespace-nowrap">Summary</span>
                      </div>
                    </button>
                  )}
                  
                  {/* Generate Key Takeaways Button */}
                  {onGenerateKeyTakeaways && (
                    <button
                      onClick={() => onGenerateKeyTakeaways(file)}
                      className="px-2.5 py-1.5 font-medium rounded-md transition-all text-left flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.12) 0%, rgba(249, 115, 22, 0.12) 100%)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid rgba(251, 146, 60, 0.2)',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251, 146, 60, 0.18) 0%, rgba(249, 115, 22, 0.18) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.3)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251, 146, 60, 0.12) 0%, rgba(249, 115, 22, 0.12) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.2)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0)';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0) scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px) scale(1)';
                      }}
                      aria-label={`Generate key takeaways for ${file.name}`}
                      title="Generate key takeaways with AI"
                    >
                      <div className="flex items-center gap-1.5" style={{ color: '#fb923c' }}>
                        <LightbulbIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs whitespace-nowrap">Takeaways</span>
                      </div>
                    </button>
                  )}
                  
                  {/* Study Flashcards Button */}
                  {onStudyFlashcards && flashcardCounts[file.id] > 0 && (
                    <button
                      onClick={() => onStudyFlashcards(file)}
                      className="px-2.5 py-1.5 font-medium rounded-md transition-all flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(147, 51, 234, 0.12) 100%)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(147, 51, 234, 0.18) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(147, 51, 234, 0.12) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0)';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0) scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px) scale(1)';
                      }}
                      aria-label={`Study flashcards for ${file.name}`}
                      title={`Study ${flashcardCounts[file.id]} flashcards`}
                    >
                      <div className="flex items-center gap-1.5" style={{ color: '#a855f7' }}>
                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-xs whitespace-nowrap">Study</span>
                      </div>
                    </button>
                  )}
                  
                  {/* View button */}
                  {onView && (
                    <button
                      onClick={() => onView(file)}
                      className="p-1.5 font-medium rounded-md transition-all flex-shrink-0"
                      style={{
                        background: 'var(--color-bg-elevated)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border-medium)',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg-hover)';
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg-elevated)';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                        e.currentTarget.style.transform = 'translateZ(0) translateY(0)';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) scale(0.95)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateZ(0) translateY(-1px) scale(1)';
                      }}
                      aria-label={`View ${file.name}`}
                      title="View document"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Delete button */}
                  <button
                    onClick={() => setFileToDelete(file)}
                    className="p-1.5 font-medium rounded-md transition-all flex-shrink-0"
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                      e.currentTarget.style.transform = 'translateZ(0) translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                      e.currentTarget.style.transform = 'translateZ(0) translateY(0)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateZ(0) scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateZ(0) translateY(-1px) scale(1)';
                    }}
                    aria-label={`Delete ${file.name}`}
                    title="Delete document"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-600 dark:text-gray-400 mt-8 flex flex-col items-center animate-fade-in">
          <SearchIcon className="h-16 w-16 text-gray-500 dark:text-gray-500/80" />
          <p className="mt-4 text-sm font-medium">No matching documents found.</p>
          <p className="text-xs text-gray-500 dark:text-gray-400/80">
            Your search for "<strong className="font-semibold" title={filterQuery}>{filterQuery}</strong>" did not match any files.
          </p>
        </div>
      )}
      {fileToDelete && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[100] animate-fade-in"
          onClick={handleCancelDelete}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="relative text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-white/20 animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to permanently delete <strong className="font-semibold">{fileToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-300/50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-300/80 dark:hover:bg-gray-700/80 focus:outline-none focus:ring-4 focus:ring-gray-500/30 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileList;