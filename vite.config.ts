import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',  // слухати всі інтерфейси, щоб Docker міг пробрасувати порт
    port: 5173,
    watch: {
      usePolling: true,  // потрібно для відстеження змін файлів через volume mount
    },
  },
});
