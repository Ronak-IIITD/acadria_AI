import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import FileList from './FileList';
import ChatWindow from './ChatWindow';
import ModelSelector from './ModelSelector';
import PdfViewer from './PdfViewer';
import FlashcardGenerator from './FlashcardGenerator';
import FlashcardDeck from './FlashcardDeck';
import { AiModel, StudyFile } from '../types';
import { Flashcard } from '../studyTypes';

const FLASHCARDS_STORAGE_KEY = 'studysync_flashcards';

const Dashboard: React.FC = () => {
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [selectedModel, setSelectedModel] = useState<AiModel>(AiModel.GEMINI_FLASH);
  const [viewingFile, setViewingFile] = useState<StudyFile | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');
  
  // Flashcard state
  const [flashcards, setFlashcards] = useState<Record<string, Flashcard[]>>({});
  const [generatingFor, setGeneratingFor] = useState<StudyFile | null>(null);
  const [studyingFile, setStudyingFile] = useState<StudyFile | null>(null);

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
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-5rem)] animate-fade-in-up pt-8 pb-6">
      <div className="lg:col-span-1 glass-card p-8 flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100" style={{ letterSpacing: '-0.01em' }}>My Study Materials</h2>
        <FileUpload onFilesAdded={handleFilesAdded} />
        <div className="flex-grow overflow-y-auto mt-6 pr-2 -mr-2">
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
        <div className="mt-auto pt-6">
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
        </div>
      </div>
      <div className="lg:col-span-2 glass-card flex flex-col h-full">
        <ChatWindow files={files} model={selectedModel} pendingQuestion={pendingQuestion} onQuestionSent={() => setPendingQuestion('')} />
      </div>
      
      {viewingFile && (
        <PdfViewer
          file={viewingFile}
          onClose={() => setViewingFile(null)}
          onAskAboutSelection={handleAskAboutSelection}
        />
      )}

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