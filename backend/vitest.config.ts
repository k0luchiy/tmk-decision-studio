import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

function sharedPackage(name: string): string {
  return path.join(here, '..', 'shared', name, 'src', 'index.ts');
}

export default defineConfig({
  resolve: {
    alias: {
      '@app/contract': sharedPackage('contract'),
      '@app/core': sharedPackage('core'),
      '@app/data': sharedPackage('data'),
      '@app/export': sharedPackage('export'),
      '@app/intake': sharedPackage('intake'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
