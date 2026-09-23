import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSupabaseApiPlugin } from './server/viteSupabaseApiPlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    viteSupabaseApiPlugin(),
  ],
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  worker: {
    format: 'es',
  },
  server: {
    proxy: {
      '/api/supabase-mgmt-proxy': {
        target: 'https://api.supabase.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/supabase-mgmt-proxy/, ''),
        secure: true,
      },
    },
    watch: {
      ignored: ['**/release/**', '**/dist/**', '**/*.tmp', '**/.git/**'],
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
