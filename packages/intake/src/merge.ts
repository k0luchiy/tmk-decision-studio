/**
 * Thin compatibility shim: the merge now lives in `./merge/` so every module
 * stays under the 250-line limit while `./merge.js` imports keep working.
 */

export * from './merge/index.js';
