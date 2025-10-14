import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@Shared': path.resolve(__dirname, '../Shared')
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/admin': 'http://localhost:3000'
    }
  }
})
