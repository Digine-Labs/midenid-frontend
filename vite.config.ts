import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import {
  MIDEN_ID_CONTRACT_ADDRESS,
  MIDEN_FAUCET_CONTRACT_ADDRESS,
  MIDEN_FAUCET_ID_BECH32,
} from './src/shared/constants'

function emitConfigJson(): Plugin {
  const payload = JSON.stringify(
    {
      contractAddress: MIDEN_ID_CONTRACT_ADDRESS,
      faucetAddress: MIDEN_FAUCET_CONTRACT_ADDRESS,
      faucetId: MIDEN_FAUCET_ID_BECH32,
    },
    null,
    2,
  )
  return {
    name: 'emit-config-json',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'config.json',
        source: payload,
      })
    },
    configureServer(server) {
      server.middlewares.use('/config.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(payload)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), emitConfigJson()],
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
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'miden-wallet': [
            '@miden-sdk/miden-wallet-adapter'
          ],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-slot',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-separator',
            '@radix-ui/react-accordion'
          ],
          'form-vendor': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})