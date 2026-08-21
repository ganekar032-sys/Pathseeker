import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pathseeker — client-side SPA + a small Vercel serverless proxy (/api/*).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  // Dev only: forward /api to scripts/dev-proxy.mjs (the same handler code
  // Vercel runs in production). Start it with: node scripts/dev-proxy.mjs
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787'
    }
  }
});
