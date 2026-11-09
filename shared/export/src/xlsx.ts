/**
 * Thin compatibility shim: XLSX export now lives in `./xlsx/` so every module
 * stays under the 250-line limit while `./xlsx.js` imports keep working.
 */

export * from './xlsx/index.js';
