import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  loadEnv(mode, '.', '');
  return {
    base: '/lucy/',
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (id.includes('xlsx')) {
              return 'xlsx';
            }

            if (id.includes('pdfjs-dist')) {
              return 'pdf';
            }

            if (
              id.includes('/jszip/') ||
              id.includes('/pako/') ||
              id.includes('/readable-stream/') ||
              id.includes('/lie/') ||
              id.includes('/setimmediate/')
            ) {
              return 'docx-zip';
            }

            if (id.includes('mammoth')) {
              return 'docx';
            }

            if (id.includes('lucide-react')) {
              return 'icons';
            }

            if (id.includes('motion')) {
              return 'motion';
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }

            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': 'http://localhost:8787',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
