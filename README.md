
# StudySync AI

StudySync AI transforms static study materials into an interactive learning experience powered by Google Gemini. Upload your course documents, chat with their contents, generate flashcards, and keep track of what you have mastered with intuitive keyboard workflows.

## Features

- **Document-aware chat** – Ask contextual questions across PDF, DOCX, PPTX, TXT, MD, and RTF files.
- **Multi-file knowledge base** – Drag-and-drop or multi-select uploads with progress feedback and validation.
- **Flashcard generator** – Create spaced-repetition friendly cards from any uploaded content.
- **Keyboard-first study mode** – Navigate and grade flashcards using arrow keys and number shortcuts.
- **3D flip animations** – Visually engaging transitions when revealing flashcard answers.
- **Dark/light theming** – Persisted preference with system-aware defaults.
- **Firebase authentication & persistence** – Secure sign-in and document storage (requires Firebase configuration).

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **AI:** `@google/genai` (Gemini 2.5 Flash, configurable)
- **Document parsing:** pdfjs-dist, Mammoth (DOCX), JSZip (PPTX)
- **Auth & storage:** Firebase Authentication, Firestore, Firebase Storage
- **Tooling:** ESLint (via Vite), npm scripts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API key
- Firebase project with Authentication, Firestore, and Storage enabled (optional but recommended)

### Installation

```bash
git clone https://github.com/Ronak-IIITD/StudySyncAI.git
cd StudySyncAI
npm install
```

### Environment Variables

Create a `.env.local` file in the project root and populate the following keys:

| Key | Description |
| --- | --- |
| `VITE_API_KEY` | Google Gemini API key |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

> The app falls back to a placeholder Gemini key if `VITE_API_KEY` is missing, but AI features will be disabled.

### Run Locally

```bash
npm run dev
```

Vite will launch the client at `http://localhost:3000/` (ports auto-increment if occupied).

### Build for Production

```bash
npm run build
npm run preview
```

The build output is generated in the `dist/` directory and served locally via the preview command.

## Flashcard Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Arrow Left` | Previous card |
| `Arrow Right` | Next card (after revealing answer) |
| `Arrow Up`, `Space`, `Enter` | Flip current card |
| `Arrow Down` | Skip to next card |
| `0` - `5` | Grade answer confidence (SM-2 scale) |

## Project Structure

```
StudySyncAI/
├─ components/
│  ├─ FileUpload.tsx          # Multi-format uploader with validation
│  ├─ FlashcardDeck.tsx       # Keyboard-driven study session UI
│  ├─ ChatWindow.tsx          # Gemini-powered conversational panel
│  └─ ...                     # Additional UI components and icons
├─ services/
│  └─ geminiService.ts        # AI prompts, document parsing utilities
├─ contexts/
│  └─ ThemeContext.tsx        # Dark/light mode management
├─ types.ts                   # Shared TypeScript types
├─ vite.config.ts             # Vite configuration
└─ README.md
```

## Testing Checklist

- Upload each supported document type (PDF, DOCX, PPTX, TXT, MD, RTF).
- Validate flashcard generation and keyboard navigation flows.
- Confirm AI responses with Gemini after uploading documents.
- Smoke-test light/dark themes and authentication flows.

## Deployment Notes

- Host the built `dist/` directory on any static host (Vercel, Netlify, Firebase Hosting, etc.).
- Ensure environment variables are configured in the hosting provider.
- For Firebase deployments, review security rules for Firestore and Storage before going live.

## Contributing

1. Fork the repository and create a feature branch.
2. Run `npm run dev` to develop locally.
3. Ensure uploads and flashcard interactions work across document types.
4. Open a pull request describing your changes.

## License

This project currently has no explicit license. Please contact the repository owner for usage permissions.
