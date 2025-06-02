import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: 'public',
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://grok.ru.tuna.am',
        changeOrigin: true,
        secure: true,
        ws: true,
      }
    }
  }
});
