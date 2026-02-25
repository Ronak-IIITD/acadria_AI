import { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical, ChevronDown, ChevronUp, FileText, X } from 'lucide-react';

interface SplitViewProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  initialLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

const SplitView: React.FC<SplitViewProps> = ({
  leftPanel,
  rightPanel,
  initialLeftWidth = 50,
  minLeftWidth = 30,
  maxLeftWidth = 70,
}) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
      setLeftWidth(newLeftWidth);
    }
  }, [minLeftWidth, maxLeftWidth]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setLeftWidth(isCollapsed ? initialLeftWidth : 0);
  };

  return (
    <div 
      ref={containerRef}
      className="flex h-full w-full overflow-hidden"
    >
      {/* Left Panel - Document */}
      <div 
        className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          width: isCollapsed ? '0px' : `${leftWidth}%`,
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        {leftPanel}
      </div>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className="relative flex-shrink-0 w-1 cursor-col-resize group"
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div 
            className="absolute inset-y-0 -left-1 -right-1 hover:bg-blue-500/20 transition-colors"
          />
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 rounded-full transition-colors ${
              isHovering ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
          <GripVertical 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 transition-opacity ${
              isHovering ? 'opacity-100 text-blue-500' : 'opacity-0'
            }`}
          />
        </div>
      )}

      {/* Right Panel - Chat */}
      <div 
        className="flex-1 overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          width: isCollapsed ? '100%' : `${100 - leftWidth}%`,
        }}
      >
        {rightPanel}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full shadow-lg border transition-all hover:scale-110"
        style={{
          background: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border-light)',
          left: isCollapsed ? '1rem' : `${leftWidth}%`,
        }}
        title={isCollapsed ? "Show document" : "Hide document"}
      >
        {isCollapsed ? (
          <FileText className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        ) : (
          <ChevronDown className="w-4 h-4 rotate-90" style={{ color: 'var(--color-text-secondary)' }} />
        )}
      </button>
    </div>
  );
};

export default SplitView;
