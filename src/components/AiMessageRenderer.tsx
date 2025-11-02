import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface ContentBlock {
  type: 'text' | 'math';
  value: string;
}

interface AiMessageRendererProps {
  blocks: ContentBlock[];
  className?: string;
}

/**
 * Renders LaTeX math expression using KaTeX
 * @param latex Pure LaTeX string (no delimiters)
 * @returns HTML markup object for dangerouslySetInnerHTML
 */
function renderLatex(latex: string): { __html: string } {
  try {
    // Render to HTML string (safe) with display mode for block equations
    return {
      __html: katex.renderToString(latex, {
        throwOnError: false, // Prevents red crashes, shows escaped LaTeX on error
        displayMode: true,   // Display mode for block equations
        strict: false,       // Allow some non-standard LaTeX
        trust: false,        // Don't allow raw HTML
      })
    };
  } catch (e) {
    // Fallback: return escaped LaTeX inside <pre> to avoid red errors
    console.error('KaTeX rendering error:', e);
    return { __html: `<pre class="katex-error">${escapeHtml(latex)}</pre>` };
  }
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * AiMessageRenderer Component
 * 
 * Renders structured AI messages with separate text and math blocks.
 * Math blocks are rendered using KaTeX for beautiful mathematical typography.
 * 
 * CRITICAL FEATURES:
 * - Renders each block exactly once (no duplication)
 * - Text blocks are plain HTML paragraphs
 * - Math blocks are rendered via KaTeX with display mode
 * - Errors are caught and displayed gracefully
 * - No raw LaTeX is shown to users (only rendered or escaped fallback)
 */
export const AiMessageRenderer: React.FC<AiMessageRendererProps> = ({ blocks, className = '' }) => {
  console.log('🎨 AiMessageRenderer called with blocks:', blocks);
  
  if (!blocks || blocks.length === 0) {
    console.warn('⚠️  AiMessageRenderer: No blocks to display');
    return (
      <p className="text-gray-400 dark:text-gray-500 italic">
        No content to display
      </p>
    );
  }

  return (
    <div className={`ai-message-blocks space-y-3 ${className}`}>
      {blocks.map((block, index) => {
        console.log(`Rendering block ${index}:`, block);
        
        if (block.type === 'text') {
          return (
            <div
              key={`text-${index}`}
              className="ai-text text-sm leading-relaxed whitespace-pre-wrap"
              style={{ lineHeight: '1.7' }}
            >
              {block.value}
            </div>
          );
        }

        if (block.type === 'math') {
          return (
            <div
              key={`math-${index}`}
              className="ai-math my-4 overflow-x-auto"
              dangerouslySetInnerHTML={renderLatex(block.value)}
            />
          );
        }

        // Unknown block type - shouldn't happen but handle gracefully
        return (
          <div
            key={`unknown-${index}`}
            className="text-red-500 dark:text-red-400 text-xs"
          >
            Unknown block type: {(block as any).type}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Debug version of AiMessageRenderer
 * Shows raw block data for troubleshooting
 */
export const AiMessageRendererDebug: React.FC<AiMessageRendererProps & { rawResponse?: string }> = ({
  blocks,
  rawResponse,
  className = ''
}) => {
  const [showDebug, setShowDebug] = React.useState(false);

  return (
    <div className={className}>
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="mb-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        {showDebug ? '🔍 Hide Debug' : '🔍 Show Debug'}
      </button>

      {showDebug && (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs space-y-3 overflow-auto max-h-96">
          {rawResponse && (
            <div>
              <h4 className="font-bold mb-1">Raw AI Output:</h4>
              <pre className="whitespace-pre-wrap break-words">{rawResponse}</pre>
            </div>
          )}
          <div>
            <h4 className="font-bold mb-1">Parsed Blocks ({blocks.length}):</h4>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(blocks, null, 2)}</pre>
          </div>
        </div>
      )}

      <AiMessageRenderer blocks={blocks} />
    </div>
  );
};

export default AiMessageRenderer;
