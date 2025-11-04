import { useState, useRef, useEffect } from 'react';
import type { StudyFile } from '../types';

interface PdfViewerProps {
  file: StudyFile;
  onClose: () => void;
  onAskAboutSelection: (selectedText: string) => void;
  isInline?: boolean;
}

const ZOOM_LEVELS = [
  50,
  75,
  100,
  125,
  150,
  175,
  200,
  250,
  300,
  350,
  400,
  450,
  500,
  600,
  700,
  800,
] as const;

interface Annotation {
  id: string;
  pageNumber: number;
  text: string;
  position: { x: number; y: number }; // Normalized coordinates (0-1)
  width?: number; // Normalized width (0-1)
  height?: number; // Normalized height (0-1)
  color: string;
  type: 'highlight' | 'note' | 'text' | 'drawing';
  strokeWidth?: number;
  points?: { x: number; y: number }[]; // Normalized coordinates (0-1)
}

type ToolMode = 'select' | 'highlight' | 'text' | 'draw' | 'eraser';

const PdfViewer = ({ file, onClose, onAskAboutSelection, isInline = false }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showAskButton, setShowAskButton] = useState(false);
  const [highlightColor, setHighlightColor] = useState<string>('#FFEB3B');
  const [highlightOpacity, setHighlightOpacity] = useState<number>(0.4);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<{ x: number; y: number }[]>([]);
  const [scale, setScale] = useState<number>(1.5);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);

  // Clear annotations when file changes
  useEffect(() => {
    setAnnotations([]);
    setCurrentPage(1);
    setScale(1.5);
    setToolMode('select');
  }, [file.id]);

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

  // Render current page when dependencies change
  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(pdfDocument, currentPage);
    }
  }, [pdfDocument, currentPage, scale]);

  // Keep annotations in sync with render cycle
  useEffect(() => {
    redrawAnnotations();
  }, [annotations, currentPage, scale]);

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const annotationCanvas = annotationCanvasRef.current;
      
      if (!canvas || !annotationCanvas) return;

      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return;

      const viewport = page.getViewport({ scale });
      
      // Use device pixel ratio for sharper rendering on high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      
      annotationCanvas.width = viewport.width * dpr;
      annotationCanvas.height = viewport.height * dpr;
      annotationCanvas.style.width = `${viewport.width}px`;
      annotationCanvas.style.height = `${viewport.height}px`;

      // Scale the context to account for device pixel ratio
      context.scale(dpr, dpr);

      // Enable image smoothing for better quality
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

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

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale context for device pixel ratio
    ctx.save();
    ctx.scale(dpr, dpr);

    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;

    // Draw annotations for current page
    annotations
      .filter(ann => ann.pageNumber === currentPage)
      .forEach(ann => {
        if (ann.type === 'highlight' && ann.width && ann.height) {
          // Convert hex color to rgba with opacity
          const hex = ann.color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${highlightOpacity})`;
          // Convert normalized coordinates to pixel coordinates
          ctx.fillRect(
            ann.position.x * canvasWidth,
            ann.position.y * canvasHeight,
            ann.width * canvasWidth,
            ann.height * canvasHeight
          );
        } else if (ann.type === 'drawing' && ann.points) {
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.strokeWidth || 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ann.points.forEach((point, i) => {
            // Convert normalized coordinates to pixel coordinates
            const x = point.x * canvasWidth;
            const y = point.y * canvasHeight;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        } else if (ann.type === 'text') {
          ctx.fillStyle = ann.color;
          ctx.font = '16px Arial';
          // Convert normalized coordinates to pixel coordinates
          ctx.fillText(
            ann.text,
            ann.position.x * canvasWidth,
            ann.position.y * canvasHeight
          );
        }
      });

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (toolMode === 'draw' || toolMode === 'eraser' || toolMode === 'highlight') {
      setIsDrawing(true);
      const canvas = annotationCanvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      if (rect && canvas) {
        const x = (e.clientX - rect.left) / rect.width; // Normalize to 0-1 using display size
        const y = (e.clientY - rect.top) / rect.height; // Normalize to 0-1 using display size
        setCurrentDrawing([{ x, y }]);
      }
    } else if (toolMode === 'text') {
      const canvas = annotationCanvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      if (rect && canvas) {
        const x = (e.clientX - rect.left) / rect.width; // Normalize to 0-1 using display size
        const y = (e.clientY - rect.top) / rect.height; // Normalize to 0-1 using display size
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
          setAnnotations(prev => [...prev, annotation]);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (toolMode !== 'draw' && toolMode !== 'eraser' && toolMode !== 'highlight')) return;

    const canvas = annotationCanvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (rect && canvas) {
      const dpr = window.devicePixelRatio || 1;
      const x = (e.clientX - rect.left) / rect.width; // Normalize to 0-1 using display size
      const y = (e.clientY - rect.top) / rect.height; // Normalize to 0-1 using display size
      
      if (toolMode === 'highlight') {
        // For highlight, just update the end point (don't accumulate all points)
        setCurrentDrawing(prev => prev.length > 0 ? [prev[0], { x, y }] : [{ x, y }]);
        
        // Draw live preview of highlight rectangle
        redrawAnnotations(); // First redraw existing annotations
        const ctx = canvas?.getContext('2d');
        if (ctx && currentDrawing.length > 0) {
          const startPoint = currentDrawing[0];
          const displayWidth = canvas.width / dpr;
          const displayHeight = canvas.height / dpr;
          
          const minX = Math.min(startPoint.x, x);
          const minY = Math.min(startPoint.y, y);
          const width = Math.abs(x - startPoint.x);
          const height = Math.abs(y - startPoint.y);
          
          ctx.save();
          ctx.scale(dpr, dpr);
          
          // Convert hex to rgba
          const hex = highlightColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${highlightOpacity})`;
          
          ctx.fillRect(
            minX * displayWidth,
            minY * displayHeight,
            width * displayWidth,
            height * displayHeight
          );
          ctx.restore();
        }
      } else {
        setCurrentDrawing(prev => [...prev, { x, y }]);
        
        // Draw in real-time for draw and eraser tools
        const ctx = canvas?.getContext('2d');
        if (ctx && currentDrawing.length > 0) {
          const lastPoint = currentDrawing[currentDrawing.length - 1];
          const displayWidth = canvas.width / dpr;
          const displayHeight = canvas.height / dpr;
          
          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.strokeStyle = toolMode === 'eraser' ? '#FFFFFF' : highlightColor;
          ctx.lineWidth = toolMode === 'eraser' ? 20 : 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalCompositeOperation = toolMode === 'eraser' ? 'destination-out' : 'source-over';
          ctx.beginPath();
          ctx.moveTo(lastPoint.x * displayWidth, lastPoint.y * displayHeight);
          ctx.lineTo(x * displayWidth, y * displayHeight);
          ctx.stroke();
          ctx.restore();
        }
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
        setAnnotations(prev => [...prev, annotation]);
      } else if (toolMode === 'highlight') {
        // Create a highlight rectangle from the drawn path
        if (currentDrawing.length >= 2) {
          const xs = currentDrawing.map(p => p.x);
          const ys = currentDrawing.map(p => p.y);
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const maxX = Math.max(...xs);
          const maxY = Math.max(...ys);
          
          const annotation: Annotation = {
            id: `highlight-${Date.now()}`,
            pageNumber: currentPage,
            text: '',
            position: { x: minX, y: minY },
            width: maxX - minX,
            height: maxY - minY,
            color: highlightColor,
            type: 'highlight',
          };
          setAnnotations(prev => [...prev, annotation]);
        }
      } else if (toolMode === 'eraser') {
        // Remove annotations that intersect with eraser path (coordinates are already normalized)
        const eraserRadius = 0.02; // Normalized radius (relative to canvas size) - increased for better erasing
        setAnnotations(prev =>
          prev.filter(ann => {
            if (ann.pageNumber !== currentPage) return true;
            
            // Check if annotation intersects with eraser path
            if (ann.type === 'drawing' && ann.points) {
              // For drawings, check if any point intersects
              return !ann.points.some(point =>
                currentDrawing.some(eraserPoint =>
                  Math.hypot(point.x - eraserPoint.x, point.y - eraserPoint.y) < eraserRadius
                )
              );
            } else if (ann.type === 'highlight' && ann.width && ann.height) {
              // For highlights, check if eraser path intersects the rectangle
              return !currentDrawing.some(eraserPoint => {
                const inRectX = eraserPoint.x >= ann.position.x && 
                               eraserPoint.x <= ann.position.x + (ann.width || 0);
                const inRectY = eraserPoint.y >= ann.position.y && 
                               eraserPoint.y <= ann.position.y + (ann.height || 0);
                return inRectX && inRectY;
              });
            } else if (ann.type === 'text') {
              // For text annotations, check if eraser is near the position
              return !currentDrawing.some(eraserPoint =>
                Math.hypot(ann.position.x - eraserPoint.x, ann.position.y - eraserPoint.y) < eraserRadius * 2
              );
            }
            
            return true;
          })
        );
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

    // Get the selection range to find its bounding box
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    
    if (rects.length === 0) return;

    const canvas = canvasRef.current;
    const canvasRect = canvas?.getBoundingClientRect();
    if (!canvasRect || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.width / dpr;
    const displayHeight = canvas.height / dpr;

    // Convert each selection rectangle to normalized coordinates and create annotations
    Array.from(rects).forEach((rect, index) => {
      const x = (rect.left - canvasRect.left) / displayWidth;
      const y = (rect.top - canvasRect.top) / displayHeight;
      const width = rect.width / displayWidth;
      const height = rect.height / displayHeight;

      // Only create annotation if it's within the canvas bounds
      if (x >= 0 && y >= 0 && x + width <= 1 && y + height <= 1) {
        const annotation: Annotation = {
          id: `highlight-${Date.now()}-${index}`,
          pageNumber: currentPage,
          text: selectedText,
          position: { x, y },
          width,
          height,
          color: highlightColor,
          type: 'highlight',
        };
        setAnnotations(prev => [...prev, annotation]);
      }
    });

    setShowAskButton(false);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const clearAllAnnotations = () => {
    if (confirm('Clear all annotations on this page?')) {
      setAnnotations(prev => prev.filter(a => a.pageNumber !== currentPage));
    }
  };

  const getZoomIndex = (percent: number) => {
    const rounded = Math.round(percent);
    let idx = ZOOM_LEVELS.findIndex(level => level === rounded);
    if (idx === -1) {
      // Find closest zoom level when current scale isn't in the preset list
  let closest: typeof ZOOM_LEVELS[number] = ZOOM_LEVELS[0];
      let minDiff = Math.abs(rounded - closest);
      ZOOM_LEVELS.forEach(level => {
        const diff = Math.abs(rounded - level);
        if (diff < minDiff) {
          closest = level;
          minDiff = diff;
        }
      });
      idx = ZOOM_LEVELS.findIndex(level => level === closest);
    }
    return idx;
  };

  const handleZoomStep = (direction: 'in' | 'out') => {
    setScale(prev => {
      const percent = prev * 100;
      const currentIdx = getZoomIndex(percent);
      const delta = direction === 'in' ? 1 : -1;
      const targetIdx = Math.min(
        ZOOM_LEVELS.length - 1,
        Math.max(0, currentIdx + delta)
      );
      return ZOOM_LEVELS[targetIdx] / 100;
    });
  };

  const handleZoomIn = () => handleZoomStep('in');
  const handleZoomOut = () => handleZoomStep('out');

  const handleZoomSelect = (value: string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    const rounded = Math.round(numeric);
    const clamped = Math.min(Math.max(rounded, ZOOM_LEVELS[0]), ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
    setScale(clamped / 100);
  };

  const handlePageInputChange = (value: string) => {
    if (numPages < 1) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const rounded = Math.round(parsed);
    const clamped = Math.min(Math.max(rounded, 1), numPages);
    setCurrentPage(clamped);
  };

  return (
    <div className={isInline ? "flex flex-col h-full" : "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"}>
      <div className={isInline 
        ? "flex flex-col h-full min-h-0" 
        : "bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col min-h-0"
      }>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200/30 dark:border-gray-700/20 flex-shrink-0 overflow-x-auto" style={{
          background: 'rgba(249, 250, 251, 0.8)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="flex items-center gap-3 flex-shrink-0">
            <h2 className="text-sm font-bold truncate max-w-[150px] md:max-w-[200px]" style={{ color: '#1a1a1a' }}>
              {file.name}
            </h2>
          </div>
          
          {/* Compact Toolbar */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Page Navigation */}
            <div
              className="hidden sm:flex items-center overflow-hidden rounded-xl border text-black"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-light)'
              }}
            >
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 flex items-center justify-center transition-colors border-r hover:bg-black/5 active:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
                style={{ borderColor: 'var(--color-border-light)' }}
                title="Previous"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2 px-3 py-1">
                <input
                  type="number"
                  min={1}
                  max={numPages}
                  value={currentPage}
                  onChange={(e) => handlePageInputChange(e.target.value)}
                  className="w-12 bg-transparent text-center text-sm font-semibold text-black outline-none appearance-none"
                />
                <span className="text-xs font-medium text-black/60">/ {numPages}</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage === numPages}
                className="h-8 w-8 flex items-center justify-center transition-colors border-l hover:bg-black/5 active:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
                style={{ borderColor: 'var(--color-border-light)' }}
                title="Next"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Mobile Page Navigation */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors text-black hover:bg-black/5 active:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-light)'
                }}
                title="Previous"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-2 text-xs font-semibold text-black">{currentPage}/{numPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage === numPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors text-black hover:bg-black/5 active:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-light)'
                }}
                title="Next"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div
              className="hidden md:flex items-center overflow-hidden rounded-xl border text-black"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-light)'
              }}
            >
              <button
                type="button"
                onClick={handleZoomOut}
                className="h-8 w-8 flex items-center justify-center transition-colors border-r hover:bg-black/5 active:bg-black/10"
                style={{ borderColor: 'var(--color-border-light)' }}
                title="Zoom out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <select
                value={Math.round(scale * 100).toString()}
                onChange={(e) => handleZoomSelect(e.target.value)}
                className="bg-transparent px-3 text-sm font-semibold text-black outline-none cursor-pointer"
              >
                {ZOOM_LEVELS.map(level => (
                  <option key={level} value={level.toString()}>{level}%</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleZoomIn}
                className="h-8 w-8 flex items-center justify-center transition-colors border-l hover:bg-black/5 active:bg-black/10"
                style={{ borderColor: 'var(--color-border-light)' }}
                title="Zoom in"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
            </div>

            {/* Annotation Tools */}
            <div
              className="hidden lg:flex items-center gap-1 rounded-xl border px-1 text-black"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-light)'
              }}
            >
              {(
                [
                  { id: 'select', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                    </svg>
                  ) },
                  { id: 'draw', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  ) },
                  { id: 'highlight', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M10 8h4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  ) },
                  { id: 'text', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <text x="50%" y="70%" textAnchor="middle" fontSize="18" fontWeight="bold" fill="currentColor" stroke="none">T</text>
                    </svg>
                  ) },
                  { id: 'eraser', icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5l4 4L9 19H5v-4L16.5 3.5z" opacity="0.6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8l4 4" />
                    </svg>
                  ) }
                ] as const
              ).map(tool => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setToolMode(tool.id as ToolMode)}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5 active:bg-black/10 ${
                    toolMode === tool.id ? 'bg-black/10 shadow-inner' : ''
                  }`}
                  aria-pressed={toolMode === tool.id}
                  title={tool.id.charAt(0).toUpperCase() + tool.id.slice(1)}
                >
                  {tool.icon}
                </button>
              ))}
              <label
                className="relative h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5 cursor-pointer"
                title="Color"
              >
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{ backgroundColor: highlightColor, borderColor: 'var(--color-border-light)' }}
                />
              </label>
              
              {/* Opacity Slider for Highlight */}
              {toolMode === 'highlight' && (
                <div className="flex items-center gap-2 px-2 border-l" style={{ borderColor: 'var(--color-border-light)' }}>
                  <svg className="w-3 h-3 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={highlightOpacity * 100}
                    onChange={(e) => setHighlightOpacity(parseInt(e.target.value) / 100)}
                    className="w-16 h-1 bg-black/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${highlightColor}33 0%, ${highlightColor} 100%)`
                    }}
                    title={`Opacity: ${Math.round(highlightOpacity * 100)}%`}
                  />
                  <svg className="w-3 h-3 text-black/60" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="4" y="12" width="16" height="2" rx="1" />
                  </svg>
                </div>
              )}
            </div>

            {/* Clear Button */}
            <button
              type="button"
              onClick={clearAllAnnotations}
              className="hidden md:block rounded-xl border px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-black/5 active:bg-black/10"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-light)'
              }}
              title="Clear"
            >
              Clear
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto min-h-0"
          onMouseUp={handleTextSelection}
          style={{
            background: '#525659',
            cursor: toolMode === 'draw' ? 'crosshair' : toolMode === 'eraser' ? 'cell' : toolMode === 'text' ? 'text' : toolMode === 'highlight' ? 'crosshair' : 'default'
          }}
        >
          <div className="mx-auto bg-white shadow-lg relative" style={{ width: 'fit-content' }}>
            {file.type === 'PDF' ? (
              <div className="relative">
                <canvas ref={canvasRef} style={{ display: 'block' }} />
                <canvas
                  ref={annotationCanvasRef}
                  className="absolute top-0 left-0"
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
      </div>
    </div>
  );
};

export default PdfViewer;
