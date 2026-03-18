import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'integration',
    environment: 'node',
    include: ['tests/integration/**/*.spec.ts'],
    globals: true,
    globalSetup: ['tests/integration/globalSetup.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});