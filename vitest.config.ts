import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['shared/**/*.test.ts'],
    passWithNoTests: false,
    hookTimeout: 60000,
    testTimeout: 30000,
  },
});
