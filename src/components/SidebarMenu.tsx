import React, { useEffect, useState } from 'react';
import FileUpload from './FileUpload';
import FileList from './FileList';
import AIBookIcon from './icons/AIBookIcon';
import type { StudyFile } from '../types';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  files: StudyFile[];
  selectedFileIds: Set<string>;
  onFilesAdded: (files: StudyFile[]) => void;
  onToggleFile: (fileId: string) => void;
  onSelectAll: () => void;
  onFileView: (file: StudyFile) => void;
  onFileDelete: (fileId: string) => void;
  onGenerateFlashcards: (file: StudyFile) => void;
  onGenerateQuiz: (file: StudyFile) => void;
  onGenerateSummary: (file: StudyFile) => void;
  onGenerateTakeaways: (file: StudyFile) => void;
  flashcardCounts?: Record<string, number>;
  onStudyFlashcards: (file: StudyFile) => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen,
  onClose,
  files,
  selectedFileIds,
  onFilesAdded,
  onToggleFile,
  onSelectAll,
  onFileView,
  onFileDelete,
  onGenerateFlashcards,
  onGenerateQuiz,
  onGenerateSummary,
  onGenerateTakeaways,
  flashcardCounts,
  onStudyFlashcards,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Show the component
      setIsAnimating(true);
      // Trigger animation after mount - use double RAF for reliable transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      // Start closing animation
      setIsVisible(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // Match this with CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isAnimating) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 300ms ease-in-out'
        }}
      />

      {/* Sidebar */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-80 z-50 overflow-y-auto flex flex-col shadow-2xl"
        style={{
          background: 'var(--color-bg-elevated)',
          borderRight: '1px solid var(--color-border-light)',
          transform: isVisible ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10" style={{
          background: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border-light)'
        }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
              background: 'rgba(53, 208, 195, 0.12)'
            }}>
              <AIBookIcon className="h-5 w-5" style={{ color: '#35d0c3' }} />
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              StudySync AI
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick Actions */}
          <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
                <div className="p-1.5 rounded-md" style={{ background: 'var(--color-accent-primary-soft)', color: 'var(--color-accent-primary)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Search</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
                <div className="p-1.5 rounded-md" style={{ background: 'var(--color-accent-secondary-soft)', color: 'var(--color-accent-secondary)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>History</span>
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="px-4 py-4">
            <FileUpload onFilesAdded={onFilesAdded} />
          </div>

          {/* Files List */}
          <div className="px-4 pb-4">
            <FileList
              files={files}
              selectedFileIds={selectedFileIds}
              onToggleFile={onToggleFile}
              onSelectAll={onSelectAll}
              onDelete={onFileDelete}
              onView={onFileView}
              flashcardCounts={flashcardCounts}
              onGenerateFlashcards={onGenerateFlashcards}
              onStudyFlashcards={onStudyFlashcards}
              onGenerateQuiz={onGenerateQuiz}
              onGenerateSummary={onGenerateSummary}
              onGenerateKeyTakeaways={onGenerateTakeaways}
            />
          </div>

          {/* Help & Tools */}
          <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Help & Tools
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
                <svg className="w-4 h-4" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Feedback</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
                <svg className="w-4 h-4" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Quick Guide</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
                <svg className="w-4 h-4" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Invite & Earn</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;
