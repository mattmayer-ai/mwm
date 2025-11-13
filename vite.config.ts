import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@stores': path.resolve(__dirname, './src/stores'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => {
          const project = process.env.VITE_FIREBASE_PROJECT_ID || 'your-project';
          // maps /api/chat -> http://localhost:5001/<PROJECT_ID>/us-central1/api/chat
          return path.replace(/^\/api/, `/${project}/us-central1/api`);
        },
      },
    },
  },
});

