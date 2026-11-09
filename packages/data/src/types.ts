/**
 * Thin compatibility shim: raw dataset shapes now live in `./types/` so every
 * module stays under the 250-line limit while `./types.js` imports keep working.
 */

export * from './types/index.js';
