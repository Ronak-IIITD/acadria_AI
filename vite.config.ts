import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          // Fix Cross-Origin-Opener-Policy for Firebase Auth popup
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          // Allow external scripts and CDNs
          'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://*.firebaseio.com https://*.googleapis.com https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://aistudiocdn.com; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:;"
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
