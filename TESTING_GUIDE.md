# Testing Guide for Structured LaTeX System

## Quick Test Cases

### 1. Backend Validation Test (Python)

```python
from backend.app.utils.ai_validator import validate_ai_blocks, normalize_latex

# Test 1: Valid JSON
valid_json = '''[
  {"type":"text", "value":"The integral is:"},
  {"type":"math", "value":"\\\\int_0^1 x^2 dx = \\\\frac{1}{3}"}
]'''

blocks = validate_ai_blocks(valid_json)
print("✅ Test 1 passed:", len(blocks), "blocks")

# Test 2: Malformed LaTeX (should be cleaned)
malformed = "<mb>\\\\int x dx</mb> + C$$2/mb>"
cleaned = normalize_latex(malformed)
print("✅ Test 2 passed:", cleaned)
# Expected: "\\int x dx + C"

# Test 3: Invalid JSON (should raise ValueError)
try:
    validate_ai_blocks("not json")
    print("❌ Test 3 failed: should have raised error")
except ValueError as e:
    print("✅ Test 3 passed: caught error -", str(e))
```

### 2. Frontend Rendering Test (React)

Add this to your ChatWindow for testing:

```tsx
// Test button in ChatWindow
<button onClick={() => {
  const testMessage: ChatMessage = {
    id: 'test',
    text: '',
    blocks: [
      { type: 'text', value: 'Test equation:' },
      { type: 'math', value: '\\int_0^1 x^2 \\, dx = \\frac{1}{3}' }
    ],
    sender: 'ai',
    timestamp: Date.now()
  };
  setMessages(prev => [...prev, testMessage]);
}}>
  🧪 Add Test Message
</button>
```

### 3. End-to-End Test

1. **Start Backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Upload a PDF with math content**

4. **Ask:** "What is the integral formula for x squared?"

5. **Expected Response:**
   ```json
   {
     "blocks": [
       {
         "type": "text",
         "value": "The integral formula is:"
       },
       {
         "type": "math",
         "value": "\\int x^2 dx = \\frac{x^3}{3} + C"
       }
     ]
   }
   ```

6. **Verify:**
   - [ ] No HTML tags visible
   - [ ] Math renders beautifully with KaTeX
   - [ ] No duplicate equations
   - [ ] No red error boxes

### 4. Edge Case Tests

#### Test A: Empty Response
```json
{"blocks": []}
```
Should show: "No content to display"

#### Test B: Only Text
```json
{
  "blocks": [{"type": "text", "value": "Hello"}]
}
```
Should render as plain text

#### Test C: Only Math
```json
{
  "blocks": [{"type": "math", "value": "E = mc^2"}]
}
```
Should render as display equation

#### Test D: Malformed LaTeX
```json
{
  "blocks": [{"type": "math", "value": "\\frac{incomplete"}]
}
```
Should show escaped LaTeX in `<pre>` tag (no crash)

#### Test E: Special Characters
```json
{
  "blocks": [{"type": "math", "value": "\\alpha + \\beta = \\gamma"}]
}
```
Should render Greek letters properly

## Manual Testing Checklist

### Backend Tests
- [ ] Run `pytest` in backend directory (if tests exist)
- [ ] Check server logs for validation errors
- [ ] Test `/api/chat` endpoint with curl:
  ```bash
  curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"text": "What is integration?", "use_web_search": false}'
  ```

### Frontend Tests
- [ ] Chat window loads without errors
- [ ] Upload a document successfully
- [ ] Send a question and receive response
- [ ] Math equations render correctly
- [ ] No duplicate content appears
- [ ] Sources display properly
- [ ] Follow-up suggestions work
- [ ] Search functionality works
- [ ] Dark mode switches correctly

### Browser Console Checks
Look for these log messages:
- `🤖 RAW AI OUTPUT:` - Shows raw JSON from AI
- `✅ Validated N blocks successfully` - Confirms validation worked
- `✨ Received structured response from backend` - Confirms API call succeeded

## Common Issues & Fixes

### Issue: "Cannot find name 'ContentBlock'"
**Fix:** Restart TypeScript server or rebuild project

### Issue: Math not rendering
**Fix:** Check browser console for KaTeX errors. Verify `katex.css` is loaded.

### Issue: Blank response
**Fix:** Check backend logs. Likely a validation error. Use debug mode.

### Issue: "NetworkError when attempting to fetch resource"
**Fix:** Backend not running. Start with `uvicorn app.main:app --reload`

## Performance Tests

1. **Large Document:** Upload a 100-page PDF, ask a question
   - Should respond within 10 seconds
   - Should show relevant chunks only

2. **Multiple Math Blocks:** Ask "List 10 integration formulas"
   - Should return 10 separate math blocks
   - All should render correctly

3. **Long Conversation:** Send 20 messages back and forth
   - Should maintain context
   - Should not slow down

## Success Criteria

✅ **PASS if:**
- Build completes without errors
- No console errors in browser
- Math renders with proper formatting
- No duplicate equations visible
- Malformed tags are stripped
- Error handling works gracefully

❌ **FAIL if:**
- Red KaTeX errors appear
- Duplicate math blocks render
- HTML tags like `<mb>` are visible
- Frontend crashes on render
- Backend returns 500 errors

---

**Note:** This system is designed to be fail-safe. If validation fails, it returns error blocks instead of crashing.
