// vite.config.ts
// Vite bundler configuration for the Gashuna Hotel frontend.
//
// Two key things this file does:
// 1. Path alias — @ maps to src/ so imports are clean
// 2. Dev proxy — /api requests go to Express backend on port 5000

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // React plugin — enables JSX transform and React Fast Refresh
  plugins: [react()],

  resolve: {
    alias: {
      // @ always points to client/src/
      // Example: import Button from '@/components/ui/Button'
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    // Frontend dev server runs on port 5173
    port: 5173,

    proxy: {
      // Any request to /api/... is forwarded to the Express backend
      // This means no CORS errors during development
      // Example: axios.get('/api/rooms') → http://localhost:5000/api/rooms
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    // Output folder for production build
    outDir: 'dist',

    // Generate source maps for debugging
    sourcemap: true,

    rollupOptions: {
      output: {
        // Split large libraries into separate chunks for faster loading
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          charts: ['recharts'],
        },
      },
    },
  },
});
