import { defineConfig } from 'vitest/config';

// base './' wajib: itch.io menyajikan game dari subfolder, jadi path harus relatif.
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  server: { port: 5273, strictPort: true },
  preview: { port: 4273, strictPort: true },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
