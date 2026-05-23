import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true, 
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // <--- Forces listening on all IPs (Crucial for tunnels)
    port: 5173,
    strictPort: true, // <--- Crashes if port 5173 is busy (good for debugging)
    allowedHosts: true,
  },
})