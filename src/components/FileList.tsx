import React, { useState, useMemo } from 'react';
import type { StudyFile } from '../types';
import TrashIcon from './icons/TrashIcon';
import SearchIcon from './icons/SearchIcon';
import SortIcon from './icons/SortIcon';
import FileIcon from './FileIcon';
import SparklesIcon from './icons/SparklesIcon';

interface FileListProps {
  files: StudyFile[];
  onDelete: (fileId: string) => void;
  onView?: (file: StudyFile) => void;
  flashcardCounts?: Record<string, number>;
  onGenerateFlashcards?: (file: StudyFile) => void;
  onStudyFlashcards?: (file: StudyFile) => void;
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
  onDelete, 
  onView, 
  flashcardCounts = {}, 
  onGenerateFlashcards, 
  onStudyFlashcards 
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
                padding: '0.75rem',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
              <div className="flex items-center min-w-0 flex-1">
                <div style={{ height: '1.5rem', width: '1.5rem', flexShrink: 0, color: 'var(--color-text-secondary)' }}>
                  <FileIcon type={file.type} className="h-6 w-6" />
                </div>
                <div style={{ marginLeft: '0.75rem', minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>{file.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    {file.type} - {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              {/* Action buttons are always visible on small screens for touch accessibility,
                 and reveal on hover/focus for md+ screens to reduce visual noise. */}
              <div className="flex items-center gap-2 flex-shrink-0 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                {/* Flashcard Badge - Always visible if cards exist */}
                {flashcardCounts[file.id] > 0 && (
                  <div className="opacity-100 flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 px-2 py-1 rounded-full">
                    <SparklesIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                      {flashcardCounts[file.id]}
                    </span>
                  </div>
                )}
                
                {/* Study Flashcards Button */}
                {onStudyFlashcards && flashcardCounts[file.id] > 0 && (
                  <button
                    onClick={() => onStudyFlashcards(file)}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-purple-500 hover:bg-purple-500/10 rounded-full transition-all"
                    aria-label={`Study flashcards for ${file.name}`}
                    title={`Study ${flashcardCounts[file.id]} flashcards`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </button>
                )}
                
                {/* Generate Flashcards Button */}
                {onGenerateFlashcards && (
                  <button
                    onClick={() => onGenerateFlashcards(file)}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-all"
                    aria-label={`Generate flashcards for ${file.name}`}
                    title="Generate flashcards with AI"
                  >
                    <SparklesIcon className="h-4 w-4" />
                  </button>
                )}
                
                {onView && (
                  <button
                    onClick={() => onView(file)}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-all"
                    aria-label={`View ${file.name}`}
                    title="View document"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setFileToDelete(file)}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                  aria-label={`Delete ${file.name}`}
                  title="Delete document"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
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