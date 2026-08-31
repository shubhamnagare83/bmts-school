import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Split vendor code out of the app bundle. Without this the whole app ships
    // as one ~2 MB file, which is slow on the shared hosting this deploys to and
    // means any code change busts the cache for every dependency too.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Only the large, self-contained libraries are pulled out. Anything
          // unmatched deliberately stays in the entry chunk: a catch-all
          // "vendor" chunk creates a circular dependency with vendor-react
          // (vendor -> vendor-react -> vendor), which Rollup warns about and
          // which can break module initialisation order at runtime.
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          // Charting pulls in d3 + lodash and is only used on analytics pages.
          if (/[\\/]node_modules[\\/](recharts|d3-|victory|lodash)/.test(id)) {
            return 'vendor-charts';
          }
          if (/[\\/]node_modules[\\/](lucide-react)[\\/]/.test(id)) {
            return 'vendor-icons';
          }
          return undefined;
        },
      },
    },
    // The entry chunk holds the app's own code (~30 admin/faculty/student
    // pages) and gzips to roughly 120 kB. Ceiling set just above that so a
    // genuine regression still surfaces, without failing every build on a
    // warning we have already accounted for.
    chunkSizeWarningLimit: 1200,
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false, // allow fallback if 5173 is busy
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
