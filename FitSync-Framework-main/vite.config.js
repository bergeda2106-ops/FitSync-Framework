import { defineConfig } from 'vite';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  root: '.',
  appType: 'spa',
  server: {
    port: 8080,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});
