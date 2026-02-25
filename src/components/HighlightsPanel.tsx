import { useState, useEffect } from 'react';
import { 
  Highlighter, 
  Trash2, 
  Filter, 
  Search, 
  BookOpen,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import { 
  getHighlightsSummary, 
  deleteHighlight,
  type HighlightsSummary,
  type Highlight 
} from '../services/highlightsService';

interface HighlightsPanelProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
  onAskAboutHighlight: (highlightContent: string) => void;
  onJumpToPage?: (pageNumber: number) => void;
}

const COLOR_LABELS: Record<string, string> = {
  yellow: 'Yellow',
  green: 'Green', 
  red: 'Red',
  blue: 'Blue',
  orange: 'Orange',
  pink: 'Pink',
  purple: 'Purple',
};

const COLOR_VALUES: Record<string, string> = {
  yellow: '#FFEB3B',
  green: '#4CAF50',
  red: '#F44336',
  blue: '#2196F3',
  orange: '#FF9800',
  pink: '#E91E63',
  purple: '#9C27B0',
};

const HighlightsPanel: React.FC<HighlightsPanelProps> = ({
  documentId,
  documentTitle,
  onClose,
  onAskAboutHighlight,
  onJumpToPage,
}) => {
  const [summary, setSummary] = useState<HighlightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedColors, setExpandedColors] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHighlights();
  }, [documentId]);

  const loadHighlights = async () => {
    setLoading(true);
    const data = await getHighlightsSummary(documentId);
    setSummary(data);
    
    // Expand all colors by default
    if (data?.by_color) {
      setExpandedColors(new Set(Object.keys(data.by_color)));
    }
    setLoading(false);
  };

  const handleDelete = async (highlightId: string) => {
    if (confirm('Delete this highlight?')) {
      await deleteHighlight(highlightId);
      loadHighlights();
    }
  };

  const toggleColor = (color: string) => {
    setExpandedColors(prev => {
      const next = new Set(prev);
      if (next.has(color)) {
        next.delete(color);
      } else {
        next.add(color);
      }
      return next;
    });
  };

  const filteredHighlights = summary?.by_color 
    ? Object.entries(summary.by_color).reduce((acc, [color, highlights]) => {
        const filtered = highlights.filter(h => 
          h.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[color] = filtered;
        }
        return acc;
      }, {} as Record<string, Highlight[]>)
    : null;

  const totalHighlights = summary?.total || 0;

  return (
    <div 
      className="flex flex-col h-full"
      style={{
        background: 'var(--color-bg-primary)',
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          borderColor: 'var(--color-border-light)',
          background: 'var(--color-bg-elevated)',
        }}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" style={{ color: '#35d0c3' }} />
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Highlights
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {totalHighlights} from {documentTitle}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ 
            background: 'var(--color-surface-soft)',
            border: '1px solid var(--color-border-light)'
          }}
        >
          <Search className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search highlights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      {/* Color Filter */}
      {summary?.by_color && Object.keys(summary.by_color).length > 1 && (
        <div className="px-4 py-2 border-b flex gap-2 overflow-x-auto" style={{ borderColor: 'var(--color-border-light)' }}>
          <button
            onClick={() => setSelectedColor(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedColor ? 'ring-2 ring-offset-1' : ''
            }`}
            style={{
              background: !selectedColor ? '#35d0c320' : 'var(--color-surface-soft)',
              color: !selectedColor ? '#35d0c3' : 'var(--color-text-secondary)',
              outlineColor: '#35d0c3',
            }}
          >
            All ({totalHighlights})
          </button>
          {Object.entries(summary.by_color).map(([color, highlights]) => (
            <button
              key={color}
              onClick={() => setSelectedColor(selectedColor === color ? null : color)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                selectedColor === color ? 'ring-2 ring-offset-1' : ''
              }`}
              style={{
                background: `${COLOR_VALUES[color] || '#FFEB3B'}30`,
                color: COLOR_VALUES[color] || '#FFEB3B',
                outlineColor: COLOR_VALUES[color] || '#FFEB3B',
              }}
            >
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ background: COLOR_VALUES[color] || '#FFEB3B' }}
              />
              {COLOR_LABELS[color] || color} ({highlights.length})
            </button>
          ))}
        </div>
      )}

      {/* Highlights List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : !filteredHighlights || Object.keys(filteredHighlights).length === 0 ? (
          <div className="text-center py-8">
            <Highlighter className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {searchQuery ? 'No highlights match your search' : 'No highlights yet'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Select text in the document to highlight
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(filteredHighlights)
              .filter(([color]) => !selectedColor || selectedColor === color)
              .map(([color, highlights]) => (
                <div key={color}>
                  {/* Color Header */}
                  <button
                    onClick={() => toggleColor(color)}
                    className="flex items-center gap-2 w-full py-1.5 px-2 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    {expandedColors.has(color) ? (
                      <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    ) : (
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    )}
                    <span 
                      className="w-3 h-3 rounded-sm"
                      style={{ background: COLOR_VALUES[color] || '#FFEB3B' }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {COLOR_LABELS[color] || color}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      ({highlights.length})
                    </span>
                  </button>

                  {/* Highlights */}
                  {expandedColors.has(color) && (
                    <div className="ml-4 space-y-2 mt-1">
                      {highlights.map((highlight) => (
                        <div
                          key={highlight.id}
                          className="p-3 rounded-lg border group"
                          style={{
                            background: `${COLOR_VALUES[color] || '#FFEB3B'}15`,
                            borderColor: `${COLOR_VALUES[color] || '#FFEB3B'}40`,
                          }}
                        >
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                            {highlight.content}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              {highlight.page_number && (
                                <span 
                                  className="text-xs px-2 py-0.5 rounded"
                                  style={{ 
                                    background: 'var(--color-surface-soft)',
                                    color: 'var(--color-text-secondary)' 
                                  }}
                                >
                                  Page {highlight.page_number}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onAskAboutHighlight(highlight.content)}
                                className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                                title="Ask about this"
                              >
                                <Sparkles className="w-3.5 h-3.5" style={{ color: '#35d0c3' }} />
                              </button>
                              <button
                                onClick={() => handleDelete(highlight.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div 
        className="px-4 py-3 border-t"
        style={{ borderColor: 'var(--color-border-light)' }}
      >
        <button
          onClick={() => onAskAboutHighlight('all my highlights')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
            color: '#FFFFFF',
          }}
        >
          <Sparkles className="w-4 h-4" />
          Ask AI about my highlights
        </button>
      </div>
    </div>
  );
};

export default HighlightsPanel;
