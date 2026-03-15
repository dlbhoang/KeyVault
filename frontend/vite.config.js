import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { proxy: { '/api': 'https://key-vault-git-main-dlbhoangs-projects.vercel.app/' } },
})
