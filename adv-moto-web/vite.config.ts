import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    strictPort: false,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'maplibre': ['maplibre-gl'],
          'antd-mobile': ['antd-mobile'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/services/**', 'src/hooks/**'],
      exclude: [
        'src/services/cloudBase.ts',
        'src/services/dataService.ts',
        'src/hooks/useAuth.tsx',
        'src/hooks/useLazyLoad.ts',
      ],
    }
  }
})
