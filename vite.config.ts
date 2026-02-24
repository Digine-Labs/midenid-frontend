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
    exclude: ['@miden-sdk/miden-sdk'],
    include: ['buffer'],
  },
  assetsInclude: ['**/*.masm'],
  worker: {
    format: 'es'
  },
  build: {
    modulePreload: {
      resolveDependencies(_url, deps) {
        return deps.filter(
          (dep) =>
            !dep.includes('miden-sdk') &&
            !dep.includes('miden-wallet') &&
            !dep.includes('WalletProvider') &&
            !dep.includes('WalletGate') &&
            !dep.includes('RegisterModal') &&
            !dep.includes('Cargo')
        )
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('@miden-sdk/miden-sdk') ||
            id.includes('node_modules/@miden-sdk/react') ||
            id.includes('@miden-sdk/miden-wallet-adapter') ||
            id.includes('@demox-labs/miden-wallet-adapter')
          ) {
            return 'miden-sdk'
          }
          if (id.includes('react-dom') || id.includes('react-router') || (id.includes('node_modules/react/') && !id.includes('react-dom'))) {
            return 'react-vendor'
          }
          if (
            id.includes('@radix-ui/react-dialog') ||
            id.includes('@radix-ui/react-label') ||
            id.includes('@radix-ui/react-menubar') ||
            id.includes('@radix-ui/react-slot') ||
            id.includes('@radix-ui/react-tooltip') ||
            id.includes('@radix-ui/react-checkbox') ||
            id.includes('@radix-ui/react-separator') ||
            id.includes('@radix-ui/react-accordion')
          ) {
            return 'ui-vendor'
          }
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform/resolvers') ||
            id.includes('/zod/')
          ) {
            return 'form-vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})