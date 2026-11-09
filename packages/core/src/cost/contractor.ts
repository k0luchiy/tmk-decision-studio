/**
 * Thin compatibility shim: the contractor cost model now lives in
 * `./contractor/` so every module stays under the 250-line limit while
 * `./contractor.js` imports keep working.
 */

export * from './contractor/index.js';
