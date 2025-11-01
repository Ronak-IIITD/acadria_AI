import { useState, useRef, useEffect, useCallback } from 'react';
import type { StudyFile } from '../types';
import CloseIcon from './icons/CloseIcon';

interface PdfViewerProps {
  file: StudyFile;
  onClose: () => void;
  onAskAboutSelection: (selectedText: string) => void;
  isInline?: boolean;
}

interface Annotation {
  id: string;
  pageNumber: number;
  text: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  color: string;
  type: 'highlight' | 'note' | 'text' | 'drawing';
  strokeWidth?: number;
  points?: { x: number; y: number }[];
}

type ToolMode = 'select' | 'highlight' | 'text' | 'draw' | 'eraser';

const PdfViewer = ({ file, onClose, onAskAboutSelection, isInline = false }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showAskButton, setShowAskButton] = useState(false);
  const [highlightColor, setHighlightColor] = useState<string>('#FFEB3B');
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<{ x: number; y: number }[]>([]);
  const [textAnnotation, setTextAnnotation] = useState<{ x: number; y: number; text: string } | null>(null);
  const [scale, setScale] = useState<number>(1.5);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load PDF document
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
        setPdfDocument(pdf);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPdf();
  }, [file]);

  // Render current page
  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(pdfDocument, currentPage);
    }
  }, [pdfDocument, currentPage, scale]);

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const annotationCanvas = annotationCanvasRef.current;
      
      if (!canvas || !annotationCanvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      annotationCanvas.height = viewport.height;
      annotationCanvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Redraw annotations for current page
      redrawAnnotations();
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const redrawAnnotations = () => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw annotations for current page
    annotations
      .filter(ann => ann.pageNumber === currentPage)
      .forEach(ann => {
        if (ann.type === 'highlight' && ann.width && ann.height) {
          ctx.fillStyle = ann.color + '80'; // Add transparency
          ctx.fillRect(ann.position.x, ann.position.y, ann.width, ann.height);
        } else if (ann.type === 'drawing' && ann.points) {
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.strokeWidth || 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ann.points.forEach((point, i) => {
            if (i === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
        } else if (ann.type === 'text') {
          ctx.fillStyle = ann.color;
          ctx.font = '16px Arial';
          ctx.fillText(ann.text, ann.position.x, ann.position.y);
        }
      });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (toolMode === 'draw' || toolMode === 'eraser') {
      setIsDrawing(true);
      const rect = annotationCanvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentDrawing([{ x, y }]);
      }
    } else if (toolMode === 'text') {
      const rect = annotationCanvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const text = prompt('Enter text:');
        if (text) {
          const annotation: Annotation = {
            id: `text-${Date.now()}`,
            pageNumber: currentPage,
            text,
            position: { x, y },
            color: highlightColor,
            type: 'text',
          };
          setAnnotations([...annotations, annotation]);
          redrawAnnotations();
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (toolMode !== 'draw' && toolMode !== 'eraser')) return;

    const rect = annotationCanvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentDrawing(prev => [...prev, { x, y }]);
      
      // Draw in real-time
      const canvas = annotationCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && currentDrawing.length > 0) {
        const lastPoint = currentDrawing[currentDrawing.length - 1];
        ctx.strokeStyle = toolMode === 'eraser' ? '#FFFFFF' : highlightColor;
        ctx.lineWidth = toolMode === 'eraser' ? 20 : 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = toolMode === 'eraser' ? 'destination-out' : 'source-over';
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDrawing.length > 0) {
      if (toolMode === 'draw') {
        const annotation: Annotation = {
          id: `drawing-${Date.now()}`,
          pageNumber: currentPage,
          text: '',
          position: currentDrawing[0],
          color: highlightColor,
          type: 'drawing',
          points: currentDrawing,
          strokeWidth: 2,
        };
        setAnnotations([...annotations, annotation]);
      } else if (toolMode === 'eraser') {
        // Remove annotations that intersect with eraser path
        const eraserRadius = 10;
        const filteredAnnotations = annotations.filter(ann => {
          if (ann.pageNumber !== currentPage) return true;
          if (ann.type !== 'drawing' || !ann.points) return true;
          
          // Check if any point in the annotation intersects with eraser path
          return !ann.points.some(point =>
            currentDrawing.some(eraserPoint =>
              Math.hypot(point.x - eraserPoint.x, point.y - eraserPoint.y) < eraserRadius
            )
          );
        });
        setAnnotations(filteredAnnotations);
        redrawAnnotations();
      }
      setCurrentDrawing([]);
    }
    setIsDrawing(false);
  };

  const handleTextSelection = () => {
    if (toolMode !== 'select') return;
    
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

  const handleHighlightSelection = () => {
    if (!selectedText) return;

    const annotation: Annotation = {
      id: `highlight-${Date.now()}`,
      pageNumber: currentPage,
      text: selectedText,
      position: { x: 0, y: 0 },
      color: highlightColor,
      type: 'highlight',
    };

    setAnnotations([...annotations, annotation]);
    setShowAskButton(false);
    setSelectedText('');
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
    redrawAnnotations();
  };

  const clearAllAnnotations = () => {
    if (confirm('Clear all annotations on this page?')) {
      setAnnotations(annotations.filter(a => a.pageNumber !== currentPage));
      redrawAnnotations();
    }
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  return (
    <div className={isInline ? "flex flex-col h-full" : "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"}>
      <div className={isInline 
        ? "flex flex-col h-full" 
        : "bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col"
      }>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/40 dark:border-gray-700/30">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate" style={{ letterSpacing: '-0.01em' }}>
              {file.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage} of {numPages}
            </p>
          </div>
          
          {/* Toolbar */}
          <div className="flex items-center gap-2 mx-4 flex-wrap">
            {/* Navigation */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="button-secondary px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ◀
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage === numPages}
              className="button-secondary px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ▶
            </button>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            
            {/* Zoom */}
            <button onClick={handleZoomOut} className="button-icon" title="Zoom Out">
              <span className="text-lg">−</span>
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {Math.round(scale * 100)}%
            </span>
            <button onClick={handleZoomIn} className="button-icon" title="Zoom In">
              <span className="text-lg">+</span>
            </button>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            
            {/* Tools */}
            <button
              onClick={() => setToolMode('select')}
              className={`button-icon ${toolMode === 'select' ? 'bg-purple-100 dark:bg-purple-900/30' : ''}`}
              title="Select Text"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </button>
            <button
              onClick={() => setToolMode('highlight')}
              className={`button-icon ${toolMode === 'highlight' ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}
              title="Highlight"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M12 3v18m-7-7l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => setToolMode('text')}
              className={`button-icon ${toolMode === 'text' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
              title="Add Text"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={() => setToolMode('draw')}
              className={`button-icon ${toolMode === 'draw' ? 'bg-green-100 dark:bg-green-900/30' : ''}`}
              title="Draw"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => setToolMode('eraser')}
              className={`button-icon ${toolMode === 'eraser' ? 'bg-red-100 dark:bg-red-900/30' : ''}`}
              title="Eraser"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            
            {/* Color Picker */}
            <input
              type="color"
              value={highlightColor}
              onChange={(e) => setHighlightColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer"
              title="Color"
            />
            
            <button
              onClick={clearAllAnnotations}
              className="button-ghost text-xs"
              title="Clear all annotations on this page"
            >
              Clear
            </button>
          </div>

          <button
            onClick={onClose}
            className="button-icon flex-shrink-0"
            aria-label="Close PDF viewer"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* PDF Content */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto p-6"
          onMouseUp={handleTextSelection}
          style={{
            background: 'var(--color-bg-secondary)',
            cursor: toolMode === 'draw' ? 'crosshair' : toolMode === 'eraser' ? 'cell' : toolMode === 'text' ? 'text' : 'default'
          }}
        >
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden relative">
            {file.type === 'PDF' ? (
              <div className="relative">
                <canvas ref={canvasRef} className="w-full" />
                <canvas
                  ref={annotationCanvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ pointerEvents: toolMode === 'select' ? 'none' : 'auto' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
            ) : (
              <div className="p-8 prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {atob(file.content)}
                </pre>
              </div>
            )}
          </div>

          {/* Selection Actions Popup */}
          {showAskButton && (
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 glass-card p-3 flex gap-2 animate-fade-in-up z-50 shadow-xl">
              <button
                onClick={handleHighlightSelection}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl font-medium transition-all"
              >
                Highlight
              </button>
              <button
                onClick={handleAskAI}
                className="button-primary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ask AI
              </button>
              <button
                onClick={() => setShowAskButton(false)}
                className="button-ghost"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Annotations Sidebar */}
        {annotations.filter(a => a.pageNumber === currentPage).length > 0 && (
          <div className="border-t border-gray-200/40 dark:border-gray-700/30 p-4 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
              Annotations ({annotations.filter(a => a.pageNumber === currentPage).length})
            </h3>
            <div className="space-y-2">
              {annotations
                .filter(a => a.pageNumber === currentPage)
                .map((annotation) => (
                  <div
                    key={annotation.id}
                    className="flex items-start gap-2 p-3 rounded-xl bg-white/60 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/30"
                    style={{ borderLeftWidth: '4px', borderLeftColor: annotation.color }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)} • Page {annotation.pageNumber}
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                        {annotation.text || '(Drawing)'}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAnnotation(annotation.id)}
                      className="button-icon flex-shrink-0"
                    >
                      <CloseIcon className="h-4 w-4" />
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
