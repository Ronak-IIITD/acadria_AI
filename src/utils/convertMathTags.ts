/**
 * Converts custom math tags to KaTeX-compatible format and prevents duplicate equations
 */
export function convertMathTags(text: string): string {
  if (!text) return text;

  let converted = text;

  // Convert block math: <mb>...</mb> → $$...$$
  converted = converted.replace(/<mb>([\s\S]*?)<\/mb>/g, (_, expr) => {
    return `\n$$${expr.trim()}$$\n`;
  });

  // Convert inline math: <m>...</m> → $$...$$ 
  converted = converted.replace(/<m>(.*?)<\/m>/g, (_, expr) => {
    return `$$${expr.trim()}$$`;
  });

  // Fix Gemini-style inline delimiters \(...\) → $$...$$
  converted = converted.replace(/\\\((.*?)\\\)/g, (_, expr) => {
    return `$$${expr.trim()}$$`;
  });

  // CRITICAL: Remove duplicate plain-text math that follows rendered equations
  // This removes lines like "dx = sin^-1(x) + C" that come after $$...$$
  const lines = converted.split('\n');
  const filteredLines: string[] = [];
  let lastLineWasMath = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if current line is a math block
    const isMathLine = /^\$\$.*\$\$$/.test(line);
    
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

  converted = filteredLines.join('\n');

  // Fix common LaTeX syntax errors
  converted = converted.replace(/\\left\\frac/g, '\\left(\\frac');
  converted = converted.replace(/\\right([+\-])/g, '\\right)$1');
  converted = converted.replace(/\+C\+C/g, '+C');
  converted = converted.replace(/(\\(?:sin|cos|tan|sec|csc|cot)\^{-1})\\left/g, '$1 \\left');

  // Clean up excessive newlines
  converted = converted.replace(/\n{3,}/g, '\n\n');

  // Clean up double-wrapped equations
  converted = converted.replace(/\$\$\$\$(.+?)\$\$\$\$/g, '$$$$1$$');

  return converted;
}
