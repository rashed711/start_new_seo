
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Increase the warning limit slightly (optional, but reduces noise for reasonably sized chunks)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Separate Firebase SDKs into their own chunk
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'firebase';
            }
            // Separate React and Routing into their own chunk
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            // Put other third-party libraries in a vendor chunk
            return 'vendor';
          }
        },
      },
    },
  },
});
