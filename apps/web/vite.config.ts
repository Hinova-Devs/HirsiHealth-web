import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '../..',
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'https://api.medplum.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
      },
      '/storage-proxy': {
        target: 'https://storage.medplum.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage-proxy/, ''),
        secure: true,
      },
    },
  },
});