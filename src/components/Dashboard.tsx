import React, { useState, useEffect, useRef, useCallback } from 'react';
import FileUpload from './FileUpload';
import FileList from './FileList';
import CalmChatWindow from './CalmChatWindow';
import type { StudyFile, AiModel } from '../types';
import ModelSelector from './ModelSelector';
import PdfViewer from './PdfViewer';
import FlashcardGenerator from './FlashcardGenerator';
import FlashcardDeck from './FlashcardDeck';
import { AiModel as AiModelEnum } from '../types';
import { Flashcard } from '@/domain/studyTypes';

const FLASHCARDS_STORAGE_KEY = 'studysync_flashcards';

const Dashboard: React.FC = () => {
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [selectedModel, setSelectedModel] = useState<AiModel>(AiModelEnum.GEMINI_FLASH);
  const [viewingFile, setViewingFile] = useState<StudyFile | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');
  
  // Flashcard state
  const [flashcards, setFlashcards] = useState<Record<string, Flashcard[]>>({});
  const [generatingFor, setGeneratingFor] = useState<StudyFile | null>(null);
  const [studyingFile, setStudyingFile] = useState<StudyFile | null>(null);

  // Resizable panel state
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [pdfWidth, setPdfWidth] = useState(50); // percentage when viewing file
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingPdf, setIsResizingPdf] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load flashcards from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const converted: Record<string, Flashcard[]> = {};
        for (const [docId, cards] of Object.entries(parsed)) {
          converted[docId] = (cards as Flashcard[]).map(card => ({
            ...card,
            created: new Date(card.created),
            lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
            nextReviewDate: new Date(card.nextReviewDate),
          }));
        }
        setFlashcards(converted);
      } catch (err) {
        console.error('Failed to load flashcards:', err);
      }
    }
  }, []);

  // Save flashcards to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(flashcards));
  }, [flashcards]);

  const handleFilesAdded = (newFiles: StudyFile[]) => {
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleFileDelete = (fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
    // Also delete associated flashcards
    const updatedFlashcards = { ...flashcards };
    delete updatedFlashcards[fileId];
    setFlashcards(updatedFlashcards);
  };

  const handleFileView = (file: StudyFile) => {
    setViewingFile(file);
  };

  const handleAskAboutSelection = (question: string) => {
    setPendingQuestion(question);
    setViewingFile(null);
  };

  const handleGenerateFlashcards = (file: StudyFile) => {
    setGeneratingFor(file);
  };

  const handleFlashcardsGenerated = (newCards: Flashcard[]) => {
    if (generatingFor) {
      const docId = generatingFor.id;
      setFlashcards(prev => ({
        ...prev,
        [docId]: [...(prev[docId] || []), ...newCards],
      }));
      setGeneratingFor(null);
      setStudyingFile(generatingFor); // Start studying immediately
    }
  };

  const handleStudyFlashcards = (file: StudyFile) => {
    setStudyingFile(file);
  };

  const handleUpdateFlashcard = (updatedCard: Flashcard) => {
    if (studyingFile) {
      const docId = studyingFile.id;
      setFlashcards(prev => ({
        ...prev,
        [docId]: prev[docId].map(card => 
          card.id === updatedCard.id ? updatedCard : card
        ),
      }));
    }
  };

  // Sidebar resize handlers
  const handleSidebarMouseDown = useCallback(() => {
    setIsResizingSidebar(true);
  }, []);

  const handlePdfMouseDown = useCallback(() => {
    setIsResizingPdf(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        if (newWidth >= 280 && newWidth <= 600) {
          setSidebarWidth(newWidth);
        }
      }
      if (isResizingPdf && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const availableWidth = containerRect.width - sidebarWidth;
        const pdfLeft = sidebarWidth;
        const newPdfWidth = ((e.clientX - pdfLeft) / availableWidth) * 100;
        if (newPdfWidth >= 30 && newPdfWidth <= 70) {
          setPdfWidth(newPdfWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingPdf(false);
    };

    if (isResizingSidebar || isResizingPdf) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingSidebar, isResizingPdf, sidebarWidth]);
  
  return (
    <div className="content-container" ref={containerRef}>
      <div className="flex h-full">
        {/* Left Sidebar - Materials */}
        <aside 
          className="glass-card flex flex-col h-full overflow-hidden" 
          style={{ 
            width: `${sidebarWidth}px`,
            minWidth: '280px',
            maxWidth: '600px',
            borderRadius: 0,
            borderRight: '1px solid var(--color-border-soft)'
          }}
        >
          <div className="p-4 border-b border-gray-200/40 dark:border-gray-700/30">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100" style={{ letterSpacing: '-0.01em' }}>
              Study Materials
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload & organize your content
            </p>
          </div>
          
          <div className="p-4">
            <FileUpload onFilesAdded={handleFilesAdded} />
          </div>
          
          <div className="flex-grow overflow-y-auto px-4 pb-4">
            <FileList 
              files={files} 
              onDelete={handleFileDelete} 
              onView={handleFileView}
              flashcardCounts={Object.fromEntries(
                Object.entries(flashcards).map(([docId, cards]) => [docId, cards.length])
              )}
              onGenerateFlashcards={handleGenerateFlashcards}
              onStudyFlashcards={handleStudyFlashcards}
            />
          </div>
          
          <div className="p-4 border-t border-gray-200/40 dark:border-gray-700/30">
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          </div>
        </aside>

        {/* Resize Handle for Sidebar */}
        <div
          onMouseDown={handleSidebarMouseDown}
          className="w-1 hover:w-1.5 bg-gray-300/50 dark:bg-gray-600/50 hover:bg-purple-400 dark:hover:bg-purple-500 cursor-col-resize transition-all flex-shrink-0 relative group"
          style={{ zIndex: 10 }}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
        
        {/* Middle - PDF Viewer (only when file is being viewed) */}
        {viewingFile && (
          <>
            <aside 
              className="glass-card flex flex-col h-full overflow-hidden" 
              style={{ 
                width: `${pdfWidth}%`,
                borderRadius: 0,
                borderRight: '1px solid var(--color-border-soft)'
              }}
            >
              <PdfViewer
                file={viewingFile}
                onClose={() => setViewingFile(null)}
                onAskAboutSelection={handleAskAboutSelection}
                isInline={true}
              />
            </aside>

            {/* Resize Handle for PDF */}
            <div
              onMouseDown={handlePdfMouseDown}
              className="w-1 hover:w-1.5 bg-gray-300/50 dark:bg-gray-600/50 hover:bg-purple-400 dark:hover:bg-purple-500 cursor-col-resize transition-all flex-shrink-0 relative group"
              style={{ zIndex: 10 }}
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>
          </>
        )}
        
        {/* Right - Chat Window */}
        <main 
          className="glass-card flex flex-col flex-1" 
          style={{ 
            borderRadius: 0,
            minWidth: 0
          }}
        >
          <CalmChatWindow
            files={files}
            model={selectedModel}
            pendingQuestion={pendingQuestion}
            onQuestionSent={() => setPendingQuestion('')}
          />
        </main>
      </div>
      
      {generatingFor && (
        <FlashcardGenerator
          documentContent={generatingFor.content || ''}
          documentId={generatingFor.id}
          documentTitle={generatingFor.name}
          onGenerate={handleFlashcardsGenerated}
          onClose={() => setGeneratingFor(null)}
        />
      )}

      {studyingFile && flashcards[studyingFile.id] && (
        <FlashcardDeck
          cards={flashcards[studyingFile.id]}
          onUpdateCard={handleUpdateFlashcard}
          onClose={() => setStudyingFile(null)}
          documentTitle={studyingFile.name}
        />
      )}
    </div>
  );
};

export default Dashboard;