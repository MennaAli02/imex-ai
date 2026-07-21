import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const odooUrl = env.VITE_ODOO_URL || 'http://localhost:8017'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Forward all /api/ris/* calls to Odoo (RIS REST API)
        '/api': {
          target: odooUrl,
          changeOrigin: true,
          secure: false,
        },
        // Forward Odoo session auth + JSON-RPC calls
        '/web': {
          target: odooUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

