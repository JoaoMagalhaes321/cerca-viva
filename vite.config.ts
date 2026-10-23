import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5180,
    host: true,
    watch: {
      ignored: ['**/android/**', '**/.android-sdk/**']
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
