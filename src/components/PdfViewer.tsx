import { useState, useRef, useEffect } from 'react';
import type { StudyFile } from '../types';
import CloseIcon from './icons/CloseIcon';

interface PdfViewerProps {
  file: StudyFile;
  onClose: () => void;
  onAskAboutSelection: (selectedText: string) => void;
}

interface Annotation {
  id: string;
  pageNumber: number;
  text: string;
  position: { x: number; y: number };
  color: string;
  type: 'highlight' | 'note';
}

const PdfViewer = ({ file, onClose, onAskAboutSelection }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showAskButton, setShowAskButton] = useState(false);
  const [highlightColor, setHighlightColor] = useState<string>('#FFEB3B');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF content
  useEffect(() => {
    const loadPdf = async () => {
      if (file.type !== 'PDF') return;
      
      try {
        const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
        const binaryString = atob(file.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const loadingTask = pdfjs.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;
        setNumPages(pdf.numPages);
        
        // Render first page
        renderPage(pdf, 1);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPdf();
  }, [file]);

  const renderPage = async (pdf: any, pageNum: number) => {
    const page = await pdf.getPage(pageNum);
    const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const viewport = page.getViewport({ scale: 1.5 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      setShowAskButton(true);
    } else {
      setShowAskButton(false);
    }
  };

  const handleAskAI = () => {
    if (selectedText) {
      onAskAboutSelection(`Regarding "${file.name}": ${selectedText}`);
      setShowAskButton(false);
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleHighlight = () => {
    if (!selectedText) return;

    const annotation: Annotation = {
      id: `annotation-${Date.now()}`,
      pageNumber: currentPage,
      text: selectedText,
      position: { x: 0, y: 0 }, // Simplified for now
      color: highlightColor,
      type: 'highlight',
    };

    setAnnotations([...annotations, annotation]);
    setShowAskButton(false);
    setSelectedText('');
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {file.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage} of {numPages}
            </p>
          </div>
          
          {/* Toolbar */}
          <div className="flex items-center gap-2 mx-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage === numPages}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Highlight:</label>
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close PDF viewer"
          >
            <CloseIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* PDF Content */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-800"
          onMouseUp={handleTextSelection}
        >
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-lg">
            {file.type === 'PDF' ? (
              <canvas id="pdf-canvas" className="w-full" />
            ) : (
              <div className="p-8 prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans">
                  {atob(file.content)}
                </pre>
              </div>
            )}
          </div>

          {/* Selection Actions Popup */}
          {showAskButton && (
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 flex gap-2 animate-fade-in-up z-50">
              <button
                onClick={handleHighlight}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-medium transition-colors"
              >
                Highlight
              </button>
              <button
                onClick={handleAskAI}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ask AI
              </button>
              <button
                onClick={() => setShowAskButton(false)}
                className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Annotations Sidebar */}
        {annotations.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Annotations ({annotations.length})
            </h3>
            <div className="space-y-2">
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800"
                  style={{ borderLeft: `4px solid ${annotation.color}` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Page {annotation.pageNumber}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {annotation.text}
                    </p>
                  </div>
                  <button
                    onClick={() => removeAnnotation(annotation.id)}
                    className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <CloseIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
