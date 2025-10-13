/**
 * Vite Configuration File
 *
 * This configures Vite for building and developing the React frontend.
 *
 * Key Configuration:
 * - Uses React plugin for JSX support and Fast Refresh
 * - Sets root directory to './client' where React source code lives
 * - Builds output to '../front_end' directory (served by Express in production)
 * - Development server runs on port 5173
 * - Proxies API requests to backend server on port 3000
 */

import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Enable React plugin for JSX and Fast Refresh
  plugins: [react()],

  // Set root directory for the client source files
  root: './client',

  // Path resolution for @ imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },

  // Build configuration
  build: {
    outDir: '../front_end', // Output directory for production build
    emptyOutDir: true,      // Clean output directory before building
  },

  // Development server configuration
  server: {
    port: 5173, // Development server port

    // Proxy API requests to backend server
    // This allows frontend to make requests to /api/* which get forwarded to the Express server
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Backend server address
        changeOrigin: true,               // Change origin header to target URL
      }
    }
  }
})
