/**
 * Thin compatibility shim: the in-house cost model now lives in `./inhouse/`
 * so every module stays under the 250-line limit while `./inhouse.js` imports
 * keep working.
 */

export * from './inhouse/index.js';
