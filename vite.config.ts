/// <reference types="vitest" />
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
          // Keep popup-compatible policy for auth providers
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          // Allow external scripts and CDNs
          'Content-Security-Policy': `script-src ${scriptSrc} https://apis.google.com https://www.gstatic.com https://*.googleapis.com https://cdn.jsdelivr.net https://aistudiocdn.com; frame-src 'self' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:;`
        },
        // Exclude venv and other directories from file watching to prevent ENOSPC errors
        watch: {
          ignored: ['**/venv/**', '**/.venv/**', '**/node_modules/**', '**/.git/**', '**/dist/**']
        }
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        // Production build optimizations
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: false,
        // Chunk splitting for better caching
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunks
              'vendor-react': ['react', 'react-dom'],
              'vendor-pdf': ['pdfjs-dist'],
            }
          }
        },
        // Increase chunk size warning limit (PDF worker is large)
        chunkSizeWarningLimit: 1200,
      },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    // Vitest configuration
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './src/test/setup.ts',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      coverage: {
        reporter: ['text', 'json', 'html'],
      },
    },
  };
});
