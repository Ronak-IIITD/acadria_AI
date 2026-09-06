import React, { useEffect, useState, type FC } from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import App from './App';
import LandingPage from './components/LandingPage';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/global.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;
const missingConfig: string[] = [];

const isValidClerkKey =
  typeof clerkPublishableKey === 'string' &&
  /^pk_(test|live)_[A-Za-z0-9]{10,}$/.test(clerkPublishableKey);

if (!isValidClerkKey) {
  missingConfig.push('VITE_CLERK_PUBLISHABLE_KEY');
}

const isValidConvexUrl =
  typeof convexUrl === 'string' &&
  /^https:\/\/[a-z0-9-]+\.convex\.cloud\/?$/.test(convexUrl) &&
  convexUrl !== 'https://your-project.convex.cloud';

if (!isValidConvexUrl) {
  missingConfig.push('VITE_CONVEX_URL');
}

// Only construct clients when config is valid — otherwise Clerk/Convex
// throw during render (outside any ErrorBoundary) and blank the page.
const convex = missingConfig.length === 0 && convexUrl ? new ConvexReactClient(convexUrl) : null;

/**
 * Rendered when frontend config is missing/invalid.
 * - Banner is in-flow (not fixed) so it never overlaps the landing nav.
 * - Forces light theme, mirroring AuthGate's landing behavior, so the
 *   landing page doesn't flip to dark when the OS prefers dark mode.
 *   This effect runs after ThemeProvider's own mount effect, so light wins.
 */
const MissingConfigFallback: FC<{ missing: string[] }> = ({ missing }) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  return (
    <ThemeProvider>
      <div className="relative min-h-screen">
        {!dismissed && (
          <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-3 text-sm text-center">
            Missing frontend config: {missing.join(', ')}. Add these values to <code>.env.local</code> and restart <code>npm run dev</code>.
            <button
              onClick={() => setDismissed(true)}
              className="ml-3 underline font-medium hover:text-amber-700"
              aria-label="Dismiss missing config warning"
            >
              Dismiss
            </button>
          </div>
        )}
        <div>
          <LandingPage
            onGetStarted={() => window.alert('Set up .env.local with Clerk and Convex keys to enable login.')}
            onAdminLogin={() => window.alert('Set up .env.local with Clerk and Convex keys to enable admin login.')}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {missingConfig.length === 0 && convex ? (
      <ClerkProvider publishableKey={clerkPublishableKey as string}>
        <ConvexProvider client={convex}>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ConvexProvider>
      </ClerkProvider>
    ) : (
      <MissingConfigFallback missing={missingConfig} />
    )}
  </React.StrictMode>
);
