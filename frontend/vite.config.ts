import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('@mui/icons-material')) {
            return 'mui-icons'
          }

          if (
            id.includes('@mui') ||
            id.includes('@emotion') ||
            id.includes('react-router') ||
            id.includes('react') ||
            id.includes('scheduler')
          ) {
            return 'ui-vendor'
          }

          if (id.includes('@supabase')) {
            return 'supabase'
          }

          if (id.includes('@tanstack')) {
            return 'query'
          }

          if (id.includes('i18next')) {
            return 'i18n'
          }

          if (id.includes('axios')) {
            return 'network'
          }

          return undefined
        },
      },
    },
  },
})
