import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist"
  },
  server: {
    historyApiFallback: true,
    // Socket.IO: browser requests same-origin /socket.io → proxied to API (avoids CORS on localhost)
    proxy: {
      "/socket.io": {
        target: "https://dhansourcecapital.com",
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },

})