import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    watch: {
      // In /home/... on WSL, native file events are best:
      usePolling: false,

      // Prevent rebuild storms from generated/data files:
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/.next/**',
        '**/.cache/**',

        // DB / data files (very relevant to your app):
        '**/*.sqlite',
        '**/*.sqlite3',
        '**/*.db',
        '**/*.db3',
        '**/data/**'
      ]
    }
  }
})
