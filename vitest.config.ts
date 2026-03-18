import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'unit',
    environment: 'node',
    include: ['tests/unit/**/*.spec.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/service/**/*.ts'],
    },
  },
});