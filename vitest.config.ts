import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      instances: [
        {
          browser: 'chromium',
          headless: true
        },
      ],
      provider: 'playwright',
    },
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@demox-labs/miden-sdk'],
    include: ['buffer'],
  },
  assetsInclude: ['**/*.wasm', '**/*.masm'],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
