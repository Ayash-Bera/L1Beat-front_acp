import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'markdown-vendor': ['marked', 'github-markdown-css'],
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
  },
  server: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  // Add support for importing markdown files as raw text
  assetsInclude: ['**/*.md'],
  optimizeDeps: {
    include: ['marked', 'github-markdown-css']
  },
  // Ensure the submodule files are included
  publicDir: false,
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});