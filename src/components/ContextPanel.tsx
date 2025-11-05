import React, { useState } from 'react';
import type { StudyFile } from '../types';

interface ContextPanelProps {
  files: StudyFile[];
  selectedFileIds: Set<string>;
  onToggleLevelUp: (enabled: boolean) => void;
  levelUpEnabled: boolean;
}

const ContextPanel: React.FC<ContextPanelProps> = ({
  files,
  selectedFileIds,
  onToggleLevelUp,
  levelUpEnabled
}) => {
  const [activeTab, setActiveTab] = useState<'context' | 'tools'>('context');
  
  const selectedFiles = files.filter(f => selectedFileIds.has(f.id));

  return (
    <div className="h-full flex flex-col" style={{
      background: 'var(--color-bg-secondary)',
      borderLeft: '1px solid var(--color-border-light)'
    }}>
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <button
          onClick={() => setActiveTab('context')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'context' ? 'border-b-2' : ''
          }`}
          style={{
            color: activeTab === 'context' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
            borderColor: activeTab === 'context' ? 'var(--color-accent-primary)' : 'transparent'
          }}
        >
          Context
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'tools' ? 'border-b-2' : ''
          }`}
          style={{
            color: activeTab === 'tools' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
            borderColor: activeTab === 'tools' ? 'var(--color-accent-primary)' : 'transparent'
          }}
        >
          Tools
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'context' ? (
          <div className="space-y-4">
            {/* Level Up Mode */}
            <div className="p-4 rounded-lg border" style={{
              background: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border-light)'
            }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    Level Up+
                  </span>
                </div>
                <button
                  onClick={() => onToggleLevelUp(!levelUpEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    levelUpEnabled ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      levelUpEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Enhanced AI reasoning for better accuracy and deeper insights
              </p>
            </div>

            {/* Selected Files */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                Active Context ({selectedFiles.length})
              </h3>
              {selectedFiles.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    No files selected
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedFiles.map(file => (
                    <div
                      key={file.id}
                      className="p-3 rounded-lg border"
                      style={{
                        background: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border-light)'
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {file.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                            {file.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
              Study Tools
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-lg border hover:border-current transition-all text-left" style={{
                background: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border-light)',
                color: 'var(--color-accent-primary)'
              }}>
                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Flashcards</p>
              </button>

              <button className="p-4 rounded-lg border hover:border-current transition-all text-left" style={{
                background: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border-light)',
                color: 'var(--color-accent-secondary)'
              }}>
                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Quizzes</p>
              </button>

              <button className="p-4 rounded-lg border hover:border-current transition-all text-left" style={{
                background: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border-light)',
                color: 'var(--color-accent-lavender)'
              }}>
                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Summary</p>
              </button>

              <button className="p-4 rounded-lg border hover:border-current transition-all text-left" style={{
                background: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border-light)',
                color: 'var(--color-accent-warm)'
              }}>
                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Key Points</p>
              </button>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                Chat Instructions
              </h4>
              <div className="space-y-2">
                <button className="w-full p-3 rounded-lg border hover:border-current transition-all text-left" style={{
                  background: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border-light)'
                }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Mind Map</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Visual concept mapping</p>
                </button>

                <button className="w-full p-3 rounded-lg border hover:border-current transition-all text-left" style={{
                  background: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border-light)'
                }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Timeline</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Chronological breakdown</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextPanel;
