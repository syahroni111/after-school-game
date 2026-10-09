import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// base './' wajib: itch.io menyajikan game dari subfolder, jadi path harus relatif.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  server: { port: 5273, strictPort: true },
  preview: { port: 4273, strictPort: true },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
