import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Vite dev server on 5173, proxies API calls to backend on port 8000
    // In production, backend serves static frontend files on port 8000
    port: 5173,
    host: '0.0.0.0',
    strictPort: false, // Allow fallback to other ports if 5173 is busy
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    // Performance optimizations
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Code splitting - manual chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - group by library
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Charts library
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            // Other vendors
            return 'vendor';
          }
          
          // Analytics pages
          if (id.includes('AnalyticsDashboard') || id.includes('CostAnalyticsDashboard')) {
            return 'analytics';
          }
          
          // Dashboard widgets — separate chunk for lazy-loadable
          if (id.includes('components/dashboard/')) {
            return 'dashboard-widgets';
          }

          // Clinical tools pages
          if (id.includes('pages/tools/')) {
            return 'tools';
          }

          // Legal pages
          if (id.includes('pages/legal/')) {
            return 'legal';
          }
          
          // Chart components
          if (id.includes('components/charts/')) {
            return 'charts';
          }
        },
        // Consistent chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit (we're using code splitting)
    chunkSizeWarningLimit: 600,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@capacitor/core', '@capacitor/android'],
  },
});
