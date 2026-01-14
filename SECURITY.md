# Security Policy

## 🔒 Repository Security Practices

This document outlines security practices for the Acadira AI project.

### Environment Variables

**Never commit real API keys or credentials to version control.**

All sensitive configuration is stored in `.env` files which are:
- Listed in `.gitignore`
- Not tracked by git
- Required to be created from templates (`.env.example`)

### Required Credentials Rotation

If you believe any credentials have been exposed:

1. **Google Gemini API Key**
   - Go to: https://aistudio.google.com/app/apikey
   - Delete the exposed key
   - Generate a new one

2. **Firebase Credentials**
   - Go to: https://console.firebase.google.com/
   - Project Settings > Service Accounts
   - Regenerate private key if needed

3. **xAI (Grok) API Key**
   - Go to: https://console.x.ai/
   - Regenerate your API key

4. **Groq API Key**
   - Go to: https://console.groq.com/
   - Regenerate your API key

5. **Anthropic API Key**
   - Go to: https://console.anthropic.com/
   - Regenerate your API key

### Git History Scrub

If API keys were accidentally committed:
```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove specific file from history
git filter-repo --path-glob '*.env' --invert-paths --force

# Force push to update remote
git push --force origin main
```

### Best Practices

1. Use `.env.local` for local development
2. Never commit `.env` files
3. Rotate API keys periodically
4. Use minimal required permissions for API keys
5. Monitor API key usage for anomalies
6. Use .gitignore for all credential files
