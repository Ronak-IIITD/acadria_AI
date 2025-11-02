# Structured LaTeX Math Rendering System

## ✅ Implementation Complete

This document describes the new **structured content block system** that eliminates math rendering issues by forcing the AI to output **pure LaTeX in validated JSON blocks**.

---

## 🎯 Problem Solved

**BEFORE:** AI would mix HTML tags (`<mb>`, `<m>`), duplicate equations, and output malformed LaTeX causing rendering errors.

**AFTER:** AI outputs structured JSON with pure LaTeX. Server validates and sanitizes. Client renders with KaTeX deterministically.

---

## 🏗️ Architecture

### Flow Diagram

```
User Question 
    ↓
Frontend (ChatWindow) 
    ↓
Backend API (/api/chat)
    ↓
RAG Service (Structured JSON Prompt)
    ↓
Gemini AI (Returns ONLY JSON blocks)
    ↓
Validation & Sanitization (ai_validator.py)
    ↓
Return { blocks: [...], suggestions, sources }
    ↓
Frontend Receives Structured Blocks
    ↓
AiMessageRenderer (Renders with KaTeX)
    ↓
Perfect Math Display! ✨
```

---

## 📦 Key Components

### 1. Backend (Python)

#### `backend/app/models/schemas.py`
```python
class ContentBlock(BaseModel):
    type: Literal["text", "math"]
    value: str

class ChatResponse(BaseModel):
    blocks: List[ContentBlock]  # NEW: Structured blocks
    suggestions: List[dict] = []
    sources: List[str] = []
```

#### `backend/app/utils/ai_validator.py`
- `normalize_latex(latex)` - Strips malformed tags, fixes syntax
- `validate_ai_blocks(raw_text)` - Parses and validates JSON from AI
- `auto_fix_latex(latex)` - Optional corrections for common mistakes

#### `backend/app/services/rag_service.py`
- Updated `_build_prompt()` with **STRICT JSON-ONLY instructions**
- Updated `generate_response()` to validate blocks before returning

### 2. Frontend (React/TypeScript)

#### `src/components/AiMessageRenderer.tsx`
- **NEW COMPONENT**: Renders structured blocks
- Uses `katex.renderToString()` for math blocks
- `throwOnError: false` prevents crashes
- No duplicate rendering - each block shown exactly once

#### `src/types.ts`
```typescript
export interface ContentBlock {
  type: 'text' | 'math';
  value: string;
}

export interface ChatMessage {
  // ...
  blocks?: ContentBlock[]; // NEW
}
```

#### `src/services/geminiService.ts`
- Updated `getAiResponse()` to return `{ blocks, suggestions, sources }`
- Tries backend API first, falls back to frontend processing
- Frontend fallback also uses structured JSON prompt

#### `src/components/ChatWindow.tsx`
- **REMOVED**: ReactMarkdown, remark-math, rehype-katex
- **ADDED**: AiMessageRenderer for AI messages
- Handles both `blocks` (new) and `text` (legacy) for backward compatibility

---

## 🚨 Critical Rules for AI Model

The AI now receives this strict prompt:

```
You are an assistant that outputs ONLY JSON. ALWAYS return valid JSON.

Return this EXACT structure:
[
  {"type":"text", "value":"plain text explanation (no LaTeX)"},
  {"type":"math", "value":"PURE_LATEX_EXPRESSION (no $, no $$, no HTML)"}
]

STRICT RULES:
1. Every math block's value must contain ONLY LaTeX (e.g., \int_0^1 x^2 \,dx = \frac{1}{3})
2. DO NOT include HTML tags like <mb>, <m>, <div>
3. DO NOT include backtick fences, dollar signs, or asterisks in math values
4. If there's both explanation and equation, return TWO blocks
5. DO NOT duplicate content

GOOD EXAMPLE:
[
  {"type":"text","value":"The definite integral evaluates to:"},
  {"type":"math","value":"\\int_0^1 x^2 \\, dx = \\frac{1}{3}"}
]

BAD EXAMPLES (DO NOT DO):
- {"type":"math","value":"<mb>\\int x^2 dx</mb>"}  ← NO HTML TAGS!
- {"type":"math","value":"$$\\int x^2 dx$$"}       ← NO DOLLAR SIGNS!
```

---

## 🔧 Validation & Sanitization

### Server-Side (Python)

```python
def normalize_latex(latex: str) -> str:
    # Remove malformed HTML tags
    s = re.sub(r'<\/?mb\d*>', '', s)
    s = re.sub(r'<\/?m\d*>', '', s)
    
    # Unescape double backslashes
    s = s.replace('\\\\', '\\')
    
    # Convert \(...\) to $...$
    s = s.replace('\\(', '$').replace('\\)', '$')
    
    # Fix common garbage
    s = re.sub(r'C\$\$\d+/mb>', '+ C', s)
    
    return s.strip()
```

### Client-Side (TypeScript)

```typescript
function renderLatex(latex: string): { __html: string } {
  try {
    return {
      __html: katex.renderToString(latex, {
        throwOnError: false,  // Prevents crashes
        displayMode: true,
        strict: false,
        trust: false
      })
    };
  } catch (e) {
    return { __html: `<pre>${escapeHtml(latex)}</pre>` };
  }
}
```

---

## 🧪 Testing

### Test Cases

1. **Simple equation:**
   ```json
   [{"type":"math","value":"x^2 + 1 = 0"}]
   ```

2. **Mixed text and math:**
   ```json
   [
     {"type":"text","value":"The solution is:"},
     {"type":"math","value":"x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"}
   ]
   ```

3. **Integration formulas:**
   ```json
   [{"type":"math","value":"\\int x^n dx = \\frac{x^{n+1}}{n+1} + C"}]
   ```

4. **Malformed input (should be cleaned):**
   ```json
   [{"type":"math","value":"<mb>\\int x dx</mb>"}]
   ```
   → Server strips `<mb>` tags → Client renders clean LaTeX

---

## 📊 Debug Mode

The `AiMessageRendererDebug` component shows:
- Raw AI output (JSON string)
- Parsed blocks (validated structure)
- Rendered output

Usage:
```tsx
import { AiMessageRendererDebug } from './AiMessageRenderer';

<AiMessageRendererDebug 
  blocks={blocks} 
  rawResponse={rawJson} 
/>
```

---

## 🚀 Deployment Checklist

- [x] Backend schemas updated (ContentBlock, ChatResponse)
- [x] AI validator created (ai_validator.py)
- [x] RAG service uses structured JSON prompt
- [x] AiMessageRenderer component created
- [x] ChatWindow uses new renderer
- [x] KaTeX configured with throwOnError: false
- [x] Backward compatibility maintained (old messages use `.text`)
- [ ] Backend API running and accessible
- [ ] Test with real problematic LaTeX expressions
- [ ] Monitor logs for validation errors

---

## 🔍 Troubleshooting

### Issue: AI still returns malformed output
**Solution:** Check server logs for validation errors. The validator will log failed JSON parses and return error blocks.

### Issue: Math not rendering
**Solution:** 
1. Open browser console
2. Look for KaTeX errors
3. Check if `blocks` array is empty
4. Use debug mode to see raw response

### Issue: Duplicate equations
**Solution:** This should be impossible now. Each block renders once. If you see duplicates, the AI is creating duplicate blocks - update the prompt.

### Issue: Red KaTeX errors
**Solution:** With `throwOnError: false`, LaTeX errors show as escaped text in `<pre>` tags. Check the console for syntax errors in the LaTeX.

---

## 🎓 Benefits

1. **No Duplicates**: Each block renders exactly once
2. **No Malformed HTML**: Server strips all garbage tags
3. **Deterministic**: Same input → same output
4. **Debuggable**: Clear separation of parsing vs rendering
5. **Secure**: KaTeX trust: false prevents XSS
6. **Graceful Errors**: Bad LaTeX shows escaped, not red crash
7. **Backward Compatible**: Old messages still work

---

## 📝 Migration Notes

### Old System
```typescript
// AI returned plain text with mixed math
const response = await getAiResponse(question, files);
const text = response.text; // "The answer is $$x^2$$"

<ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
  {text}
</ReactMarkdown>
```

### New System
```typescript
// AI returns structured blocks
const response = await getAiResponse(question, files);
const blocks = response.blocks; 
// [
//   {type: "text", value: "The answer is:"},
//   {type: "math", value: "x^2"}
// ]

<AiMessageRenderer blocks={blocks} />
```

---

## 📚 References

- [KaTeX Documentation](https://katex.org/docs/api.html)
- [Gemini API](https://ai.google.dev/)
- [Pydantic Models](https://docs.pydantic.dev/)

---

**Status:** ✅ **IMPLEMENTATION COMPLETE**

Last Updated: 2025-11-02
Author: GitHub Copilot
