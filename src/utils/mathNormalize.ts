// utils/mathNormalize.ts
export function unescapeBackslashes(s: string) {
  // Replace double-escaped backslashes (\\) with single (\)
  return s.replace(/\\\\/g, "\\");
}

export function convertParenDelimitersToDollar(text: string) {
  // Convert \( ... \) and \[ ... \] to $$ ... $$
  text = text.replace(/\\\(/g, "$$");
  text = text.replace(/\\\)/g, "$$");
  text = text.replace(/\\\[/g, "$$");
  text = text.replace(/\\\]/g, "$$");
  return text;
}

export function wrapInlineMathTags(text: string) {
  // Convert <m> ... </m> or <mb>... </mb> pattern to KaTeX-friendly delimiters
  text = text.replace(/<mb>([\s\S]*?)<\/mb>/g, (_, expr) => `\n$$${expr.trim()}$$\n`);
  text = text.replace(/<m>([\s\S]*?)<\/m>/g, (_, expr) => `$$${expr.trim()}$$`);
  return text;
}

export function removeStrayAsterisksAndEmptyListItems(text: string) {
  // Remove lines that are only `*` or `* ` or asterisks left alone
  // Also remove lines which are just markdown bullets without content (common hallucination)
  text = text.replace(/^[\s]*\*[ \t]*$/gm, "");
  // Remove empty list bullets like "- " or "* " alone
  text = text.replace(/^[\s]*[-*]\s*$/gm, "");
  // Remove standalone bullet symbols that create empty boxes
  text = text.replace(/^[\s]*[*\-•\u2022√]\s*$/gm, "");
  return text;
}

export function normalizeLatexSpacing(text: string) {
  // Common fixes: remove duplicate spaces inside $$
  text = text.replace(/\$\$\s+/g, "$$").replace(/\s+\$\$/g, "$$");
  // Clean up excessive newlines
  text = text.replace(/\n{3,}/g, "\n\n");
  return text;
}

export function fixLatexSyntax(text: string) {
  // Fix common LaTeX syntax errors that cause red KaTeX errors
  text = text.replace(/\\left\\frac/g, "\\left(\\frac");
  text = text.replace(/\\right([+\-])/g, "\\right)$1");
  text = text.replace(/\+C\+C/g, "+C");
  text = text.replace(/(\\(?:sin|cos|tan|sec|csc|cot)\^{-1})\\left/g, "$1 \\left");
  return text;
}

export function wrapBareLatexCommands(text: string) {
  // This function aggressively finds and wraps ALL LaTeX commands
  
  // First, handle inline LaTeX mixed with text - extract and wrap each formula
  let processed = text;
  
  // Pattern 1: Find sequences like "\\int x dx = ..." that aren't wrapped
  // Match from a LaTeX command to end of mathematical expression
  const latexPattern = /(\\(?:int|sum|frac|sqrt|log|ln|sin|cos|tan|sec|csc|cot|left|right|operatorname|pm|times|cdot|alpha|beta|gamma|theta|pi|infty|partial|lim|prod|arcsin|arccos|arctan)[^.!?\n]*?(?:[=+\-*/]|dx|dy|dt|du)[^.!?\n]*?)(?=\s*[.!?\n]|$|\s+[A-Z])/g;
  
  processed = processed.replace(latexPattern, (match) => {
    // Don't wrap if already wrapped
    if (match.includes('$$')) return match;
    return `$$${match.trim()}$$`;
  });
  
  // Pattern 2: Handle malformed output like "C$$$\\int ..." - clean up
  processed = processed.replace(/C\$\$\$+/g, 'C ');
  processed = processed.replace(/\$\$\$+/g, '$$');
  
  // Pattern 3: Red text with raw LaTeX - wrap everything between formula markers
  processed = processed.replace(/\\int\s+\\frac\{[^}]+\}\{[^}]+\}[^$\n]+?(?=\s*\w+\s+\w+|$)/g, (match) => {
    if (match.includes('$$')) return match;
    return `$$${match.trim()}$$`;
  });
  
  // Pattern 4: Clean up any remaining bare backslash commands not in $$
  const lines = processed.split('\n');
  const result: string[] = [];
  
  for (let line of lines) {
    // Skip if already has $$
    if (line.includes('$$')) {
      result.push(line);
      continue;
    }
    
    // Check if line has LaTeX commands
    if (/\\(?:int|frac|sin|cos|tan|log|ln|sqrt|left|right|pm|times|cdot)/.test(line)) {
      // Extract prefix (bullets, numbers)
      const prefixMatch = line.match(/^(\s*(?:\d+\.\s*|[*\-•]\s*|#+\s*))/);
      const prefix = prefixMatch ? prefixMatch[1] : '';
      
      // Don't wrap headers
      if (/^#+/.test(prefix)) {
        result.push(line);
        continue;
      }
      
      let content = prefix ? line.slice(prefix.length) : line;
      content = content.trim();
      
      // If it's descriptive text with embedded math, wrap only the math parts
      if (/^(?:Standard|Properties|Important|Special|Some|Integration|Definite|Indefinite)/i.test(content)) {
        // Just wrap inline formulas
        content = content.replace(/(\\[a-z]+\{[^}]+\}|\\[a-z]+\s+[a-z]\s*=)/gi, (m) => `$$${m}$$`);
        result.push(prefix + content);
      } else {
        // Wrap entire mathematical line
        result.push(prefix + `$$${content}$$`);
      }
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

export function cleanMalformedLatex(text: string) {
  let cleaned = text;
  
  // Remove multiple dollar signs
  cleaned = cleaned.replace(/\$\$\$+/g, '$$');
  
  // Fix "C$$$" patterns
  cleaned = cleaned.replace(/C\s*\$\$\$+/g, 'C $$');
  
  // Remove dollar signs that appear mid-formula incorrectly
  cleaned = cleaned.replace(/\$\$([^$]*?)\$\$\$/g, '$$$$1$$');
  cleaned = cleaned.replace(/\$\$\$([^$]*?)\$\$/g, '$$$$1$$');
  
  // Fix red/unrendered text by ensuring it's wrapped
  cleaned = cleaned.replace(/\\int\s+\\frac/g, '$$\\int \\frac');
  cleaned = cleaned.replace(/([+\-])\s*C([^$])/g, '$$1 C$$$$2');
  
  // Remove any stray naked LaTeX commands that slipped through
  cleaned = cleaned.replace(/([^$])\\(int|frac|sin|cos|tan|sqrt|log|ln)\s/g, '$$1 $$\\$$2 ');
  
  return cleaned;
}

export function removeDuplicateEquations(text: string) {
  // Remove duplicate plain-text equations that follow rendered math blocks
  const lines = text.split('\n');
  const filteredLines: string[] = [];
  let lastLineWasMath = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if current line is a math block
    const isMathLine = /^\$\$.*\$\$$/.test(line) || /^\\\[.*\\\]$/.test(line);
    
    if (isMathLine) {
      filteredLines.push(lines[i]);
      lastLineWasMath = true;
      continue;
    }
    
    // Skip plain text math equations that follow a math block
    if (lastLineWasMath && line) {
      // Remove bullet prefix to check content
      const withoutBullet = line.replace(/^[*\-•\u2022]\s*/, '');
      
      // Skip if it looks like a duplicate equation (contains =, dx, +C, etc.)
      if (/(?:dx\s*=|=.*[+\-]\s*C|sin\^?-?1|cos\^?-?1|tan\^?-?1|\\?(?:sin|cos|tan|log|ln)\b)/i.test(withoutBullet)) {
        continue; // Skip this duplicate
      }
    }
    
    // Check if it's a domain note and preserve it
    if (/^(?:\*\s*)?(?:\()?For\s+/i.test(line)) {
      // Normalize domain notes
      const domainNote = line.replace(/^[*\-•\u2022]\s*/, '').replace(/^\(/, '').replace(/\)$/, '');
      filteredLines.push(`(${domainNote})`);
      lastLineWasMath = false;
      continue;
    }
    
    // Skip empty lines or standalone symbols after math
    if (lastLineWasMath && (/^[*\-•\u2022√]\s*$/.test(line) || !line)) {
      if (!line) {
        filteredLines.push(''); // Keep empty lines for spacing
      }
      continue;
    }
    
    filteredLines.push(lines[i]);
    lastLineWasMath = false;
  }

  return filteredLines.join('\n');
}

export function normalizeAIOutput(raw: string) {
  if (!raw) return raw;
  
  let processed = raw;
  
  // Step 1: Unescape backslashes
  processed = unescapeBackslashes(processed);
  
  // Step 2: Convert custom math tags
  processed = wrapInlineMathTags(processed);
  
  // Step 3: Convert LaTeX delimiters to consistent format
  processed = convertParenDelimitersToDollar(processed);
  
  // Step 4: Wrap any remaining bare LaTeX commands
  processed = wrapBareLatexCommands(processed);
  
  // Step 5: Remove duplicate equations
  processed = removeDuplicateEquations(processed);
  
  // Step 6: Remove stray asterisks and empty bullets
  processed = removeStrayAsterisksAndEmptyListItems(processed);
  
  // Step 7: Fix LaTeX syntax errors
  processed = fixLatexSyntax(processed);
  
  // Step 8: Normalize spacing
  processed = normalizeLatexSpacing(processed);
  
  return processed;
}