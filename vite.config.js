import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost/PDAM_app',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/user': {
        target: 'http://localhost/PDAM_app',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/uploads': {
        target: 'http://localhost/PDAM_app',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/PDAM_app/uploads': {
        target: 'http://localhost/PDAM_app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/PDAM_app/, '')
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) return 'vendor-jspdf';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor';
          }
        }
      }
    }
  }
})
