import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Pages builds use the repo name as base; the single-file build uses relative paths.
const single = process.env.SINGLE === '1';

export default defineConfig({
  base: single ? './' : (process.env.PAGES_BASE ?? '/PageWright/'),
  publicDir: single ? false : 'public',
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
  build: {
    outDir: single ? 'dist-single' : 'dist',
    // Fonts must inline so the single file works from disk.
    assetsInlineLimit: single ? 100_000_000 : 4096,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    css: { include: [/nsw-design-system.*\.css/] },
  },
});
