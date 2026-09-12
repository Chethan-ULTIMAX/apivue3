import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * APIVue is currently deployed as a GitHub Pages project site at
 * https://chethan-ultimax.github.io/APIVue/.
 *
 * Keep the base path explicit for Pages while allowing local development
 * to continue using `/`. React Router derives its basename from this value.
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/APIVue/' : '/',

  server: {
    host: '::',
    port: 8080,
    hmr: {
      overlay: false,
    },
  },

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
      '@tanstack/query-core',
    ],
  },
}));
