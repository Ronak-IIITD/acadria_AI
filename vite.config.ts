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
          // Allow Google APIs scripts for auth
          'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://*.firebaseio.com https://*.googleapis.com; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com;"
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
