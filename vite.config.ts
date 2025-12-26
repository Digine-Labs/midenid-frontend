import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    exclude: ['@demox-labs/miden-sdk'],
    include: ['buffer'],
  },
  assetsInclude: ['**/*.masm'],
  worker: {
    format: 'es'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core and router
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-router-vendor';
          }

          // Miden SDK and wallet adapters
          if (id.includes('@demox-labs/miden-sdk')) {
            return 'miden-sdk';
          }
          if (id.includes('@demox-labs/miden-wallet-adapter')) {
            return 'miden-wallet';
          }

          // Form libraries
          if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('node_modules/zod')) {
            return 'form-vendor';
          }

          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }

          // Framer Motion and animations
          if (id.includes('framer-motion') || id.includes('node_modules/motion')) {
            return 'animation-vendor';
          }

          // Lucide icons
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }

          // Other UI libraries
          if (id.includes('sonner') || id.includes('next-themes') || id.includes('react-rough-notation')) {
            return 'ui-utils-vendor';
          }

          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
