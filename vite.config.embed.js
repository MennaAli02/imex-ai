import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    outDir: 'dist-embed',
    lib: {
      entry: 'src/embed.jsx',
      name: 'RisApp',
      formats: ['iife'],
      fileName: () => 'ris-embed.js'
    },
    rollupOptions: {
      output: { assetFileNames: 'ris-embed.[ext]' }
    }
  }
})