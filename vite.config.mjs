import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  oxc: false,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || 8080}`,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    // Vite 8 uses Rolldown. Currently there may be a gap configuring .js as jsx for scanner.
    // Keeping esbuildOptions for now to ensure scanner works.
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    // The only chunk over 500 kB is TemplateApp (~1.1 MB): the template/demo
    // seed library JSON. It is lazy-loaded in template mode only, so real
    // users never fetch it. Everything else stays well under the default.
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        // Vendor chunks keep stable content hashes across app releases, so
        // returning users re-download only the app chunk. (Vite 8 / Rolldown:
        // `codeSplitting.groups` replaces rollupOptions.output.manualChunks.)
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
            },
            {
              name: 'vendor-firebase-firestore',
              test: /node_modules[\\/](@firebase[\\/]firestore|firebase[\\/]firestore)[\\/]/,
              priority: 30,
            },
            {
              name: 'vendor-firebase-auth',
              test: /node_modules[\\/](@firebase[\\/]auth|firebase[\\/]auth)[\\/]/,
              priority: 30,
            },
            {
              name: 'vendor-firebase',
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor-lucide',
              test: /node_modules[\\/]lucide-react[\\/]/,
              priority: 40,
            },
          ],
        },
      },
    },
  },
});
