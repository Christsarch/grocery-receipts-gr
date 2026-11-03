import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Στο GitHub Pages η εφαρμογή ζει στο https://christsarch.github.io/grocery-receipts-gr/
// οπότε στο build χρειάζεται αυτό το "base". Στον υπολογιστή σου (npm run dev)
// τρέχει απλά στο http://localhost:5173/
// (Το ίδιο ισχύει και για το npm run preview, που σερβίρει το έτοιμο build.)
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  base: command === 'build' || isPreview ? '/grocery-receipts-gr/' : '/',
}))
