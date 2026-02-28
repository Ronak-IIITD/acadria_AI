import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/global.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local');
}

if (!convexUrl) {
  throw new Error('Missing VITE_CONVEX_URL in .env.local');
}

const convex = new ConvexReactClient(convexUrl);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProvider client={convex}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ConvexProvider>
    </ClerkProvider>
  </React.StrictMode>
);
