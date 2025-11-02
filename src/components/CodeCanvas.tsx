import React, { useState, useContext } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThemeContext } from '../contexts/ThemeContext';

interface CodeCanvasProps {
  code: string;
  language: string;
  filename?: string;
}

const CodeCanvas: React.FC<CodeCanvasProps> = ({ code, language, filename }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useContext(ThemeContext);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Get language display name
  const getLanguageName = (lang: string): string => {
    const langMap: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'csharp': 'C#',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'sql': 'SQL',
      'bash': 'Bash',
      'shell': 'Shell',
      'jsx': 'JSX',
      'tsx': 'TSX'
    };
    return langMap[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  return (
    <div 
      style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-border-medium)',
        background: 'var(--color-bg-elevated)',
        boxShadow: 'var(--shadow-md)',
        marginTop: '1rem',
        marginBottom: '1rem',
        maxWidth: '100%',
        width: '100%'
      }}
    >
      {/* Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border-medium)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div 
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#FF5F56'
            }}
          />
          <div 
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#FFBD2E'
            }}
          />
          <div 
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#27C93F'
            }}
          />
          <span 
            style={{
              marginLeft: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-text-primary)'
            }}
          >
            {filename || getLanguageName(language)}
          </span>
        </div>
        
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: copied ? 'var(--color-success-soft)' : 'transparent',
            color: copied ? 'var(--color-success)' : 'var(--color-text-secondary)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.background = 'var(--color-accent-primary-soft)';
              e.currentTarget.style.color = 'var(--color-accent-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy code
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div 
        style={{
          maxHeight: '500px',
          overflowY: 'auto',
          overflowX: 'auto'
        }}
      >
        <SyntaxHighlighter
          language={language}
          style={theme === 'dark' ? vscDarkPlus : oneLight}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            background: theme === 'dark' ? '#1E1E1E' : '#FAFBFC',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            borderRadius: 0
          }}
          showLineNumbers={true}
          wrapLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeCanvas;
