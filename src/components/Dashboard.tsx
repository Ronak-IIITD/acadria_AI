import { useState, useEffect, useRef, useCallback } from 'react';
import FileUpload from './FileUpload';
import FileList from './FileList';
import CalmChatWindow from './CalmChatWindow';
import type { StudyFile, AiModel } from '../types';
import ChatHeader from './ChatHeader';
import SidebarMenu from './SidebarMenu';
import PdfViewer from './PdfViewer';
import FlashcardGenerator from './FlashcardGenerator';
import FlashcardDeck from './FlashcardDeck';
import QuizGenerator from './QuizGenerator';
import QuizTaker from './QuizTaker';
import SummaryViewer from './SummaryViewer';
import KeyTakeawaysPanel from './KeyTakeawaysPanel';
import SplitView from './SplitView';
import { AiModel as AiModelEnum } from '../types';
import { Flashcard, Quiz, Summary } from '@/domain/studyTypes';
import { Columns2, Maximize2, Minimize2 } from 'lucide-react';
import { generateQuiz, generateSummary, generateKeyTakeaways } from '@/services/studyToolsService';

const FLASHCARDS_STORAGE_KEY = 'studysync_flashcards';

const Dashboard: React.FC = () => {
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set()); // New: track selected files
  const [selectedModel, setSelectedModel] = useState<AiModel>(AiModelEnum.GEMINI_FLASH);
  const [viewingFile, setViewingFile] = useState<StudyFile | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');
  
  // Flashcard state
  const [flashcards, setFlashcards] = useState<Record<string, Flashcard[]>>({});
  const [generatingFor, setGeneratingFor] = useState<StudyFile | null>(null);
  const [studyingFile, setStudyingFile] = useState<StudyFile | null>(null);

  // Quiz state
  const [quizGeneratingFor, setQuizGeneratingFor] = useState<StudyFile | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  // Summary state
  const [summaryFile, setSummaryFile] = useState<StudyFile | null>(null);
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Key Takeaways state
  const [takeawaysFile, setTakeawaysFile] = useState<StudyFile | null>(null);
  const [currentTakeaways, setCurrentTakeaways] = useState<string[]>([]);
  const [isTakeawaysLoading, setIsTakeawaysLoading] = useState(false);

  // UI state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [levelUpEnabled, setLevelUpEnabled] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  
  // Resizable panel state
  const [pdfWidth, setPdfWidth] = useState(50); // percentage when viewing file
  const [isResizingPdf, setIsResizingPdf] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive: stack on small screens
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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
    // Auto-select newly added files
    setSelectedFileIds(prev => {
      const newSet = new Set(prev);
      newFiles.forEach(file => newSet.add(file.id));
      return newSet;
    });
  };

  const handleFileDelete = (fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
    // Remove from selected files
    setSelectedFileIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
    // Also delete associated flashcards
    const updatedFlashcards = { ...flashcards };
    delete updatedFlashcards[fileId];
    setFlashcards(updatedFlashcards);
  };

  const handleFileView = (file: StudyFile) => {
    setViewingFile(file);
  };

  const handleFileToggle = (fileId: string) => {
    setSelectedFileIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleSelectAllFiles = () => {
    if (selectedFileIds.size === files.length) {
      // Deselect all
      setSelectedFileIds(new Set());
    } else {
      // Select all
      setSelectedFileIds(new Set(files.map(f => f.id)));
    }
  };

  // Get only selected files for AI chat
  const selectedFiles = files.filter(f => selectedFileIds.has(f.id));

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

  // Quiz handlers
  const handleGenerateQuiz = (file: StudyFile) => {
    setQuizGeneratingFor(file);
  };

  const handleQuizGenerate = async (count: number, difficulty: 'easy' | 'medium' | 'hard' | 'mixed') => {
    if (!quizGeneratingFor) return;
    
    setIsQuizLoading(true);
    try {
      const quiz = await generateQuiz(quizGeneratingFor.content, quizGeneratingFor.id, count, difficulty);
      setCurrentQuiz(quiz);
      setQuizGeneratingFor(null);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('Failed to generate quiz. Please try again.');
      setQuizGeneratingFor(null);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleQuizComplete = (score: number, totalQuestions: number) => {
    console.log(`Quiz completed: ${score}/${totalQuestions}`);
    // Could save quiz results here
  };

  // Summary handlers
  const handleGenerateSummary = (file: StudyFile) => {
    setSummaryFile(file);
    handleSummaryGenerate('detailed'); // Start with detailed summary
  };

  const handleSummaryGenerate = async (mode: 'brief' | 'detailed' | 'bullets') => {
    if (!summaryFile) return;
    
    setIsSummaryLoading(true);
    try {
      const summary = await generateSummary(summaryFile.content, summaryFile.id, mode);
      setCurrentSummary(summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Key Takeaways handlers
  const handleGenerateKeyTakeaways = (file: StudyFile) => {
    setTakeawaysFile(file);
    handleTakeawaysGenerate(5);
  };

  const handleTakeawaysGenerate = async (count: number) => {
    if (!takeawaysFile) return;
    
    setIsTakeawaysLoading(true);
    try {
      const takeaways = await generateKeyTakeaways(takeawaysFile.content, count);
      setCurrentTakeaways(takeaways);
    } catch (error) {
      console.error('Failed to generate key takeaways:', error);
      alert('Failed to generate key takeaways. Please try again.');
    } finally {
      setIsTakeawaysLoading(false);
    }
  };

  // Panel resize handlers
  const handlePdfMouseDown = useCallback(() => {
    setIsResizingPdf(true);
  }, []);

  useEffect(() => {
    let rafId: number | null = null;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        if (isResizingPdf && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const newPdfWidth = (e.clientX / containerRect.width) * 100;
          if (newPdfWidth >= 30 && newPdfWidth <= 70) {
            setPdfWidth(newPdfWidth);
          }
        }
      });
    };

    const handleMouseUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      setIsResizingPdf(false);
    };

    if (isResizingPdf) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingPdf]);
  
  return (
    <div className="content-container flex flex-col h-full" ref={containerRef}>
      {/* Chat Header */}
      <ChatHeader
        onMenuClick={() => setIsMenuOpen(true)}
        fileCount={selectedFiles.length}
      />

      {/* Sidebar Menu Overlay */}
      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        files={files}
        selectedFileIds={selectedFileIds}
        onToggleFile={handleFileToggle}
        onSelectAll={handleSelectAllFiles}
        onFileDelete={handleFileDelete}
        onFileView={handleFileView}
        onFilesAdded={handleFilesAdded}
        flashcardCounts={Object.fromEntries(
          Object.entries(flashcards).map(([docId, cards]) => [docId, cards.length])
        )}
        onGenerateFlashcards={handleGenerateFlashcards}
        onStudyFlashcards={handleStudyFlashcards}
        onGenerateQuiz={handleGenerateQuiz}
        onGenerateSummary={handleGenerateSummary}
        onGenerateTakeaways={handleGenerateKeyTakeaways}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer (when file is being viewed) */}
        {viewingFile && !isMobile && isSplitView && (
          <SplitView
            initialLeftWidth={50}
            minLeftWidth={30}
            maxLeftWidth={70}
            leftPanel={
              <div 
                className="flex flex-col h-full overflow-hidden"
                style={{ 
                  background: 'var(--color-surface-glass)',
                  backdropFilter: 'blur(28px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(120%)',
                }}
              >
                <PdfViewer
                  file={viewingFile}
                  onClose={() => setViewingFile(null)}
                  onAskAboutSelection={handleAskAboutSelection}
                  isInline={true}
                  isSplitView={true}
                  onToggleSplitView={() => setIsSplitView(false)}
                />
              </div>
            }
            rightPanel={
              <div 
                className="flex flex-col h-full" 
                style={{ 
                  background: 'var(--color-surface-glass)',
                  backdropFilter: 'blur(28px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(120%)',
                }}
              >
                <CalmChatWindow
                  files={selectedFiles}
                  model={selectedModel}
                  onModelChange={setSelectedModel}
                  levelUpEnabled={levelUpEnabled}
                  onToggleLevelUp={setLevelUpEnabled}
                  pendingQuestion={pendingQuestion}
                  onQuestionSent={() => setPendingQuestion('')}
                  onQuizClick={() => {
                    if (selectedFiles.length > 0) {
                      handleGenerateQuiz(selectedFiles[0]);
                    }
                  }}
                  onFlashcardsClick={() => {
                    if (selectedFiles.length > 0) {
                      handleGenerateFlashcards(selectedFiles[0]);
                    }
                  }}
                />
              </div>
            }
          />
        )}

        {/* Legacy PDF + Chat Layout (when not in split view) */}
        {viewingFile && !isMobile && !isSplitView && (
          <>
            <div 
              className="flex flex-col h-full overflow-hidden" 
              style={{ 
                width: `${pdfWidth}%`,
                background: 'var(--color-surface-glass)',
                backdropFilter: 'blur(28px) saturate(120%)',
                WebkitBackdropFilter: 'blur(28px) saturate(120%)',
                borderRight: '2px solid var(--color-border-medium)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Split View Toggle Button */}
              <div className="absolute top-14 right-4 z-20">
                <button
                  onClick={() => setIsSplitView(true)}
                  className="p-2 rounded-lg border shadow-lg hover:scale-105 transition-transform"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border-light)'
                  }}
                  title="Enter split view"
                >
                  <Columns2 className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>
              <PdfViewer
                file={viewingFile}
                onClose={() => setViewingFile(null)}
                onAskAboutSelection={handleAskAboutSelection}
                isInline={true}
              />
            </div>

            {/* Resize Handle for PDF */}
            <div
              onMouseDown={handlePdfMouseDown}
              className="w-1 hover:w-1.5 bg-gray-400/60 dark:bg-gray-600/50 hover:bg-purple-400 dark:hover:bg-purple-500 cursor-col-resize transition-all flex-shrink-0 relative group"
              style={{ zIndex: 10 }}
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>
          </>
        )}
        
        {/* Chat Window (when no file is being viewed OR in split view) */}
        {(!viewingFile || (viewingFile && isSplitView)) && (
          <div 
            className="flex-1 flex flex-col" 
            style={{ 
              minWidth: 0,
              background: 'var(--color-surface-glass)',
              backdropFilter: 'blur(28px) saturate(120%)',
              WebkitBackdropFilter: 'blur(28px) saturate(120%)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <CalmChatWindow
              files={selectedFiles}
              model={selectedModel}
              onModelChange={setSelectedModel}
              levelUpEnabled={levelUpEnabled}
              onToggleLevelUp={setLevelUpEnabled}
              pendingQuestion={pendingQuestion}
              onQuestionSent={() => setPendingQuestion('')}
              onQuizClick={() => {
                if (selectedFiles.length > 0) {
                  handleGenerateQuiz(selectedFiles[0]);
                }
              }}
              onFlashcardsClick={() => {
                if (selectedFiles.length > 0) {
                  handleGenerateFlashcards(selectedFiles[0]);
                }
              }}
            />
          </div>
        )}
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

      {quizGeneratingFor && (
        <QuizGenerator
          documentTitle={quizGeneratingFor.name}
          onGenerate={handleQuizGenerate}
          onClose={() => setQuizGeneratingFor(null)}
          isLoading={isQuizLoading}
        />
      )}

      {currentQuiz && (
        <QuizTaker
          quiz={currentQuiz}
          onClose={() => setCurrentQuiz(null)}
          onComplete={handleQuizComplete}
        />
      )}

      {summaryFile && currentSummary && (
        <SummaryViewer
          summary={currentSummary}
          documentTitle={summaryFile.name}
          onClose={() => {
            setSummaryFile(null);
            setCurrentSummary(null);
          }}
          onRegenerate={handleSummaryGenerate}
          isLoading={isSummaryLoading}
        />
      )}

      {takeawaysFile && currentTakeaways.length > 0 && (
        <KeyTakeawaysPanel
          takeaways={currentTakeaways}
          documentTitle={takeawaysFile.name}
          onClose={() => {
            setTakeawaysFile(null);
            setCurrentTakeaways([]);
          }}
          onRegenerate={handleTakeawaysGenerate}
          isLoading={isTakeawaysLoading}
        />
      )}
    </div>
  );
};

export default Dashboard;