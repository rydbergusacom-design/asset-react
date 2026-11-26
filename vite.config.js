import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api to PHP during development so cookies + CSRF work on same origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://rydberg-group.com/asset-qr-php-api-and-react/api', // change to your PHP server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
