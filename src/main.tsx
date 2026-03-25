import React from 'react';
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

if (!clerkPublishableKey) {
  missingConfig.push('VITE_CLERK_PUBLISHABLE_KEY');
}

if (!convexUrl) {
  missingConfig.push('VITE_CONVEX_URL');
}

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

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
      <ThemeProvider>
        <div className="relative min-h-screen">
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-3 text-sm text-center">
            Missing frontend config: {missingConfig.join(', ')}. Add these values to <code>.env.local</code> and restart <code>npm run dev</code>.
          </div>
          <div className="pt-16">
            <LandingPage
              onGetStarted={() => window.alert('Set up .env.local with Clerk and Convex keys to enable login.')}
              onAdminLogin={() => window.alert('Set up .env.local with Clerk and Convex keys to enable admin login.')}
            />
          </div>
        </div>
      </ThemeProvider>
    )}
  </React.StrictMode>
);
