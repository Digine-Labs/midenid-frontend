import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    exclude: ['@miden-sdk/miden-sdk'],
    // Para SDK exclusions — temporarily disabled (dependency issues):
    // "@getpara/aa-alchemy", "@getpara/solana-wallet-connectors", "@getpara/aa-zerodev",
    // "@getpara/aa-biconomy", "@getpara/aa-cdp", "@getpara/aa-porto", "@getpara/aa-gelato",
    // "@getpara/aa-pimlico", "@getpara/aa-thirdweb", "@getpara/aa-rhinestone", "@getpara/aa-safe",
    // "@getpara/evm-wallet-connectors", "@getpara/cosmos-wallet-connectors",
    // "@getpara/aa-ethers", "@getpara/aa-infura", "@getpara/aa-pocket", "@getpara/aa-viem"
    include: ['buffer'],
  },
  assetsInclude: ['**/*.masm'],
  worker: {
    format: 'es'
  },
  build: {
    rollupOptions: {
      // Para SDK externals — temporarily disabled (dependency issues):
      // external: ["@getpara/aa-alchemy", "@getpara/solana-wallet-connectors", "@getpara/aa-zerodev",
      //   "@getpara/aa-biconomy", "@getpara/aa-cdp", "@getpara/aa-porto", "@getpara/aa-gelato",
      //   "@getpara/aa-pimlico", "@getpara/aa-thirdweb", "@getpara/aa-rhinestone", "@getpara/aa-safe",
      //   "@getpara/evm-wallet-connectors", "@getpara/cosmos-wallet-connectors",
      //   "@getpara/aa-ethers", "@getpara/aa-infura", "@getpara/aa-pocket", "@getpara/aa-viem"],
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