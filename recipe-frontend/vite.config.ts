import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild', // Use esbuild for minification (default)
    assetsDir: 'assets',
    rollupOptions: {
      input: path.resolve(__dirname, 'src/index.html'),
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]' // Hashing for cache busting
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Optional alias for cleaner imports
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"' // Inject environment variables
  }

})
