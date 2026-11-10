import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://pre-skool-be.vercel.app',
        changeOrigin: true,
        headers: {
          origin: 'http://localhost:5173',
          referer: 'http://localhost:5173/',
        },
      },
    },
  },
})
