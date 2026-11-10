/** API bootstrap: listens on `0.0.0.0:3001` (`docs/10_api_contract.md` §2). */

import { buildApp } from './app.js';
import { fileURLToPath } from 'node:url';

try {
  process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3001);

const app = buildApp();

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
