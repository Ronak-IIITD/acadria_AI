import React, { useEffect, useState, useContext } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import FileUpload from './FileUpload';
import FileList from './FileList';
import AIBookIcon from './icons/AIBookIcon';
import SettingsPanel from './SettingsPanel';
import { ThemeContext } from '../contexts/ThemeContext';
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'account' | 'personalization' | 'billing' | 'data'>('account');
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await signOut(auth);
        localStorage.removeItem('chatHistory');
        setShowProfileMenu(false);
        onClose();
        // User will be automatically redirected to landing page by App.tsx auth listener
      } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to log out. Please try again.');
      }
    }
  };

  const openSettings = (section: 'account' | 'personalization' | 'billing' | 'data' = 'account') => {
    setSettingsSection(section);
    setShowSettings(true);
    setShowProfileMenu(false);
  };

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

        {/* User Profile Section - Fixed at bottom */}
        <div className="border-t sticky bottom-0" style={{ 
          borderColor: 'var(--color-border-light)',
          background: 'var(--color-bg-elevated)'
        }}>
          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="px-4 py-3 space-y-1 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
              <button 
                onClick={() => openSettings('account')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
              >
                <svg className="w-4 h-4" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Settings</span>
              </button>

              <button 
                onClick={() => openSettings('billing')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
              >
                <svg className="w-4 h-4" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Pricing</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left">
                <svg className="w-4 h-4" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>History</span>
              </button>

              {/* Dark Mode Toggle */}
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Dark mode</span>
                </div>
                <div 
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </button>

              {/* Log Out */}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group"
              >
                <svg className="w-4 h-4 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" style={{ color: 'var(--color-text-primary)' }}>Log out</span>
              </button>
            </div>
          )}

          {/* Profile Button */}
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm text-white" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                A
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Aizen</div>
                <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Free Plan</div>
              </div>
            </div>
            <svg 
              className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} 
              style={{ color: 'var(--color-text-secondary)' }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        activeSection={settingsSection}
        onNavigate={setSettingsSection}
      />
    </>
  );
};

export default SidebarMenu;
