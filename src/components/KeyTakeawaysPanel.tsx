import React, { useState } from 'react';
import CloseIcon from './icons/CloseIcon';
import CopyIcon from './icons/CopyIcon';
import SparklesIcon from './icons/SparklesIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface KeyTakeawaysPanelProps {
  takeaways: string[];
  documentTitle: string;
  onClose: () => void;
  onRegenerate?: (count: number) => void;
  isLoading?: boolean;
}

export default function KeyTakeawaysPanel({
  takeaways,
  documentTitle,
  onClose,
  onRegenerate,
  isLoading = false,
}: KeyTakeawaysPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyAll = async () => {
    try {
      const text = takeaways.map((item, index) => `${index + 1}. ${item}`).join('\n\n');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopyOne = async (takeaway: string, index: number) => {
    try {
      await navigator.clipboard.writeText(takeaway);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Key Takeaways</h2>
                <p className="text-sm text-white/80 truncate max-w-md">
                  {documentTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close key takeaways"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Extracting key takeaways...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {takeaways.map((takeaway, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                        {takeaway}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyOne(takeaway, index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg"
                      aria-label={`Copy takeaway ${index + 1}`}
                    >
                      {copiedIndex === index ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      ) : (
                        <CopyIcon className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {takeaways.length} key point{takeaways.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-3">
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(takeaways.length)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <SparklesIcon className="w-4 h-4" />
                  Regenerate
                </button>
              )}
              <button
                onClick={handleCopyAll}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-green-500 to-teal-600 text-white hover:shadow-lg'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <CopyIcon className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
