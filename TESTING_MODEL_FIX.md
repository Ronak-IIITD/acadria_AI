# 🧪 Testing Model Overload Fix

## Quick Start - Restart Backend

The improved error handling with retry logic is now in place. To activate it:

### 1. Stop your current backend server
Press `Ctrl+C` in the terminal running the backend

### 2. Restart the backend
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
```

### 3. Try your query again
Upload a document and ask a question. The backend will now:
- ✅ Automatically retry up to 3 times
- ✅ Show detailed retry information in console
- ✅ Switch models on second retry
- ✅ Provide better error messages

## What to Look For

### In Backend Console:
```
🤖 Attempting to generate response with gemini-2.5-flash (attempt 1/3)
⚠️ Model gemini-2.5-flash error (attempt 1/3)
   Error details: 503 The model is overloaded...
   Status code: 503
   Retryable: True
⏳ Retrying in 2 seconds...
🤖 Attempting to generate response with gemini-2.5-flash (attempt 2/3)
🔄 Switching to fallback model: gemini-1.5-pro
...
```

### In Frontend:
Instead of seeing raw JSON errors, users will see:
- "🔄 The AI model is temporarily busy. Retry in 30 seconds."
- Action buttons: "Try again", "Switch to Grok model"

## Configuration (Optional)

You can customize retry behavior by creating `backend/.env`:

```bash
# AI Model Retry Configuration
MAX_RETRIES=3              # Number of retry attempts (default: 3)
INITIAL_RETRY_DELAY=2      # Initial delay in seconds (default: 2)
MAX_RETRY_DELAY=10        # Maximum delay (default: 10)
FALLBACK_MODEL=gemini-1.5-pro  # Fallback model (default: gemini-1.5-pro)
```

## Debug Mode

If you want to see even more details, check the backend console output. Each retry attempt will show:
- Current attempt number
- Error details (first 200 characters)
- Detected status code
- Whether error is retryable
- Retry delay

## Expected Behavior

### Scenario 1: Temporary Overload
```
User asks question
  ↓
First attempt fails (503)
  ↓
Wait 2 seconds → Retry
  ↓
SUCCESS! ✅
```

### Scenario 2: Persistent Overload
```
User asks question
  ↓
First attempt fails (503)
  ↓
Wait 2 seconds → Retry → Still fails
  ↓
Switch to Gemini Pro
  ↓
Wait 4 seconds → Retry
  ↓
SUCCESS! ✅
```

### Scenario 3: All Retries Exhausted
```
User asks question
  ↓
3 retry attempts → All fail
  ↓
Show user-friendly error with retry button
```

## Common Issues

### Issue: Still seeing JSON errors
**Solution**: Make sure backend is fully restarted (not just refreshed)

### Issue: No retry attempts in console
**Solution**: Check that the error contains one of these keywords:
- 503, unavailable, overloaded, quota, rate
- resource_exhausted, too many requests

### Issue: Want different retry timing
**Solution**: Create/edit `backend/.env` with custom values

## Success Indicators

You'll know it's working when:
1. ✅ Backend console shows retry attempts
2. ✅ Users see friendly error messages
3. ✅ Model switching happens automatically
4. ✅ Some requests succeed after retry

## Need Help?

Check the detailed implementation in:
- `backend/app/services/rag_service.py` - Retry logic
- `backend/app/config.py` - Configuration
- `backend/app/routes/chat.py` - Error responses
- `MODEL_ERROR_HANDLING.md` - Full documentation
