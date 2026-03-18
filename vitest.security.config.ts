import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'security',
    environment: 'node',
    include: ['tests/security/**/*.spec.ts'],
    globals: true,
    globalSetup: ['tests/integration/globalSetup.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
