import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pathseeker — 100% client-side SPA, deployable to Vercel free tier as a static site.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
