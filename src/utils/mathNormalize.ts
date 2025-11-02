// utils/mathNormalize.ts

/**
 * CRITICAL: Remove all malformed HTML-like tags that AI hallucinates
 * The AI sometimes outputs <mb>, <mb1>, </mb>, <m>, etc. which break rendering
 */
export function stripMalformedHTMLTags(text: string): string {
  let cleaned = text;
  
  // Remove ALL <mb...> and </mb> tags (these are AI hallucinations, not real HTML)
  cleaned = cleaned.replace(/<\/?mb\d*>/gi, '');
  
  // Remove <m> and </m> tags  
  cleaned = cleaned.replace(/<\/?m\d*>/gi, '');
  
  // Remove other common malformed tags
  cleaned = cleaned.replace(/<\$+/g, '');
  cleaned = cleaned.replace(/\$+>/g, '');
  
  // Clean up C$$2/mb> type garbage
  cleaned = cleaned.replace(/C\$\$\d+\/mb>/gi, '+ C');
  // NOTE: Do NOT remove tokens like "$1" globally; that breaks valid math like $1/x$.
  
  return cleaned;
}

export function unescapeBackslashes(s: string) {
  // Replace double-escaped backslashes (\\) with single (\)
  return s.replace(/\\\\/g, "\\");
}

export function convertParenDelimitersToDollar(text: string) {
  // Convert \( ... \) to inline $...$ and \[ ... \] to display $$...$$
  text = text.replace(/\\\(/g, "$");
  text = text.replace(/\\\)/g, "$");
  text = text.replace(/\\\[/g, "$$");
  text = text.replace(/\\\]/g, "$$");
  return text;
}

// Convert short $$...$$ spans that appear inside sentences into inline $...$
// Heuristic: single-line, <= 30 chars, and does not contain big display operators
export function convertShortDoubleToSingle(text: string) {
  return text.replace(/\$\$([^\n$]{1,80}?)\$\$/g, (m, inner: string) => {
    const trimmed = inner.trim();
    // Keep display math for anything complex or multi-symbol
    const hasDisplayCmd = /\\(int|sum|prod|begin|end|frac|sqrt|left|right|lim)/.test(trimmed);
    const hasOperators = /[=+\-*]/.test(trimmed);
    const hasSpaces = /\s/.test(trimmed);
    if (hasDisplayCmd || hasOperators || hasSpaces) {
      return `$$${trimmed}$$`;
    }

    // Only convert very short tokens (e.g. $$k$$) to inline math
    if (trimmed.length <= 12) {
      return `$${trimmed}$`;
    }

    return `$$${trimmed}$$`;
  });
}

export function wrapInlineMathTags(text: string) {
  // If you use <m> ... </m> or <mb>... </mb> pattern (if you adopted it),
  // convert them to KaTeX-friendly delimiters.
  // BUT: AI generates malformed versions, so we skip this for now
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
  text = text.replace(/\$\$[ \t]+/g, "$$").replace(/[ \t]+\$\$/g, "$$");
  // Clean up excessive newlines
  text = text.replace(/\n{3,}/g, "\n\n");
  // Fix multiple dollar signs
  text = text.replace(/\$\$\$+/g, "$$");
  return text;
}

// Ensure readable spacing around inline and display math delimiters when adjacent to words
export function ensureSpacingAroundMath(text: string) {
  // Add a space before $$ when attached to a word/number
  text = text.replace(/([A-Za-z0-9])\$\$/g, '$1 $$');
  // Add a space after $$ when attached to a word/number
  text = text.replace(/\$\$([A-Za-z0-9])/g, '$$ $1');
  // Same for single $
  text = text.replace(/([A-Za-z0-9])\$/g, '$1 $');
  text = text.replace(/\$([A-Za-z0-9])/g, '$ $1');
  // Collapse multiple spaces
  text = text.replace(/\s{3,}/g, '  ');
  return text;
}

// Make sure display math (double dollars) sits on its own line for Markdown rendering
export function ensureBlockMathOnOwnLine(text: string) {
  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    if (!line.includes('$$')) {
      result.push(line);
      continue;
    }

    const segments = line.split('$$');
    let buffer = '';

    segments.forEach((segment, index) => {
      if (index % 2 === 0) {
        // Regular text segment
        const textPart = segment.trim();
        if (textPart) {
          if (buffer) {
            buffer += textPart;
          } else {
            buffer = textPart;
          }
        }
        return;
      }

      // segment is math content
      if (buffer) {
        result.push(buffer.trimEnd());
        buffer = '';
      }
      result.push(`$$${segment.trim()}$$`);
    });

    if (buffer) {
      result.push(buffer.trim());
    }
  }

  return result.join('\n');
}

export function fixLatexSyntax(text: string) {
  // Fix common LaTeX syntax errors that cause red KaTeX errors
  text = text.replace(/\\left\\frac/g, "\\left(\\frac");
  text = text.replace(/\\right([+\-])/g, "\\right)$1");
  text = text.replace(/\+C\+C/g, "+C");
  text = text.replace(/(\\(?:sin|cos|tan|sec|csc|cot)\^{-1})\\left/g, "$1 \\left");
  return text;
}

export function wrapBareLatexInDollars(text: string): string {
  // Wrap standalone LaTeX expressions in $$ delimiters
  const lines = text.split('\n');
  const result: string[] = [];
  
  for (let line of lines) {
    const trimmed = line.trim();
    
    // Skip if already wrapped
    if (/^\$\$.*\$\$$/.test(trimmed)) {
      result.push(line);
      continue;
    }
    
    // Skip headers
    if (/^#+\s/.test(trimmed)) {
      result.push(line);
      continue;
    }
    
    // Check if line contains LaTeX commands
    const hasLatex = /\\(?:int|frac|sqrt|sin|cos|tan|log|ln|left|right|sum|prod|lim|partial|alpha|beta|gamma|theta|pi|infty)/.test(trimmed);
    
    if (hasLatex && !trimmed.includes('$$')) {
      // Extract bullet/number prefix
      const prefixMatch = line.match(/^(\s*(?:\d+\.\s*|[*\-•]\s*))/);
      const prefix = prefixMatch ? prefixMatch[1] : '';
      const content = prefix ? line.slice(prefix.length).trim() : trimmed;
      
      // Don't wrap descriptive headers
      if (/^(?:Standard|Properties|Important|Formula|Integration|Method)/i.test(content)) {
        result.push(line);
      } else {
        result.push(prefix + `$$${content}$$`);
      }
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

export function removeDuplicateLines(text: string): string {
  // Remove duplicate consecutive lines (common AI artifact)
  const lines = text.split('\n');
  const unique: string[] = [];
  let prev = '';
  
  for (const line of lines) {
    if (line.trim() !== prev.trim()) {
      unique.push(line);
      prev = line;
    }
  }
  
  return unique.join('\n');
}

// Remove duplicate math blocks AND plain-text duplicates that appear after rendered $$...$$ blocks
export function removeDuplicateMathAfterBlocks(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let lastMathContent = ''; // track the actual math content
  let skipBudget = 0; // skip up to N math-like lines after a block

  const extractMathContent = (s: string): string => {
    // Extract content from $$...$$
    const match = s.match(/\$\$(.*?)\$\$/s);
    return match ? match[1].trim() : '';
  };

  const looksLikePlainMath = (s: string) => {
    const t = s.trim();
    if (!t) return false;
    if (t.includes('$$')) return false;
    // Common math cues
    if (/^dx\s*=/.test(t)) return true;
    if (/^\s*∫/.test(t)) return true;
    if (/(?:=\s*[^=]+\+\s*C\b)/.test(t)) return true;
    if (/(?:sin|cos|tan|log|ln|sec|csc|cot)\s*\^?-?1?\s*\(/i.test(t)) return true;
    if (/(?:\^|_|\\|\||\d)\s*(?:x|a|b|dx|dt)/i.test(t) && /=/.test(t)) return true;
    // If line is heavy in operators
    const opRatio = (t.match(/[=+\-/*^_|\\()]/g) || []).length / Math.max(t.length, 1);
    return opRatio > 0.25 && /[0-9a-z]/i.test(t);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isMathBlock = /^\s*\$\$[\s\S]*\$\$\s*$/.test(trimmed);

    if (isMathBlock) {
      const mathContent = extractMathContent(trimmed);
      
      // Check if this is a duplicate of the previous math block
      if (mathContent && mathContent === lastMathContent) {
        // Skip this duplicate math block
        continue;
      }
      
      out.push(line);
      lastMathContent = mathContent;
      skipBudget = 2; // allow up to two following plains to be considered duplicates
      continue;
    }

    if (lastMathContent && skipBudget > 0 && looksLikePlainMath(trimmed)) {
      // drop duplicate plain-text rendering
      skipBudget--;
      continue;
    }

    out.push(line);
    lastMathContent = '';
    skipBudget = 0;
  }

  return out.join('\n');
}

export function normalizeAIOutput(raw: string): string {
  if (!raw) return raw;
  
  let processed = raw;
  
  console.log('🔧 Starting normalization...');
  
  // STEP 1: CRITICAL - Strip all malformed HTML tags first!
  processed = stripMalformedHTMLTags(processed);
  console.log('✂️  Stripped malformed tags');
  
  // STEP 2: Unescape backslashes
  processed = unescapeBackslashes(processed);
  
  // STEP 3: Convert LaTeX delimiter styles
  processed = convertParenDelimitersToDollar(processed);
  
  // STEP 4: Wrap bare LaTeX in $$ delimiters
  processed = wrapBareLatexInDollars(processed);
  console.log('📦 Wrapped bare LaTeX:', processed.slice(0, 400));
  
  // STEP 5: Remove stray symbols
  processed = removeStrayAsterisksAndEmptyListItems(processed);
  console.log('🧹 After removing stray symbols:', processed.slice(0, 400));
  
  // STEP 6: Fix LaTeX syntax errors
  processed = fixLatexSyntax(processed);
  console.log('🛠️  After fixLatexSyntax:', processed.slice(0, 400));
  
  // STEP 7: Normalize spacing
  processed = normalizeLatexSpacing(processed);
  console.log('⚖️  After normalizeLatexSpacing:', processed.slice(0, 400));
  
  // STEP 7.1: Remove duplicates BEFORE converting $$ to $ (so detector can find math blocks!)
  processed = removeDuplicateLines(processed);
  processed = removeDuplicateMathAfterBlocks(processed);
  console.log('🧩 After duplicate removal:', processed.slice(0, 400));
  
  // STEP 7.2: Convert short $$...$$ inline spans to $...$
  processed = convertShortDoubleToSingle(processed);
  console.log('🧩 After convertShortDoubleToSingle:', processed.slice(0, 400));
  
  // STEP 7.3: Ensure display math sits on its own line
  processed = ensureBlockMathOnOwnLine(processed);
  console.log('🧩 After ensureBlockMathOnOwnLine:', processed.slice(0, 400));

  // STEP 7.4: Ensure spacing around math tokens to avoid jammed words
  processed = ensureSpacingAroundMath(processed);
  console.log('🧩 After ensureSpacingAroundMath:', processed.slice(0, 400));
  
  console.log('✅ Normalization complete');
  
  return processed;
}