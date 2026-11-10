import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Στο GitHub Pages η εφαρμογή ζει στο https://christsarch.github.io/grocery-receipts-gr/
// οπότε στο build χρειάζεται αυτό το "base". Στον υπολογιστή σου (npm run dev)
// τρέχει απλά στο http://localhost:5173/
// (Το ίδιο ισχύει και για το npm run preview, που σερβίρει το έτοιμο build.)
export default defineConfig(({ command, isPreview }) => ({
  plugins: [
    react(),
    // PWA: η εφαρμογή εγκαθίσταται στην αρχική οθόνη και ανοίγει χωρίς internet.
    // Το plugin φτιάχνει στο build δύο αρχεία: το manifest (όνομα, εικονίδια, χρώματα)
    // και τον service worker (κρατάει αντίγραφο της εφαρμογής στο κινητό).
    VitePWA({
      // Όταν ανεβάζεις νέα έκδοση, το κινητό την παίρνει μόνο του στο επόμενο άνοιγμα
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Αποδείξεις',
        short_name: 'Αποδείξεις',
        description: 'Τα έξοδά σου στο σούπερ μάρκετ, από τις ηλεκτρονικές αποδείξεις.',
        lang: 'el',
        display: 'standalone', // ανοίγει σαν εφαρμογή, χωρίς τη μπάρα του browser
        theme_color: '#111715',
        background_color: '#111715',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          // "maskable": το Android το κόβει σε κύκλο ή άλλο σχήμα, οπότε το σχέδιο είναι στο κέντρο
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Τι κρατάει ο service worker για χρήση χωρίς internet: όλη την εφαρμογή,
        // μαζί με το WebAssembly της ZXing (για σάρωση QR και χωρίς σύνδεση)
        globPatterns: ['**/*.{js,css,html,wasm,svg,png}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  base: command === 'build' || isPreview ? '/grocery-receipts-gr/' : '/',
  // Τεστ (Vitest): μόνο της εφαρμογής. Ο Worker έχει δικά του τεστ, στον φάκελο worker
  test: {
    include: ['src/**/*.test.js'],
  },
}))
