import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', 
  build: {
    outDir: 'dist', // MANTÉM DIST: O servidor espera os ficheiros aqui
    assetsDir: 'assets',
    emptyOutDir: true, // Limpa a pasta antes de cada build para evitar ficheiros corrompidos
    sourcemap: false
  },
  server: {
    port: 3000
  }
});