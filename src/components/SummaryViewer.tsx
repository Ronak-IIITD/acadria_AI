import React, { useState } from 'react';
import CloseIcon from './icons/CloseIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import CopyIcon from './icons/CopyIcon';
import SparklesIcon from './icons/SparklesIcon';
import { Summary } from '@/domain/studyTypes';

interface SummaryViewerProps {
  summary: Summary;
  documentTitle: string;
  onClose: () => void;
  onRegenerate?: (mode: 'brief' | 'detailed' | 'bullets') => void;
  isLoading?: boolean;
}

export default function SummaryViewer({
  summary,
  documentTitle,
  onClose,
  onRegenerate,
  isLoading = false,
}: SummaryViewerProps) {
  const [copied, setCopied] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'brief' | 'detailed' | 'bullets'>(summary.mode);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleModeChange = (mode: 'brief' | 'detailed' | 'bullets') => {
    setSelectedMode(mode);
    if (onRegenerate && mode !== summary.mode) {
      onRegenerate(mode);
    }
  };

  const modes = [
    { value: 'brief', label: 'Brief', emoji: '⚡', description: '2-3 sentences' },
    { value: 'detailed', label: 'Detailed', emoji: '📚', description: 'Comprehensive' },
    { value: 'bullets', label: 'Bullets', emoji: '📋', description: 'Key points' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <BookOpenIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Document Summary</h2>
                <p className="text-sm text-white/80 truncate max-w-md">
                  {documentTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close summary"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="flex gap-2">
            {modes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value)}
                disabled={isLoading}
                className={`flex-1 p-3 rounded-lg backdrop-blur-sm transition-all ${
                  selectedMode === mode.value
                    ? 'bg-white text-blue-600 shadow-lg scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-lg mb-1">{mode.emoji}</div>
                <div className="font-medium text-sm">{mode.label}</div>
                <div className="text-xs opacity-80">{mode.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Generating summary...</p>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              {summary.mode === 'bullets' ? (
                <ul className="space-y-2">
                  {summary.content.split('\n').filter(line => line.trim()).map((line, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">
                      {line.replace(/^[•\-*]\s*/, '')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {summary.content}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Generated {new Date(summary.generatedAt).toLocaleString()}
            </div>
            <div className="flex gap-3">
              {onRegenerate && (
                <button
                  onClick={() => handleModeChange(selectedMode)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <SparklesIcon className="w-4 h-4" />
                  Regenerate
                </button>
              )}
              <button
                onClick={handleCopy}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <CopyIcon className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
