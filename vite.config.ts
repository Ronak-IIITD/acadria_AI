import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const isDev = mode === 'development';

    // In development, we need 'unsafe-eval' for React DevTools, Vite HMR, and some libraries
    // In production, this should be removed for better security
    const scriptSrc = isDev
      ? "'self' 'unsafe-eval' 'unsafe-inline'"
      : "'self' 'unsafe-inline'";

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          // Fix Cross-Origin-Opener-Policy for Firebase Auth popup
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          // Allow external scripts and CDNs
          'Content-Security-Policy': `script-src ${scriptSrc} https://apis.google.com https://www.gstatic.com https://*.firebaseio.com https://*.googleapis.com https://cdn.jsdelivr.net https://aistudiocdn.com; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:;`
        }
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
